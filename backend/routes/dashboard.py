"""
dashboard.py
Bismark's part: Dashboard summary and recent activity aggregation.
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import func

from extensions import db
from models import Deal, live
from permissions import (
    can,
    ACTION_REVENUE,
    ACTION_LEADS_VIEW,
)

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard/summary", methods=["GET"])
@login_required
def get_dashboard_summary():
    """Return headline numbers for the dashboard."""
    if not can(current_user, ACTION_REVENUE):
        return jsonify({"error": "You don't have access."}), 403

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_deals = live(Deal).count()

    open_value = (
        db.session.query(func.coalesce(func.sum(Deal.value), 0))
        .filter(Deal.deleted_at.is_(None))
        .filter(Deal.stage.notin_(["WON", "LOST"]))
        .scalar()
    )

    won_this_month = live(Deal).filter(
        Deal.stage == "WON", Deal.updated_at >= month_start
    ).count()

    lost_this_month = live(Deal).filter(
        Deal.stage == "LOST", Deal.updated_at >= month_start
    ).count()

    won_total = live(Deal).filter(Deal.stage == "WON").count()
    conversion_rate = (won_total / total_deals * 100) if total_deals else 0

    stage_counts = (
        db.session.query(Deal.stage, func.count(Deal.id), func.coalesce(func.sum(Deal.value), 0))
        .filter(Deal.deleted_at.is_(None))
        .group_by(Deal.stage)
        .all()
    )
    stage_breakdown = {
        stage: {"count": count, "value": float(value)}
        for stage, count, value in stage_counts
    }

    return jsonify({
        "total_deals": total_deals,
        "open_value": float(open_value),
        "won_this_month": won_this_month,
        "lost_this_month": lost_this_month,
        "conversion_rate": round(conversion_rate, 2),
        "stage_breakdown": stage_breakdown,
    }), 200


@dashboard_bp.route("/dashboard/recent-activity", methods=["GET"])
@login_required
def get_recent_activity():
    """Return the most recently updated deals."""
    limit = request.args.get("limit", 10, type=int)

    deals = (
        live(Deal).order_by(Deal.updated_at.desc())
        .limit(limit)
        .all()
    )

    visible = [d for d in deals if can(current_user, ACTION_LEADS_VIEW, d)]
    return jsonify([deal.to_dict() for deal in visible]), 200