from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from audit import audit
from extensions import db, limiter, rate_limit_user_key
from models import Message
from permissions import (
    ACTION_MESSAGES_CREATE,
    ACTION_MESSAGES_VIEW,
    ACTION_PIN_MESSAGES,
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_OWNER,
    can,
    role_of,
)


messages_bp = Blueprint("messages", __name__, url_prefix="/api/messages")
MAX_CONTENT_LENGTH = 5000
ELEVATED_DELETE_ROLES = {ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER}


def _message_to_dict(message):
    author = message.author_user
    return {
        "id": message.id,
        "content": message.content,
        "author": {
            "id": author.id,
            "username": author.username,
            "role": role_of(author),
        },
        "is_pinned": bool(message.is_pinned),
        "created_at": message.created_at.isoformat() if message.created_at else None,
        "updated_at": message.updated_at.isoformat() if message.updated_at else None,
    }


def _active_message(message_id):
    return Message.query.filter(
        Message.id == message_id,
        Message.deleted_at.is_(None),
    ).first()


def _content_from_request():
    data = request.get_json(silent=True) or {}
    content = data.get("content")
    if not isinstance(content, str) or not content.strip():
        return None, ("Content is required.", 400)
    content = content.strip()
    if len(content) > MAX_CONTENT_LENGTH:
        return None, (f"Content must be {MAX_CONTENT_LENGTH} characters or fewer.", 400)
    return content, None


@messages_bp.route("", methods=["GET"])
@login_required
def list_messages():
    if not can(current_user, ACTION_MESSAGES_VIEW):
        return jsonify({"error": "You don't have access."}), 403

    messages = Message.query.filter(
        Message.deleted_at.is_(None),
    ).order_by(
        Message.is_pinned.desc(),
        Message.created_at.desc(),
        Message.id.desc(),
    ).all()
    return jsonify({"messages": [_message_to_dict(message) for message in messages]}), 200


@messages_bp.route("", methods=["POST"])
@login_required
@limiter.limit("60 per hour", key_func=rate_limit_user_key)
def create_message():
    if not can(current_user, ACTION_MESSAGES_CREATE):
        return jsonify({"error": "You don't have access."}), 403

    content, error = _content_from_request()
    if error:
        return jsonify({"error": error[0]}), error[1]

    message = Message(content=content, author_id=current_user.id)
    db.session.add(message)
    db.session.commit()
    audit("message_create", "message", message.id)
    db.session.commit()
    return jsonify(_message_to_dict(message)), 201


@messages_bp.route("/<int:message_id>", methods=["PATCH"])
@login_required
def update_message(message_id):
    message = _active_message(message_id)
    if message is None:
        return jsonify({"error": "Message not found."}), 404
    if message.author_id != current_user.id:
        return jsonify({"error": "You can only edit your own messages."}), 403

    content, error = _content_from_request()
    if error:
        return jsonify({"error": error[0]}), error[1]

    message.content = content
    message.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    audit("message_edit", "message", message.id)
    db.session.commit()
    return jsonify(_message_to_dict(message)), 200


@messages_bp.route("/<int:message_id>", methods=["DELETE"])
@login_required
def delete_message(message_id):
    message = _active_message(message_id)
    if message is None:
        return jsonify({"error": "Message not found."}), 404

    if (
        message.author_id != current_user.id
        and role_of(current_user) not in ELEVATED_DELETE_ROLES
    ):
        return jsonify({"error": "You can only delete your own messages."}), 403

    message.deleted_at = datetime.now(timezone.utc)
    db.session.commit()
    audit("message_delete", "message", message.id)
    db.session.commit()
    return jsonify({"message": "Message deleted."}), 200


@messages_bp.route("/<int:message_id>/pin", methods=["PATCH"])
@login_required
def toggle_pin_message(message_id):
    message = _active_message(message_id)
    if message is None:
        return jsonify({"error": "Message not found."}), 404
    if not can(current_user, ACTION_PIN_MESSAGES):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}
    if not isinstance(data.get("is_pinned"), bool):
        return jsonify({"error": "'is_pinned' must be a boolean."}), 400

    message.is_pinned = data["is_pinned"]
    db.session.commit()
    audit(
        "message_pin" if message.is_pinned else "message_unpin",
        "message",
        message.id,
    )
    db.session.commit()
    return jsonify(_message_to_dict(message)), 200
