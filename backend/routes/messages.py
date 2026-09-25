from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from audit import audit
from extensions import db, limiter, rate_limit_user_key
from models import Message, MessageBoard, MessageBoardMember, User
from permissions import ACTION_MESSAGES_CREATE, ACTION_MESSAGES_VIEW, ACTION_PIN_MESSAGES, ROLE_ADMIN, ROLE_MANAGER, ROLE_OWNER, can, role_of

messages_bp = Blueprint("messages", __name__, url_prefix="/api/boards")
ELEVATED_ROLES = {ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER}
MAX_CONTENT_LENGTH, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH = 5000, 120, 500

def user_data(user):
    return {"id": user.id, "username": user.username, "email": user.email, "role": role_of(user)}

def board_data(board, members=False):
    data = {"id": board.id, "name": board.name, "description": board.description or "", "created_by": user_data(board.created_by), "created_at": board.created_at.isoformat() if board.created_at else None, "updated_at": board.updated_at.isoformat() if board.updated_at else None}
    if members: data["members"] = [user_data(member.user) for member in board.members]
    return data

def message_data(message):
    return {"id": message.id, "board_id": message.board_id, "content": message.content, "author": user_data(message.author_user), "is_pinned": bool(message.is_pinned), "created_at": message.created_at.isoformat() if message.created_at else None, "updated_at": message.updated_at.isoformat() if message.updated_at else None}

def board_or_denial(board_id):
    board = MessageBoard.query.filter_by(id=board_id, deleted_at=None).first()
    if board is None: return None, (jsonify({"error": "Board not found."}), 404)
    if not any(member.user_id == current_user.id for member in board.members):
        return None, (jsonify({"error": "You are not a member of this board."}), 403)
    return board, None

def can_manage(board):
    return board.created_by_id == current_user.id or role_of(current_user) in ELEVATED_ROLES

def content_from_request():
    content = (request.get_json(silent=True) or {}).get("content")
    if not isinstance(content, str) or not content.strip(): return None, ("Content is required.", 400)
    content = content.strip()
    if len(content) > MAX_CONTENT_LENGTH: return None, (f"Content must be {MAX_CONTENT_LENGTH} characters or fewer.", 400)
    return content, None

def requested_member_ids(data):
    ids = data.get("member_ids", [])
    return set(ids) if isinstance(ids, list) and all(isinstance(id, int) for id in ids) else None

def validate_users(ids):
    found = {user.id for user in User.query.filter(User.id.in_(ids)).all()}
    return found == ids

@messages_bp.get("")
@login_required
def list_boards():
    boards = MessageBoard.query.join(MessageBoardMember).filter(MessageBoard.deleted_at.is_(None), MessageBoardMember.user_id == current_user.id).order_by(MessageBoard.updated_at.desc(), MessageBoard.id.desc()).all()
    return jsonify({"boards": [board_data(board) for board in boards]})

@messages_bp.get("/users")
@login_required
def list_users():
    if not can(current_user, ACTION_MESSAGES_VIEW): return jsonify({"error": "You don't have access."}), 403
    return jsonify({"users": [user_data(user) for user in User.query.order_by(User.username).all()]})

@messages_bp.post("")
@login_required
@limiter.limit("30 per hour", key_func=rate_limit_user_key)
def create_board():
    if not can(current_user, ACTION_MESSAGES_CREATE): return jsonify({"error": "You don't have access."}), 403
    data = request.get_json(silent=True) or {}; name = data.get("name"); description = data.get("description", ""); ids = requested_member_ids(data)
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > MAX_NAME_LENGTH: return jsonify({"error": "A board name of 120 characters or fewer is required."}), 400
    if not isinstance(description, str) or len(description.strip()) > MAX_DESCRIPTION_LENGTH: return jsonify({"error": "Description must be 500 characters or fewer."}), 400
    if ids is None: return jsonify({"error": "member_ids must be an array of user IDs."}), 400
    ids.add(current_user.id)
    if not validate_users(ids): return jsonify({"error": "One or more users do not exist."}), 400
    board = MessageBoard(name=name.strip(), description=description.strip(), created_by_id=current_user.id)
    db.session.add(board); db.session.flush()
    db.session.add_all([MessageBoardMember(board_id=board.id, user_id=id, added_by_id=current_user.id) for id in ids])
    db.session.commit(); audit("message_board_create", "message_board", board.id); db.session.commit()
    return jsonify(board_data(board, True)), 201

@messages_bp.get("/<int:board_id>")
@login_required
def get_board(board_id):
    board, denial = board_or_denial(board_id)
    return denial or (jsonify(board_data(board, True)), 200)

@messages_bp.patch("/<int:board_id>")
@login_required
def update_board(board_id):
    board, denial = board_or_denial(board_id)
    if denial: return denial
    if not can_manage(board): return jsonify({"error": "You cannot manage this board."}), 403
    data = request.get_json(silent=True) or {}
    if "name" in data:
        if not isinstance(data["name"], str) or not data["name"].strip() or len(data["name"].strip()) > MAX_NAME_LENGTH: return jsonify({"error": "A board name of 120 characters or fewer is required."}), 400
        board.name = data["name"].strip()
    if "description" in data:
        if not isinstance(data["description"], str) or len(data["description"].strip()) > MAX_DESCRIPTION_LENGTH: return jsonify({"error": "Description must be 500 characters or fewer."}), 400
        board.description = data["description"].strip()
    db.session.commit(); return jsonify(board_data(board, True))

@messages_bp.delete("/<int:board_id>")
@login_required
def delete_board(board_id):
    board, denial = board_or_denial(board_id)
    if denial: return denial
    if not can_manage(board): return jsonify({"error": "You cannot delete this board."}), 403
    board.deleted_at = datetime.now(timezone.utc); db.session.commit(); audit("message_board_delete", "message_board", board.id); db.session.commit()
    return jsonify({"message": "Board deleted."})

@messages_bp.post("/<int:board_id>/members")
@login_required
def add_members(board_id):
    board, denial = board_or_denial(board_id)
    if denial: return denial
    if not can_manage(board): return jsonify({"error": "You cannot manage this board."}), 403
    ids = requested_member_ids(request.get_json(silent=True) or {})
    if not ids: return jsonify({"error": "member_ids must contain at least one user ID."}), 400
    if not validate_users(ids): return jsonify({"error": "One or more users do not exist."}), 400
    existing = {member.user_id for member in board.members}
    db.session.add_all([MessageBoardMember(board_id=board.id, user_id=id, added_by_id=current_user.id) for id in ids - existing])
    db.session.commit(); return jsonify(board_data(board, True))

@messages_bp.delete("/<int:board_id>/members/<int:user_id>")
@login_required
def remove_member(board_id, user_id):
    board, denial = board_or_denial(board_id)
    if denial: return denial
    if not can_manage(board): return jsonify({"error": "You cannot manage this board."}), 403
    if user_id == board.created_by_id: return jsonify({"error": "The board creator cannot be removed."}), 400
    membership = MessageBoardMember.query.filter_by(board_id=board.id, user_id=user_id).first()
    if membership is None: return jsonify({"error": "User is not a board member."}), 404
    db.session.delete(membership); db.session.commit(); return jsonify(board_data(board, True))

@messages_bp.get("/<int:board_id>/messages")
@login_required
def list_messages(board_id):
    if not can(current_user, ACTION_MESSAGES_VIEW): return jsonify({"error": "You don't have access."}), 403
    board, denial = board_or_denial(board_id)
    if denial: return denial
    messages = Message.query.filter_by(board_id=board.id, deleted_at=None).order_by(Message.is_pinned.desc(), Message.created_at.desc(), Message.id.desc()).all()
    return jsonify({"messages": [message_data(message) for message in messages]})

@messages_bp.post("/<int:board_id>/messages")
@login_required
@limiter.limit("60 per hour", key_func=rate_limit_user_key)
def create_message(board_id):
    if not can(current_user, ACTION_MESSAGES_CREATE): return jsonify({"error": "You don't have access."}), 403
    board, denial = board_or_denial(board_id)
    if denial: return denial
    content, error = content_from_request()
    if error: return jsonify({"error": error[0]}), error[1]
    message = Message(board_id=board.id, content=content, author_id=current_user.id)
    db.session.add(message); db.session.commit(); audit("message_create", "message", message.id); db.session.commit()
    return jsonify(message_data(message)), 201

def message_or_404(board_id, message_id):
    message = Message.query.filter_by(id=message_id, board_id=board_id, deleted_at=None).first()
    return message

@messages_bp.patch("/<int:board_id>/messages/<int:message_id>")
@login_required
def update_message(board_id, message_id):
    board, denial = board_or_denial(board_id)
    if denial: return denial
    message = message_or_404(board_id, message_id)
    if message is None: return jsonify({"error": "Message not found."}), 404
    if message.author_id != current_user.id: return jsonify({"error": "You can only edit your own messages."}), 403
    content, error = content_from_request()
    if error: return jsonify({"error": error[0]}), error[1]
    message.content = content; message.updated_at = datetime.now(timezone.utc); db.session.commit(); audit("message_edit", "message", message.id); db.session.commit()
    return jsonify(message_data(message))

@messages_bp.delete("/<int:board_id>/messages/<int:message_id>")
@login_required
def delete_message(board_id, message_id):
    board, denial = board_or_denial(board_id)
    if denial: return denial
    message = message_or_404(board_id, message_id)
    if message is None: return jsonify({"error": "Message not found."}), 404
    if message.author_id != current_user.id and role_of(current_user) not in ELEVATED_ROLES: return jsonify({"error": "You can only delete your own messages."}), 403
    message.deleted_at = datetime.now(timezone.utc); db.session.commit(); audit("message_delete", "message", message.id); db.session.commit()
    return jsonify({"message": "Message deleted."})

@messages_bp.patch("/<int:board_id>/messages/<int:message_id>/pin")
@login_required
def toggle_pin_message(board_id, message_id):
    board, denial = board_or_denial(board_id)
    if denial: return denial
    if not can(current_user, ACTION_PIN_MESSAGES): return jsonify({"error": "You don't have access."}), 403
    message = message_or_404(board_id, message_id)
    if message is None: return jsonify({"error": "Message not found."}), 404
    pinned = (request.get_json(silent=True) or {}).get("is_pinned")
    if not isinstance(pinned, bool): return jsonify({"error": "'is_pinned' must be a boolean."}), 400
    message.is_pinned = pinned; db.session.commit(); audit("message_pin" if pinned else "message_unpin", "message", message.id); db.session.commit()
    return jsonify(message_data(message))
