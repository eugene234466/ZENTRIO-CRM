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

try:
    from models import live
except ImportError:
    def live(model):
        return model.query


def _escape_like(value):
    """Escape LIKE wildcards so the query matches user input literally."""
    return (
        value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    )


@search_bp.route("/search", methods=["GET"])
@login_required
def search():
    q = (request.args.get("q") or "").strip()

    if not q:
        return jsonify({"results": []}), 200

    results = []
    # Bound parameter via the ORM (never interpolated into SQL), with LIKE
    # wildcards escaped so user input only ever matches literally.
    like = f"%{_escape_like(q)}%"
    escape = "\\"

    if Client is not None:
        clients = live(Client).filter(
            or_(
                Client.name.ilike(like, escape=escape),
                Client.email.ilike(like, escape=escape),
                Client.phone.ilike(like, escape=escape),
                Client.address.ilike(like, escape=escape),
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
        leads = live(Lead).filter(
            or_(
                Lead.title.ilike(like, escape=escape),
                Lead.stage.ilike(like, escape=escape),
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
            or_(
                Invoice.invoice_number.ilike(like, escape=escape),
                Invoice.client_name.ilike(like, escape=escape),
            )
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