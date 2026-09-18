"""
leads.py
Bismark's part: Lead/deal creation, editing, deletion, and listing.
"""
# I : Gibson, added imports and codes so i can work with them 
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db
from models import Deal
from permissions import (
    can,
    ACTION_LEADS_VIEW,
    ACTION_LEADS_ADD,
    ACTION_LEADS_EDIT,
    ACTION_LEADS_DELETE,
)

leads_bp = Blueprint("leads", __name__)


@leads_bp.route("/leads", methods=["POST"])
@login_required
def create_lead():
    if not can(current_user, ACTION_LEADS_ADD):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}
    title = data.get("title")
    contact_id = data.get("contact_id")
    value = data.get("value", 0)

    if not title or not contact_id:
        return jsonify({"error": "'title' and 'contact_id' are required"}), 400

    lead = Deal(
        title=title,
        contact_id=contact_id,
        value=value,
        stage="NEW",
        assigned_to_id=data.get("assigned_to_id") or current_user.id,
    )

    db.session.add(lead)
    db.session.commit()
    return jsonify(lead.to_dict()), 201


@leads_bp.route("/leads/<int:deal_id>", methods=["PATCH"])
@login_required
def update_lead_details(deal_id):
    lead = Deal.query.get(deal_id)
    if not lead:
        return jsonify({"error": "Lead not found"}), 404

    if not can(current_user, ACTION_LEADS_EDIT, lead):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}

    if "title" in data:
        lead.title = data["title"]
    if "value" in data:
        lead.value = data["value"]
    if "contact_id" in data:
        lead.contact_id = data["contact_id"]
    if "assigned_to_id" in data:
        lead.assigned_to_id = data["assigned_to_id"]

    lead.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(lead.to_dict()), 200


@leads_bp.route("/leads/<int:deal_id>", methods=["DELETE"])
@login_required
def delete_lead(deal_id):
    lead = Deal.query.get(deal_id)
    if not lead:
        return jsonify({"error": "Lead not found"}), 404

    if not can(current_user, ACTION_LEADS_DELETE, lead):
        return jsonify({"error": "You don't have access."}), 403

    db.session.delete(lead)
    db.session.commit()
    return jsonify({"message": "Lead deleted"}), 200


@leads_bp.route("/leads", methods=["GET"])
@login_required
def list_leads():
    query = Deal.query

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

    visible = [lead for lead in paginated.items if can(current_user, ACTION_LEADS_VIEW, lead)]

    return jsonify({
        "leads": [lead.to_dict() for lead in visible],
        "page": page,
        "per_page": per_page,
        "total": paginated.total,
    }), 200