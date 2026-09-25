from functools import wraps
import os

from flask import Blueprint, request, jsonify, session, current_app
from flask_login import current_user, login_user, login_required, logout_user
from werkzeug.datastructures import MultiDict
from werkzeug.utils import secure_filename

from forms import SignUpForm, LoginForm
from extensions import db, bcrypt, limiter
from flask_limiter.util import get_remote_address
from models import User
from audit import audit
from permissions import (
    can,
    role_of,
    ACTION_USERS_ROLES,
    ROLE_OWNER,
)

USER_ROLES = {"owner", "admin", "manager", "staff", "accountant"}

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


# Same allow-list as all_settings.py's logo upload — keep them in sync.
ALLOWED_AVATAR_EXTENSIONS = {"png", "jpg", "jpeg", "svg", "webp"}


def _allowed_avatar(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_AVATAR_EXTENSIONS
    )


def _first_error(form):
    for field_errors in form.errors.values():
        if field_errors:
            return field_errors[0]
    return "Invalid input."


def _login_key():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username") or "").strip().lower()
    return f"{get_remote_address()}:{username}"


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "avatar": user.avatar or "",
    }


@auth_bp.route("/signup", methods=["POST"])
@limiter.limit("5 per hour")
def signup():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username") or "").strip()
    email = str(data.get("email") or "").strip().lower()
    password = str(data.get("password") or "")

    form = SignUpForm(formdata=MultiDict({"username": username, "email": email, "password": password}))
    if not form.validate():
        return jsonify({"error": _first_error(form)}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists. Please choose a different one."}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered. Please use a different one."}), 409

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(username=username, email=email, password=hashed, role="staff")
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "User created. Please log in.", "username": username, "email": email}), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute", key_func=_login_key)
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username") or "").strip()
    password = str(data.get("password") or "")

    form = LoginForm(formdata=MultiDict({"username": username, "password": password}))
    if not form.validate():
        return jsonify({"error": _first_error(form)}), 400

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        login_user(user)
        session.permanent = True
        return jsonify({"msg": "Logged in.", "username": user.username, "role": user.role}), 200
    return jsonify({"error": "Invalid username or password."}), 401


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify(_user_to_dict(current_user)), 200


@auth_bp.route("/me/avatar", methods=["POST"])
@login_required
def upload_avatar():
    """Upload or replace the current user's avatar image."""
    if "avatar" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["avatar"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not _allowed_avatar(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = secure_filename(f"user_{current_user.id}_avatar.{ext}")

    avatar_folder = current_app.config.get("AVATAR_FOLDER", "uploads/avatars")
    os.makedirs(avatar_folder, exist_ok=True)

    file_path = os.path.join(avatar_folder, filename)
    file.save(file_path)

    avatar_url = f"/uploads/avatars/{filename}"

    current_user.avatar = avatar_url
    db.session.commit()

    audit("avatar_update", "user", current_user.id, f"avatar={avatar_url!r}")
    db.session.commit()

    return jsonify({
        "avatar": avatar_url,
        "message": "Avatar uploaded successfully",
    }), 200


# ---------------------------------------------------------------------------
# Users list + role management (Settings → Users tab)
# ---------------------------------------------------------------------------

@auth_bp.route("/users", methods=["GET"])
@login_required
def list_users():
    """Return every user. Only owner/admin can see the full list."""
    if not can(current_user, ACTION_USERS_ROLES):
        return jsonify({"error": "You don't have access."}), 403

    users = User.query.order_by(User.id.asc()).all()
    return jsonify({"users": [_user_to_dict(u) for u in users]}), 200


@auth_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@login_required
def update_role(user_id):
    data = request.get_json(silent=True) or {}
    role = str(data.get("role") or "").strip().lower()

    if role not in USER_ROLES:
        return jsonify({"error": "Role must be owner, admin, staff, or accountant."}), 400

    user = User.query.get(user_id)
    if user is None:
        return jsonify({"error": "User not found."}), 404

    if not can(current_user, ACTION_USERS_ROLES, user):
        return jsonify({"error": "You don't have access."}), 403

    if role == ROLE_OWNER and role_of(current_user) != ROLE_OWNER:
        return jsonify({"error": "Only the Owner can hand over ownership."}), 403

    # Refuse a change that would leave zero owners in the system.
    if user.role == ROLE_OWNER and role != ROLE_OWNER:
        owner_count = User.query.filter_by(role=ROLE_OWNER).count()
        if owner_count <= 1:
            return jsonify({
                "error": "Cannot remove the last Owner. Promote another user to Owner first."
            }), 400

    old_role = user.role
    user.role = role
    db.session.commit()
    audit("role_change", "user", user.id, f"{user.username!r}: {old_role} -> {role}")
    db.session.commit()
    return jsonify({"msg": "Role updated.", "user": _user_to_dict(user)}), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"msg": "Logged out."}), 200
