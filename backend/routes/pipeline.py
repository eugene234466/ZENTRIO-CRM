"""
pipeline.py
Pipeline stage-transition logic for the Leads/Pipeline module.
"""

from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db
from models import Deal, StageLog, live
from permissions import (
    can,
    ACTION_LEADS_VIEW,
    ACTION_LEADS_MOVE,
)

pipeline_bp = Blueprint("pipeline", __name__)

VALID_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]

# Which stages a deal is allowed to move to from its current stage
ALLOWED_TRANSITIONS = {
    "NEW": ["CONTACTED", "LOST"],
    "CONTACTED": ["QUALIFIED", "PROPOSAL", "LOST"],
    "QUALIFIED": ["PROPOSAL", "LOST"],
    "PROPOSAL": ["WON", "LOST"],
    "WON": [],   # terminal state
    "LOST": [],  # terminal state
}


def can_transition(current_stage: str, new_stage: str) -> bool:
    """Check whether a stage transition is allowed."""
    if new_stage not in VALID_STAGES:
        return False
    return new_stage in ALLOWED_TRANSITIONS.get(current_stage, [])


@pipeline_bp.route("/deals/<int:deal_id>/stage", methods=["PATCH"])
@login_required
def move_deal_stage(deal_id):
    """Move a deal to a new pipeline stage, enforcing valid transitions."""
    data = request.get_json(silent=True) or {}
    new_stage = data.get("stage")

    if not new_stage:
        return jsonify({"error": "Missing 'stage' in request body"}), 400

    deal = live(Deal).filter_by(id=deal_id).first()
    if not deal:
        return jsonify({"error": "Deal not found"}), 404

    if not can(current_user, ACTION_LEADS_MOVE, deal):
        return jsonify({"error": "You don't have access."}), 403

    old_stage = deal.stage

    if not can_transition(old_stage, new_stage):
        return jsonify({
            "error": f"Cannot move deal from '{old_stage}' to '{new_stage}'"
        }), 400

    deal.stage = new_stage
    deal.updated_at = datetime.now(timezone.utc)

    log_entry = StageLog(
        deal_id=deal.id,
        old_stage=old_stage,
        new_stage=new_stage,
        changed_at=datetime.now(timezone.utc),
    )

    db.session.add(log_entry)
    db.session.commit()
    return jsonify(deal.to_dict()), 200


@pipeline_bp.route("/pipeline", methods=["GET"])
@login_required
def get_pipeline_view():
    """Return open deals grouped by stage, for rendering the pipeline board."""
    open_stages = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL"]
    deals = live(Deal).filter(Deal.stage.in_(open_stages)).all()

    grouped = {stage: [] for stage in open_stages}
    for deal in deals:
        if can(current_user, ACTION_LEADS_VIEW, deal):
            grouped[deal.stage].append(deal.to_dict())

    return jsonify(grouped), 200


@pipeline_bp.route("/deals/<int:deal_id>/history", methods=["GET"])
@login_required
def get_stage_history(deal_id):
    """Return the stage-change audit trail for a single deal."""
    deal = live(Deal).filter_by(id=deal_id).first()
    if not deal:
        return jsonify({"error": "Deal not found"}), 404

    if not can(current_user, ACTION_LEADS_VIEW, deal):
        return jsonify({"error": "You don't have access."}), 403

    logs = (
        StageLog.query
        .filter_by(deal_id=deal_id)
        .order_by(StageLog.changed_at.asc())
        .all()
    )

    history = [
        {
            "old_stage": log.old_stage,
            "new_stage": log.new_stage,
            "changed_at": log.changed_at.isoformat(),
        }
        for log in logs
    ]

    return jsonify({"deal_id": deal_id, "history": history}), 200