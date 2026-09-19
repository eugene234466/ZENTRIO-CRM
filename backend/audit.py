"""audit.py — best-effort audit trail for sensitive actions.

Uses a SAVEPOINT so a logging failure never breaks (or pollutes) the
request's own transaction. Callers' explicit commits persist the entry.
"""

from flask_login import current_user

from extensions import db
from models import AuditLog


def audit(action, target_type="", target_id=None, detail=""):
    try:
        actor_id = None
        try:
            if getattr(current_user, "is_authenticated", False):
                actor_id = current_user.id
        except Exception:
            actor_id = None

        with db.session.begin_nested():
            db.session.add(
                AuditLog(
                    actor_id=actor_id,
                    action=action,
                    target_type=target_type or "",
                    target_id=target_id,
                    detail=detail or "",
                )
            )
    except Exception:
        pass
