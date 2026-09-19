"""Search safety tests: classic SQLi payloads are inert (ORM-bound
parameters), LIKE wildcards match literally, and permissions still apply."""

from extensions import db
from models import Contacts, Deal, Invoice, User
from permissions import ROLE_OWNER


def _seed(owner_id=None):
    db.session.add(Contacts(
        name="Acme 100% Real_Co", phone="020 7946 0018",
        email="hello@acme.example", address="14 Mango Street, Accra",
        assigned_to_id=owner_id,
    ))
    db.session.add(Deal(
        title="Acme rollout", contact_id=1, value=500,
        assigned_to_id=owner_id,
    ))
    db.session.add(Invoice(
        invoice_number="INV-4242", client_name="Acme Ltd",
        status="sent", total=250,
    ))
    db.session.commit()


SQLI_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "'; DROP TABLE contacts; --",
    "\" OR \"\"=\"",
    "acme' UNION SELECT password FROM user --",
    "%27%20OR%201%3D1",
]


def test_sqli_payloads_return_no_rows_and_tables_survive(client, make_user, login):
    make_user("u_sqli_owner", ROLE_OWNER)
    _seed()
    login("u_sqli_owner")

    before = {
        "contacts": Contacts.query.count(),
        "deals": Deal.query.count(),
        "invoices": Invoice.query.count(),
        "users": User.query.count(),
    }

    for payload in SQLI_PAYLOADS:
        resp = client.get("/api/search", query_string={"q": payload})
        assert resp.status_code == 200
        assert resp.get_json() == {"results": []}, payload

    after = {
        "contacts": Contacts.query.count(),
        "deals": Deal.query.count(),
        "invoices": Invoice.query.count(),
        "users": User.query.count(),
    }
    assert before == after


def test_bare_percent_does_not_dump_everything(client, make_user, login):
    make_user("u_pct_owner", ROLE_OWNER)
    _seed()
    login("u_pct_owner")

    resp = client.get("/api/search", query_string={"q": "%"})
    assert resp.status_code == 200
    # Only the contact whose name literally contains '%' matches.
    results = resp.get_json()["results"]
    assert len(results) == 1
    assert results[0]["title"] == "Acme 100% Real_Co"


def test_underscore_matches_literally(client, make_user, login):
    make_user("u_us_owner", ROLE_OWNER)
    _seed()
    login("u_us_owner")

    resp = client.get("/api/search", query_string={"q": "Real_Co"})
    titles = [r["title"] for r in resp.get_json()["results"]]
    assert "Acme 100% Real_Co" in titles

    # '_' must not act as a single-char wildcard: 'RealXCo' matches nothing.
    resp = client.get("/api/search", query_string={"q": "RealXCo"})
    assert resp.get_json() == {"results": []}


def test_search_matches_address_and_invoice_client(client, make_user, login):
    make_user("u_fields_owner", ROLE_OWNER)
    _seed()
    login("u_fields_owner")

    resp = client.get("/api/search", query_string={"q": "Mango Street"})
    assert any(r["type"] == "client" for r in resp.get_json()["results"])

    resp = client.get("/api/search", query_string={"q": "Acme Ltd"})
    assert any(
        r["type"] == "invoice" and r["title"] == "INV-4242"
        for r in resp.get_json()["results"]
    )


def test_sqli_payload_cannot_escape_permission_filter(client, make_user, login):
    staff = make_user("u_sqli_staff", "staff")
    _seed(owner_id=None)  # nothing assigned to this staffer
    login("u_sqli_staff")

    for payload in SQLI_PAYLOADS:
        resp = client.get("/api/search", query_string={"q": payload})
        assert resp.status_code == 200
        assert resp.get_json() == {"results": []}, payload
    assert staff is not None
