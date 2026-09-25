"""
clients.py
Client CRUD for the frontend ClientsSection.
Uses the Client model (distinct from Contacts, which remains untouched).
"""

from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db, limiter, rate_limit_user_key
from models import Client, live
from audit import audit
from permissions import (
    can,
    ACTION_ASSIGN,
    ACTION_CLIENTS_VIEW,
    ACTION_CLIENTS_ADD,
    ACTION_CLIENTS_EDIT,
    ACTION_CLIENTS_DELETE,
)


clients_bp = Blueprint("clients", __name__, url_prefix="/api/clients")


REQUIRED_FIELDS = ["name", "email", "phone"]

# Frontend sends these strings; the model stores them as-is.
VALID_TYPES = {"SME", "School", "Healthcare", "Enterprise"}
VALID_STATUSES = {"Active", "Lead", "Prospect"}


def _client_to_dict(client):
    """Shape the Client row the way the frontend Client type expects."""
    return {
        "id": client.id,
        "name": client.name,
        "company": client.company or "",
        "email": client.email,
        "phone": client.phone,
        "type": client.type,
        "status": client.status,
        # Frontend field name is camelCase here.
        "lastContact": client.last_contact,
        "createdAt": (
            client.created_at.isoformat()
            if client.created_at
            else ""
        ),
        "assigned_to_id": client.assigned_to_id,
    }


@clients_bp.route("/", methods=["GET"])
@login_required
def list_clients():
    clients = live(Client).all()
    visible = [
        c for c in clients
        if can(current_user, ACTION_CLIENTS_VIEW, c)
    ]
    return jsonify({"clients": [_client_to_dict(c) for c in visible]}), 200


@clients_bp.route("/<int:client_id>", methods=["GET"])
@login_required
def get_client(client_id):
    client = live(Client).filter_by(id=client_id).first()
    if not client:
        return jsonify({"error": "Client not found"}), 404

    if not can(current_user, ACTION_CLIENTS_VIEW, client):
        return jsonify({"error": "You don't have access."}), 403

    return jsonify(_client_to_dict(client)), 200


@clients_bp.route("/", methods=["POST"])
@login_required
@limiter.limit("60 per hour", key_func=rate_limit_user_key)
def create_client():
    if not can(current_user, ACTION_CLIENTS_ADD):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}

    missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
    if missing:
        return jsonify({
            "error": f"Missing required field(s): {', '.join(missing)}"
        }), 400

    client_type = data.get("type") or "SME"
    if client_type not in VALID_TYPES:
        return jsonify({
            "error": f"Invalid type. Must be one of: {', '.join(sorted(VALID_TYPES))}"
        }), 400

    client_status = data.get("status") or "Lead"
    if client_status not in VALID_STATUSES:
        return jsonify({
            "error": f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}"
        }), 400

    assigned_to_id = data.get("assigned_to_id") or current_user.id
    if assigned_to_id != current_user.id and not can(current_user, ACTION_ASSIGN):
        return jsonify({"error": "You don't have access."}), 403

    client = Client(
        name=data["name"],
        company=data.get("company") or None,
        email=data["email"],
        phone=data["phone"],
        type=client_type,
        status=client_status,
        last_contact=data.get("lastContact")
            or data.get("last_contact")
            or "Today",
        assigned_to_id=assigned_to_id,
    )
    db.session.add(client)
    db.session.commit()

    audit(
        "client_create",
        "client",
        client.id,
        f"name={client.name!r} assigned_to_id={assigned_to_id}",
    )
    db.session.commit()

    return jsonify(_client_to_dict(client)), 201


@clients_bp.route("/<int:client_id>", methods=["PATCH"])
@login_required
def update_client(client_id):
    client = live(Client).filter_by(id=client_id).first()
    if not client:
        return jsonify({"error": "Client not found"}), 404

    if not can(current_user, ACTION_CLIENTS_EDIT, client):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}

    if "name" in data:
        client.name = data["name"]

    if "company" in data:
        client.company = data["company"] or None

    if "email" in data:
        client.email = data["email"]

    if "phone" in data:
        client.phone = data["phone"]

    if "type" in data:
        if data["type"] not in VALID_TYPES:
            return jsonify({
                "error": f"Invalid type. Must be one of: {', '.join(sorted(VALID_TYPES))}"
            }), 400
        client.type = data["type"]

    if "status" in data:
        if data["status"] not in VALID_STATUSES:
            return jsonify({
                "error": f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}"
            }), 400
        client.status = data["status"]

    if "lastContact" in data or "last_contact" in data:
        client.last_contact = (
            data.get("lastContact")
            or data.get("last_contact")
            or client.last_contact
        )

    if "assigned_to_id" in data:
        if data["assigned_to_id"] != client.assigned_to_id:
            if not can(current_user, ACTION_ASSIGN):
                return jsonify({"error": "You don't have access."}), 403
            audit(
                "client_reassign",
                "client",
                client_id,
                f"assigned_to_id {client.assigned_to_id} -> {data['assigned_to_id']}",
            )
        client.assigned_to_id = data["assigned_to_id"]

    db.session.commit()
    return jsonify(_client_to_dict(client)), 200


@clients_bp.route("/<int:client_id>", methods=["DELETE"])
@login_required
def delete_client(client_id):
    client = live(Client).filter_by(id=client_id).first()
    if not client:
        return jsonify({"error": "Client not found"}), 404

    if not can(current_user, ACTION_CLIENTS_DELETE, client):
        return jsonify({"error": "You don't have access."}), 403

    client.deleted_at = datetime.now(timezone.utc)
    db.session.commit()

    audit("client_delete", "client", client_id, f"name={client.name!r}")
    db.session.commit()

    return jsonify({"message": "Client deleted"}), 200


@clients_bp.route("/<int:client_id>/restore", methods=["PATCH"])
@login_required
def restore_client(client_id):
    client = Client.query.filter(
        Client.id == client_id,
        Client.deleted_at.isnot(None),
    ).first()
    if not client:
        return jsonify({"error": "Client not found"}), 404

    if not can(current_user, ACTION_CLIENTS_DELETE, client):
        return jsonify({"error": "You don't have access."}), 403

    client.deleted_at = None
    db.session.commit()

    audit("client_restore", "client", client_id, f"name={client.name!r}")
    db.session.commit()

    return jsonify(_client_to_dict(client)), 200