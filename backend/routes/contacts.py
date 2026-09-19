from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db, limiter, rate_limit_user_key
from models import Contacts, live
from audit import audit
from permissions import (
    can,
    ACTION_ASSIGN,
    ACTION_CLIENTS_VIEW,
    ACTION_CLIENTS_ADD,
    ACTION_CLIENTS_EDIT,
    ACTION_CLIENTS_DELETE,
)

contacts_bp = Blueprint("contacts", __name__, url_prefix="/api/contacts")

REQUIRED_FIELDS = ["name", "phone", "email", "address"]


def _contact_to_dict(contact):
    return {
        "id": contact.id,
        "name": contact.name,
        "phone": contact.phone,
        "email": contact.email,
        "address": contact.address,
        "assigned_to_id": contact.assigned_to_id,
    }


@contacts_bp.route("/", methods=["GET"])
@login_required
def list_contacts():
    contacts = live(Contacts).all()
    visible = [c for c in contacts if can(current_user, ACTION_CLIENTS_VIEW, c)]
    return jsonify({"contacts": [_contact_to_dict(c) for c in visible]}), 200


@contacts_bp.route("/<int:contact_id>", methods=["GET"])
@login_required
def get_contact(contact_id):
    contact = live(Contacts).filter_by(id=contact_id).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    if not can(current_user, ACTION_CLIENTS_VIEW, contact):
        return jsonify({"error": "You don't have access."}), 403

    return jsonify(_contact_to_dict(contact)), 200


@contacts_bp.route("/", methods=["POST"])
@login_required
@limiter.limit("60 per hour", key_func=rate_limit_user_key)
def create_contact():
    if not can(current_user, ACTION_CLIENTS_ADD):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}
    missing = [field for field in REQUIRED_FIELDS if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing required field(s): {', '.join(missing)}"}), 400

    assigned_to_id = data.get("assigned_to_id") or current_user.id
    if assigned_to_id != current_user.id and not can(current_user, ACTION_ASSIGN):
        return jsonify({"error": "You don't have access."}), 403

    contact = Contacts(
        name=data["name"],
        phone=data["phone"],
        email=data["email"],
        address=data["address"],
        assigned_to_id=assigned_to_id,
    )
    db.session.add(contact)
    db.session.commit()
    audit("contact_create", "contacts", contact.id, f"name={contact.name!r} assigned_to_id={assigned_to_id}")
    db.session.commit()

    return jsonify(_contact_to_dict(contact)), 201


@contacts_bp.route("/<int:contact_id>", methods=["PATCH"])
@login_required
def update_contact(contact_id):
    contact = live(Contacts).filter_by(id=contact_id).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    if not can(current_user, ACTION_CLIENTS_EDIT, contact):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}

    for field in REQUIRED_FIELDS:
        if field in data:
            setattr(contact, field, data[field])

    if "assigned_to_id" in data:
        if data["assigned_to_id"] != contact.assigned_to_id:
            if not can(current_user, ACTION_ASSIGN):
                return jsonify({"error": "You don't have access."}), 403
            audit(
                "contact_reassign", "contacts", contact_id,
                f"assigned_to_id {contact.assigned_to_id} -> {data['assigned_to_id']}",
            )
        contact.assigned_to_id = data["assigned_to_id"]

    db.session.commit()
    return jsonify(_contact_to_dict(contact)), 200


@contacts_bp.route("/<int:contact_id>", methods=["DELETE"])
@login_required
def delete_contact(contact_id):
    contact = live(Contacts).filter_by(id=contact_id).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    if not can(current_user, ACTION_CLIENTS_DELETE, contact):
        return jsonify({"error": "You don't have access."}), 403

    contact.deleted_at = datetime.now(timezone.utc)
    db.session.commit()
    audit("contact_delete", "contacts", contact_id, f"name={contact.name!r}")
    db.session.commit()

    return jsonify({"message": "Contact deleted"}), 200


@contacts_bp.route("/<int:contact_id>/restore", methods=["PATCH"])
@login_required
def restore_contact(contact_id):
    contact = Contacts.query.filter(
        Contacts.id == contact_id,
        Contacts.deleted_at.isnot(None),
    ).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    if not can(current_user, ACTION_CLIENTS_DELETE, contact):
        return jsonify({"error": "You don't have access."}), 403

    contact.deleted_at = None
    db.session.commit()
    audit("contact_restore", "contacts", contact_id, f"name={contact.name!r}")
    db.session.commit()

    return jsonify(_contact_to_dict(contact)), 200