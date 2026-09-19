from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from models import AuditLog
from permissions import can, ACTION_AUDIT_VIEW

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/audit-log", methods=["GET"])
@login_required
def list_audit_log():
    if not can(current_user, ACTION_AUDIT_VIEW):
        return jsonify({"error": "You don't have access."}), 403

    limit = request.args.get("limit", 50, type=int)
    limit = max(1, min(limit, 200))
    action = (request.args.get("action") or "").strip()

    query = AuditLog.query
    if action:
        query = query.filter(AuditLog.action == action)

    entries = query.order_by(AuditLog.id.desc()).limit(limit).all()

    return jsonify({
        "entries": [
            {
                "id": e.id,
                "actor_id": e.actor_id,
                "action": e.action,
                "target_type": e.target_type,
                "target_id": e.target_id,
                "detail": e.detail,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in entries
        ]
    }), 200
