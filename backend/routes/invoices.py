from datetime import datetime, date, timezone
from decimal import Decimal, InvalidOperation

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy.exc import IntegrityError

from extensions import db, limiter, rate_limit_user_key
from models import Invoice, InvoiceItem, Payment, Receipt, InvoiceCounter, InvoiceSettings, PaymentMethod
from audit import audit
from permissions import (
    can,
    ACTION_ASSIGN,
    ACTION_INVOICES_VIEW,
    ACTION_INVOICES_CREATE,
    ACTION_INVOICES_SEND,
    ACTION_INVOICES_VOID,
)

invoices_bp = Blueprint("invoices", __name__, url_prefix="/api/invoices")


def _parse_date(value):
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def _apply_overdue(invoice):
    """Self-healing: flips sent -> overdue once due_date has passed. Called
    on every read, so a status change is caught without needing a cron job."""
    if invoice.status == "sent" and invoice.due_date and invoice.due_date < date.today():
        invoice.status = "overdue"
        return True
    return False


def _get_counter_locked():
    """Get-or-create the single business-wide numbering counter, row-locked
    for the rest of the transaction. The unique constraint on `singleton`
    guarantees only one such row can ever exist, even if two requests race
    to create it for the first time — the retry below handles that race."""
    counter = InvoiceCounter.query.filter_by(singleton=True).with_for_update().first()
    if counter:
        return counter

    counter = InvoiceCounter(singleton=True)
    db.session.add(counter)
    try:
        db.session.flush()
    except IntegrityError:
        db.session.rollback()
        return InvoiceCounter.query.filter_by(singleton=True).with_for_update().first()
    return InvoiceCounter.query.filter_by(singleton=True).with_for_update().first()


def _issue_invoice_number():
    counter = _get_counter_locked()
    number = f"{counter.prefix}{counter.next_number}"
    counter.next_number += 1
    return number


def _issue_receipt_number():
    counter = _get_counter_locked()
    number = f"{counter.receipt_prefix}{counter.next_receipt_number}"
    counter.next_receipt_number += 1
    return number


def _recompute_totals(invoice):
    subtotal = sum((item.quantity * item.unit_price for item in invoice.items), start=0)
    tax_amount = subtotal * (invoice.tax_rate_snapshot / 100) if invoice.tax_enabled_snapshot else 0
    invoice.subtotal = subtotal
    invoice.tax_amount = tax_amount
    invoice.total = subtotal + tax_amount


def _set_items(invoice, items_data):
    for item in list(invoice.items):
        db.session.delete(item)
    for item_data in items_data or []:
        db.session.add(InvoiceItem(
            invoice=invoice,
            description=item_data.get("description", ""),
            quantity=item_data.get("quantity", 1),
            unit_price=item_data.get("unit_price", 0),
        ))


@invoices_bp.route("/", methods=["GET"])
@login_required
def list_invoices():
    invoices = Invoice.query.all()
    changed = False
    for inv in invoices:
        if _apply_overdue(inv):
            changed = True
    if changed:
        db.session.commit()

    visible = [inv for inv in invoices if can(current_user, ACTION_INVOICES_VIEW, inv)]
    return jsonify({"invoices": [inv.to_dict() for inv in visible]}), 200


@invoices_bp.route("/<int:invoice_id>", methods=["GET"])
@login_required
def get_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    if not can(current_user, ACTION_INVOICES_VIEW, invoice):
        return jsonify({"error": "You don't have access."}), 403

    if _apply_overdue(invoice):
        db.session.commit()

    return jsonify(invoice.to_dict()), 200


@invoices_bp.route("/", methods=["POST"])
@login_required
@limiter.limit("60 per hour", key_func=rate_limit_user_key)
def create_invoice():
    if not can(current_user, ACTION_INVOICES_CREATE):
        return jsonify({"error": "You don't have access."}), 403

    data = request.get_json(silent=True) or {}

    client_id = data.get("client_id")
    client_name = data.get("client_name")
    due_date = _parse_date(data.get("due_date"))
    items_data = data.get("items") or []

    if not client_name or not due_date or not items_data:
        return jsonify({"error": "client_name, due_date, and at least one item are required"}), 400

    assigned_to_id = data.get("assigned_to_id") or current_user.id
    if assigned_to_id != current_user.id and not can(current_user, ACTION_ASSIGN):
        return jsonify({"error": "You don't have access."}), 403

    settings = InvoiceSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = InvoiceSettings(user_id=current_user.id)
        db.session.add(settings)
        db.session.flush()

    invoice = Invoice(
        invoice_number=_issue_invoice_number(),
        client_id=client_id,
        client_name=client_name,
        status="draft",
        due_date=due_date,
        tax_rate_snapshot=settings.tax_rate or 0,
        tax_enabled_snapshot=bool(settings.tax_enabled),
        assigned_to_id=assigned_to_id,
    )
    db.session.add(invoice)
    db.session.flush()

    _set_items(invoice, items_data)
    _recompute_totals(invoice)
    db.session.commit()

    audit("invoice_create", "invoice", invoice.id, f"number={invoice.invoice_number!r}")
    db.session.commit()

    return jsonify(invoice.to_dict()), 201


@invoices_bp.route("/<int:invoice_id>", methods=["PATCH"])
@login_required
def update_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    if not can(current_user, ACTION_INVOICES_CREATE, invoice):
        return jsonify({"error": "You don't have access."}), 403

    if invoice.status != "draft":
        return jsonify({"error": "Only drafts can be edited. Void this invoice instead."}), 400

    data = request.get_json(silent=True) or {}

    if "client_id" in data:
        invoice.client_id = data["client_id"]
    if "client_name" in data:
        invoice.client_name = data["client_name"]
    if "due_date" in data:
        invoice.due_date = _parse_date(data["due_date"])
    if "items" in data:
        _set_items(invoice, data["items"])

    _recompute_totals(invoice)
    db.session.commit()

    return jsonify(invoice.to_dict()), 200


@invoices_bp.route("/<int:invoice_id>", methods=["DELETE"])
@login_required
def delete_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    if not can(current_user, ACTION_INVOICES_CREATE, invoice):
        return jsonify({"error": "You don't have access."}), 403

    if invoice.status != "draft":
        return jsonify({"error": "Only drafts can be deleted. Void this invoice instead."}), 400

    db.session.delete(invoice)
    db.session.commit()
    audit("invoice_delete", "invoice", invoice_id, f"number={invoice.invoice_number!r}")
    db.session.commit()

    return jsonify({"message": "Invoice deleted"}), 200


@invoices_bp.route("/<int:invoice_id>/send", methods=["POST"])
@login_required
def send_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    if not can(current_user, ACTION_INVOICES_SEND, invoice):
        return jsonify({"error": "You don't have access."}), 403

    if invoice.status != "draft":
        return jsonify({"error": "Only drafts can be sent."}), 400

    invoice.status = "sent"
    invoice.issue_date = date.today()
    db.session.commit()

    audit("invoice_send", "invoice", invoice.id, f"number={invoice.invoice_number!r}")
    db.session.commit()

    return jsonify(invoice.to_dict()), 200


@invoices_bp.route("/<int:invoice_id>/void", methods=["POST"])
@login_required
def void_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    if not can(current_user, ACTION_INVOICES_VOID, invoice):
        return jsonify({"error": "You don't have access."}), 403

    if invoice.status in ("draft", "void"):
        return jsonify({"error": f"Cannot void an invoice that is {invoice.status}."}), 400

    invoice.status = "void"
    db.session.commit()

    audit("invoice_void", "invoice", invoice.id, f"number={invoice.invoice_number!r}")
    db.session.commit()

    return jsonify(invoice.to_dict()), 200


@invoices_bp.route("/<int:invoice_id>/payments", methods=["POST"])
@login_required
@limiter.limit("60 per hour", key_func=rate_limit_user_key)
def record_payment(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    if not can(current_user, ACTION_INVOICES_SEND, invoice):
        return jsonify({"error": "You don't have access."}), 403

    if invoice.status in ("draft", "void"):
        return jsonify({"error": f"Cannot record a payment on an invoice that is {invoice.status}."}), 400

    data = request.get_json(silent=True) or {}
    raw_amount = data.get("amount")
    method_id = data.get("method_id")

    if raw_amount is None:
        return jsonify({"error": "A positive amount is required."}), 400

    try:
        amount = Decimal(str(raw_amount))
    except (InvalidOperation, ValueError):
        return jsonify({"error": "Amount must be a valid number."}), 400

    if amount <= 0:
        return jsonify({"error": "A positive amount is required."}), 400

    if method_id is not None:
        method = PaymentMethod.query.get(method_id)
        if not method or not method.is_active:
            return jsonify({"error": "Invalid or inactive payment method."}), 400

    payment = Payment(
        invoice_id=invoice.id,
        amount=amount,
        method_id=method_id,
        recorded_by_id=current_user.id,
    )
    db.session.add(payment)
    db.session.flush()

    receipt = Receipt(
        receipt_number=_issue_receipt_number(),
        payment_id=payment.id,
        invoice_id=invoice.id,
    )
    db.session.add(receipt)

    paid_total = sum((p.amount for p in invoice.payments), start=0) + payment.amount
    if paid_total >= invoice.total:
        invoice.status = "paid"
        invoice.paid_date = date.today()

    db.session.commit()

    audit("payment_record", "invoice", invoice.id, f"amount={payment.amount} receipt={receipt.receipt_number!r}")
    db.session.commit()

    return jsonify(invoice.to_dict()), 201
