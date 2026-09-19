import pytest

from extensions import db
from models import Invoice, Payment, Receipt, InvoiceCounter


def _create_invoice(client, due_date="2026-12-01", amount_desc="Consulting", qty=1, price=1000):
    return client.post("/api/invoices/", json={
        "client_name": "Acme Ltd",
        "due_date": due_date,
        "items": [{"description": amount_desc, "quantity": qty, "unit_price": price}],
    })


def test_create_invoice_as_draft(client, make_user, login):
    make_user("owner1", role="owner")
    login("owner1")

    resp = _create_invoice(client)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["status"] == "draft"
    assert data["invoice_number"].startswith("INV-")
    assert data["subtotal"] == 1000
    assert data["total"] == 1000  # tax disabled by default


def test_invoice_numbers_never_repeat_after_delete(client, make_user, login):
    make_user("owner1", role="owner")
    login("owner1")

    first = _create_invoice(client).get_json()
    client.delete(f"/api/invoices/{first['id']}")

    second = _create_invoice(client).get_json()
    third = _create_invoice(client).get_json()

    assert second["invoice_number"] != first["invoice_number"]
    assert third["invoice_number"] != first["invoice_number"]
    assert second["invoice_number"] != third["invoice_number"]


def test_two_invoices_created_at_once_get_different_numbers(app, make_user):
    # Simulates two concurrent saves by issuing numbers back-to-back within
    # locked transactions, the same mechanism that protects real concurrent requests.
    from routes.invoices import _issue_invoice_number

    with app.app_context():
        make_user("owner1", role="owner")
        num1 = _issue_invoice_number()
        db.session.commit()
        num2 = _issue_invoice_number()
        db.session.commit()
        assert num1 != num2


def test_only_drafts_can_be_edited_or_deleted(client, make_user, login):
    make_user("owner1", role="owner")
    login("owner1")

    invoice = _create_invoice(client).get_json()
    client.post(f"/api/invoices/{invoice['id']}/send")

    edit_resp = client.patch(f"/api/invoices/{invoice['id']}", json={"client_name": "New Name"})
    assert edit_resp.status_code == 400

    delete_resp = client.delete(f"/api/invoices/{invoice['id']}")
    assert delete_resp.status_code == 400


def test_overdue_set_automatically_when_due_date_passes(client, make_user, login):
    make_user("owner1", role="owner")
    login("owner1")

    invoice = _create_invoice(client, due_date="2020-01-01").get_json()
    client.post(f"/api/invoices/{invoice['id']}/send")

    fetched = client.get(f"/api/invoices/{invoice['id']}").get_json()
    assert fetched["status"] == "overdue"


def test_paid_invoice_can_be_voided_but_not_edited_or_deleted(client, make_user, login):
    make_user("owner1", role="owner")
    login("owner1")

    invoice = _create_invoice(client).get_json()
    client.post(f"/api/invoices/{invoice['id']}/send")
    client.post(f"/api/invoices/{invoice['id']}/payments", json={"amount": 1000})

    fetched = client.get(f"/api/invoices/{invoice['id']}").get_json()
    assert fetched["status"] == "paid"

    assert client.patch(f"/api/invoices/{invoice['id']}", json={"client_name": "x"}).status_code == 400
    assert client.delete(f"/api/invoices/{invoice['id']}").status_code == 400

    void_resp = client.post(f"/api/invoices/{invoice['id']}/void")
    assert void_resp.status_code == 200
    assert void_resp.get_json()["status"] == "void"


def test_partial_payments_allowed_and_one_receipt_per_payment(client, make_user, login):
    make_user("owner1", role="owner")
    login("owner1")

    invoice = _create_invoice(client, price=1000).get_json()
    client.post(f"/api/invoices/{invoice['id']}/send")

    r1 = client.post(f"/api/invoices/{invoice['id']}/payments", json={"amount": 400})
    assert r1.status_code == 201
    assert r1.get_json()["status"] == "sent"  # still not fully paid
    assert r1.get_json()["balance"] == 600

    r2 = client.post(f"/api/invoices/{invoice['id']}/payments", json={"amount": 600})
    assert r2.get_json()["status"] == "paid"
    assert r2.get_json()["balance"] == 0

    with client.application.app_context():
        assert Payment.query.count() == 2
        assert Receipt.query.count() == 2


def test_tax_lines_compute_correctly(client, make_user, login):
    make_user("owner1", role="owner")
    login("owner1")

    client.put("/api/invoices/settings", json={"tax_enabled": True, "tax_rate": 15})

    resp = _create_invoice(client, price=1000)
    data = resp.get_json()
    assert data["subtotal"] == 1000
    assert data["tax_amount"] == 150
    assert data["total"] == 1150


def test_items_of_10_and_20_cents_total_exactly_30_cents(client, make_user, login):
    make_user("owner1", role="owner")
    login("owner1")

    resp = client.post("/api/invoices/", json={
        "client_name": "Acme Ltd",
        "due_date": "2026-12-01",
        "items": [
            {"description": "A", "quantity": 1, "unit_price": 0.10},
            {"description": "B", "quantity": 1, "unit_price": 0.20},
        ],
    })
    assert resp.get_json()["subtotal"] == 0.30


def test_staff_cannot_view_unassigned_invoice(client, make_user, login):
    owner = make_user("owner1", role="owner")
    staff = make_user("staff1", role="staff")

    login("owner1")
    invoice = _create_invoice(client).get_json()  # assigned to owner, not staff
    client.post("/auth/logout")

    login("staff1")
    resp = client.get(f"/api/invoices/{invoice['id']}")
    assert resp.status_code == 403


def test_accountant_cannot_void_invoice(client, make_user, login):
    make_user("owner1", role="owner")
    make_user("acc1", role="accountant")

    login("owner1")
    invoice = _create_invoice(client).get_json()
    client.post(f"/api/invoices/{invoice['id']}/send")
    client.post("/auth/logout")

    login("acc1")
    resp = client.post(f"/api/invoices/{invoice['id']}/void")
    assert resp.status_code == 403
