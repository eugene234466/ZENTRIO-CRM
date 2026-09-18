from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import or_

from permissions import (
    can,
    ACTION_CLIENTS_VIEW,
    ACTION_LEADS_VIEW,
    ACTION_INVOICES_VIEW,
)

search_bp = Blueprint("search", __name__)

try:
    from models import Contacts as Client
except ImportError:
    Client = None

try:
    from models import Deal as Lead
except ImportError:
    Lead = None

try:
    from models import Invoice
except ImportError:
    Invoice = None


@search_bp.route("/search", methods=["GET"])
@login_required
def search():
    q = (request.args.get("q") or "").strip()

    if not q:
        return jsonify({"results": []}), 200

    results = []
    like = f"%{q}%"

    if Client is not None:
        clients = Client.query.filter(
            or_(
                Client.name.ilike(like),
                Client.email.ilike(like),
                Client.phone.ilike(like),
            )
        ).limit(20).all()

        for row in clients:
            if can(current_user, ACTION_CLIENTS_VIEW, row):
                results.append({
                    "type": "client",
                    "id": row.id,
                    "title": row.name,
                    "subtitle": row.email,
                    "link": f"/clients/{row.id}",
                })

    if Lead is not None:
        leads = Lead.query.filter(
            or_(
                Lead.title.ilike(like),
                Lead.stage.ilike(like),
            )
        ).limit(20).all()

        for row in leads:
            if can(current_user, ACTION_LEADS_VIEW, row):
                results.append({
                    "type": "lead",
                    "id": row.id,
                    "title": row.title,
                    "subtitle": f"Stage: {row.stage}",
                    "link": f"/leads/{row.id}",
                })

    if Invoice is not None:
        invoices = Invoice.query.filter(
            Invoice.invoice_number.ilike(like)
        ).limit(20).all()

        for row in invoices:
            if can(current_user, ACTION_INVOICES_VIEW, row):
                results.append({
                    "type": "invoice",
                    "id": row.id,
                    "title": row.invoice_number,
                    "subtitle": getattr(row, "client_name", ""),
                    "link": f"/invoices/{row.id}",
                })

    return jsonify({"results": results}), 200