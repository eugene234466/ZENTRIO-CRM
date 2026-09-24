"""
leads.py
Lead/deal creation, editing, deletion, and listing.
Uses the extended Deal model so the frontend Lead shape round-trips.
"""

from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db, limiter, rate_limit_user_key
from models import Deal, live
from audit import audit
from permissions import (
    can,
    ACTION_ASSIGN,
    ACTION_LEADS_VIEW,
    ACTION_LEADS_ADD,
    ACTION_LEADS_EDIT,
    ACTION_LEADS_DELETE,
)

leads_bp = Blueprint("leads", __name__)


# ---------------------------------------------------------------------------
# Stage mapping
# Frontend sends title-case stage names; backend stores uppercase.
# 'Qualified' exists only on the frontend; it gets its own backend constant.
# ---------------------------------------------------------------------------

FE_TO_BE_STAGE = {
    "New": "NEW",
    "Contacted": "CONTACTED",
    "Qualified": "QUALIFIED",
    "Proposal Sent": "PROPOSAL",
    "Won": "WON",
    "Lost": "LOST",
}

BE_TO_FE_STAGE = {v: k for k, v in FE_TO_BE_STAGE.items()}


def _stage_to_backend(value: str) -> str:
    """Accept either form; return backend-canonical uppercase."""
    if not value:
        return "NEW"
    if value in FE_TO_BE_STAGE:
        return FE_TO_BE_STAGE[value]
    upper = value.upper()
    if upper in BE_TO_FE_STAGE:
        return upper
    return "NEW"


def _lead_to_dict(lead: Deal) -> dict:
    """Shape the Deal row the way the frontend Lead type expects."""
    return {
        "id": str(lead.id),
        "name": lead.name or "",
        "company": lead.company or "",
        "email": lead.email or "",
        "value": lead.value or 0,
        "stage": BE_TO_FE_STAGE.get(lead.stage, "New"),
        "temperature": lead.temperature or "Warm",
        "source": lead.source or "Direct",
        "expectedCloseDate": lead.expected_close_date or "",
        "notes": lead.notes or "",
        "createdAt": (
            lead.created_at.isoformat()
            if lead.created_at
            else ""
        ),
        "updatedAt": (
            lead.updated_at.isoformat()
            if lead.updated_at
            else ""
        ),
    }


@leads_bp.route("/leads", methods=["POST"])
@login_required
@limiter.limit("60 per hour", key_func=rate_limit_user_key)
def create_lead():
    if not can(current_user, ACTION_LEADS_ADD):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}

    # Frontend Lead has no title; fall back to name if title is missing.
    title = data.get("title") or data.get("name")
    if not title:
        return jsonify({"error": "'name' is required"}), 400

    # Frontend Lead has no contact_id; that constraint was relaxed in models.
    contact_id = data.get("contact_id")

    value = data.get("value", 0)

    assigned_to_id = data.get("assigned_to_id") or current_user.id
    if assigned_to_id != current_user.id and not can(current_user, ACTION_ASSIGN):
        return jsonify({"error": "You don't have access."}), 403

    stage = _stage_to_backend(data.get("stage") or "New")

    lead = Deal(
        title=title,
        contact_id=contact_id,
        value=value,
        stage=stage,
        assigned_to_id=assigned_to_id,
        name=data.get("name") or title,
        company=data.get("company") or None,
        email=data.get("email") or None,
        temperature=data.get("temperature") or "Warm",
        source=data.get("source") or "Direct",
        expected_close_date=data.get("expectedCloseDate")
            or data.get("expected_close_date")
            or None,
        notes=data.get("notes") or None,
    )

    db.session.add(lead)
    db.session.commit()

    audit(
        "lead_create",
        "deal",
        lead.id,
        f"title={title!r} assigned_to_id={assigned_to_id}",
    )
    db.session.commit()

    return jsonify(_lead_to_dict(lead)), 201


@leads_bp.route("/leads/<int:deal_id>", methods=["PATCH"])
@login_required
def update_lead_details(deal_id):
    lead = live(Deal).filter_by(id=deal_id).first()
    if not lead:
        return jsonify({"error": "Lead not found"}), 404

    if not can(current_user, ACTION_LEADS_EDIT, lead):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}

    if "title" in data:
        lead.title = data["title"]
    if "name" in data:
        lead.name = data["name"]
    if "company" in data:
        lead.company = data["company"] or None
    if "email" in data:
        lead.email = data["email"] or None
    if "value" in data:
        lead.value = data["value"]
    if "temperature" in data:
        lead.temperature = data["temperature"] or "Warm"
    if "source" in data:
        lead.source = data["source"] or "Direct"
    if "expectedCloseDate" in data or "expected_close_date" in data:
        lead.expected_close_date = (
            data.get("expectedCloseDate")
            or data.get("expected_close_date")
            or None
        )
    if "notes" in data:
        lead.notes = data["notes"] or None
    if "stage" in data:
        lead.stage = _stage_to_backend(data["stage"])
    if "contact_id" in data:
        lead.contact_id = data["contact_id"]

    if "assigned_to_id" in data:
        if data["assigned_to_id"] != lead.assigned_to_id:
            if not can(current_user, ACTION_ASSIGN):
                return jsonify({"error": "You don't have access."}), 403
            audit(
                "lead_reassign",
                "deal",
                lead.id,
                f"assigned_to_id {lead.assigned_to_id} -> {data['assigned_to_id']}",
            )
        lead.assigned_to_id = data["assigned_to_id"]

    lead.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify(_lead_to_dict(lead)), 200


@leads_bp.route("/leads/<int:deal_id>", methods=["DELETE"])
@login_required
def delete_lead(deal_id):
    lead = live(Deal).filter_by(id=deal_id).first()
    if not lead:
        return jsonify({"error": "Lead not found"}), 404

    if not can(current_user, ACTION_LEADS_DELETE, lead):
        return jsonify({"error": "You don't have access."}), 403

    lead.deleted_at = datetime.now(timezone.utc)
    db.session.commit()

    audit("lead_delete", "deal", deal_id, f"title={lead.title!r}")
    db.session.commit()

    return jsonify({"message": "Lead deleted"}), 200


@leads_bp.route("/leads/<int:deal_id>/restore", methods=["PATCH"])
@login_required
def restore_lead(deal_id):
    lead = Deal.query.filter(
        Deal.id == deal_id,
        Deal.deleted_at.isnot(None),
    ).first()
    if not lead:
        return jsonify({"error": "Lead not found"}), 404

    if not can(current_user, ACTION_LEADS_DELETE, lead):
        return jsonify({"error": "You don't have access."}), 403

    lead.deleted_at = None
    db.session.commit()

    audit("lead_restore", "deal", deal_id, f"title={lead.title!r}")
    db.session.commit()

    return jsonify(_lead_to_dict(lead)), 200


@leads_bp.route("/leads", methods=["GET"])
@login_required
def list_leads():
    query = live(Deal)

    contact_id = request.args.get("contact_id", type=int)
    min_value = request.args.get("min_value", type=float)
    max_value = request.args.get("max_value", type=float)

    if contact_id is not None:
        query = query.filter(Deal.contact_id == contact_id)
    if min_value is not None:
        query = query.filter(Deal.value >= min_value)
    if max_value is not None:
        query = query.filter(Deal.value <= max_value)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    paginated = query.order_by(Deal.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    visible = [
        lead for lead in paginated.items
        if can(current_user, ACTION_LEADS_VIEW, lead)
    ]

    return jsonify({
        "leads": [_lead_to_dict(lead) for lead in visible],
        "page": page,
        "per_page": per_page,
        "total": paginated.total,
    }), 200