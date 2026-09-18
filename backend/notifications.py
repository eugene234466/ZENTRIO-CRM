from datetime import date
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db
from permissions import (
    can,
    ACTION_INVOICES_VIEW,
    ACTION_LEADS_VIEW,
)
from models import Notification, NotificationPreference

notifications_bp = Blueprint("notifications", __name__)

try:
    from models import Invoice
except ImportError:
    Invoice = None

try:
    from models import Deal as Lead
except ImportError:
    Lead = None

try:
    from models import Task
except ImportError:
    Task = None

try:
    from models import Message
except ImportError:
    Message = None


def get_pref(user_id):
    pref = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.session.add(pref)
        db.session.commit()
    return pref


def add_notification(user_id, kind, title, body="", link=""):
    old = Notification.query.filter_by(
        user_id=user_id,
        kind=kind,
        link=link,
    ).first()

    if old:
        return

    item = Notification(
        user_id=user_id,
        kind=kind,
        title=title,
        body=body,
        link=link,
    )
    db.session.add(item)
    db.session.commit()


@notifications_bp.route("/notifications", methods=["GET"])
@login_required
def list_notifications():
    pref = get_pref(current_user.id)

    if pref.overdue_invoices and Invoice is not None:
        today = date.today()
        invoices = Invoice.query.filter(Invoice.due_date < today).all()

        for inv in invoices:
            if not can(current_user, ACTION_INVOICES_VIEW, inv):
                continue

            if getattr(inv, "status", "").lower() in ("paid", "void"):
                continue

            add_notification(
                current_user.id,
                "overdue_invoice",
                f"Overdue invoice {inv.invoice_number}",
                f"Client: {getattr(inv, 'client_name', '')}",
                f"/invoices/{inv.id}",
            )

    if pref.assigned_leads and Lead is not None:
        leads = Lead.query.filter_by(assigned_to_id=current_user.id).all()

        for lead in leads:
            if not can(current_user, ACTION_LEADS_VIEW, lead):
                continue

            add_notification(
                current_user.id,
                "assigned_lead",
                f"Lead assigned: {lead.title}",
                f"Stage: {lead.stage}",
                f"/leads/{lead.id}",
            )

    if pref.assigned_tasks and Task is not None:
        tasks = Task.query.filter_by(assigned_to_id=current_user.id).all()

        for task in tasks:
            add_notification(
                current_user.id,
                "assigned_task",
                f"Task assigned: {task.title}",
                "",
                f"/tasks/{task.id}",
            )

    if pref.pinned_messages and Message is not None:
        messages = Message.query.filter_by(is_pinned=True).all()

        for msg in messages:
            add_notification(
                current_user.id,
                "pinned_message",
                "Pinned message",
                getattr(msg, "content", ""),
                "/board",
            )

    items = (
        Notification.query
        .filter_by(user_id=current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return jsonify({
        "notifications": [
            {
                "id": n.id,
                "kind": n.kind,
                "title": n.title,
                "body": n.body,
                "link": n.link,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in items
        ]
    }), 200


@notifications_bp.route("/notifications/<int:note_id>/read", methods=["PATCH"])
@login_required
def mark_read(note_id):
    note = Notification.query.get(note_id)

    if not note or note.user_id != current_user.id:
        return jsonify({"error": "Notification not found"}), 404

    note.is_read = True
    db.session.commit()

    return jsonify({"msg": "Marked as read"}), 200


@notifications_bp.route("/notifications/read-all", methods=["PATCH"])
@login_required
def mark_all_read():
    Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False,
    ).update({"is_read": True})

    db.session.commit()
    return jsonify({"msg": "All marked as read"}), 200


@notifications_bp.route("/notifications/preferences", methods=["GET", "PATCH"])
@login_required
def notification_preferences():
    pref = get_pref(current_user.id)

    if request.method == "PATCH":
        data = request.get_json(silent=True) or {}

        for field in (
            "overdue_invoices",
            "assigned_leads",
            "assigned_tasks",
            "pinned_messages",
        ):
            if field in data:
                setattr(pref, field, bool(data[field]))

        db.session.commit()

    return jsonify({
        "overdue_invoices": pref.overdue_invoices,
        "assigned_leads": pref.assigned_leads,
        "assigned_tasks": pref.assigned_tasks,
        "pinned_messages": pref.pinned_messages,
    }), 200