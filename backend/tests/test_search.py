from extensions import db
from models import Contacts, Deal, Invoice
from permissions import ROLE_STAFF, ROLE_OWNER


def test_search_empty_query_returns_empty(client, make_user, login):
    make_user("u_search_empty", ROLE_STAFF)
    login("u_search_empty")

    resp = client.get("/api/search?q=")
    assert resp.status_code == 200
    assert resp.get_json() == {"results": []}


def test_search_finds_own_contact(client, make_user, login):
    staff = make_user("u_search_c", ROLE_STAFF)

    own = Contacts(
        name="UniqueNameXYZ", phone="1", email="u@x.com", address="A",
        assigned_to_id=staff.id,
    )
    other = Contacts(
        name="UniqueNameXYZ-Other", phone="2", email="o@x.com", address="B",
        assigned_to_id=None,
    )
    db.session.add_all([own, other])
    db.session.commit()

    login("u_search_c")
    resp = client.get("/api/search?q=UniqueNameXYZ")
    assert resp.status_code == 200

    titles = [r["title"] for r in resp.get_json()["results"]]
    assert "UniqueNameXYZ" in titles
    assert "UniqueNameXYZ-Other" not in titles


def test_search_finds_own_lead(client, make_user, login):
    staff = make_user("u_search_l", ROLE_STAFF)

    lead = Deal(
        title="SearchableLead", contact_id=1, value=500,
        assigned_to_id=staff.id,
    )
    db.session.add(lead)
    db.session.commit()

    login("u_search_l")
    resp = client.get("/api/search?q=SearchableLead")
    assert resp.status_code == 200

    titles = [r["title"] for r in resp.get_json()["results"]]
    assert "SearchableLead" in titles


def test_search_finds_lead_by_email(client, make_user, login):
    staff = make_user("u_search_le", ROLE_STAFF)

    lead = Deal(
        title="EmailSearchLead", contact_id=1, value=100,
        email="lead-contact@example.test",
        assigned_to_id=staff.id,
    )
    db.session.add(lead)
    db.session.commit()

    login("u_search_le")
    resp = client.get("/api/search?q=lead-contact@example.test")
    assert resp.status_code == 200

    titles = [r["title"] for r in resp.get_json()["results"]]
    assert "EmailSearchLead" in titles


def test_search_finds_lead_by_company(client, make_user, login):
    staff = make_user("u_search_lc", ROLE_STAFF)

    lead = Deal(
        title="CompanySearchLead", contact_id=1, value=100,
        company="ZentrioIndustries",
        assigned_to_id=staff.id,
    )
    db.session.add(lead)
    db.session.commit()

    login("u_search_lc")
    resp = client.get("/api/search?q=ZentrioIndustries")
    assert resp.status_code == 200

    titles = [r["title"] for r in resp.get_json()["results"]]
    assert "CompanySearchLead" in titles


def test_search_does_not_return_other_users_lead_by_email(client, make_user, login):
    staff = make_user("u_search_other_le", ROLE_STAFF)
    other = make_user("u_search_other_lowner", ROLE_STAFF)

    lead = Deal(
        title="OtherEmailLead", contact_id=1, value=100,
        email="private@example.test",
        assigned_to_id=other.id,
    )
    db.session.add(lead)
    db.session.commit()

    login("u_search_other_le")
    resp = client.get("/api/search?q=private@example.test")
    assert resp.status_code == 200
    assert resp.get_json() == {"results": []}


def test_search_finds_invoice_by_number(client, make_user, login):
    make_user("u_search_inv", ROLE_OWNER)

    inv = Invoice(
        invoice_number="INV-9999",
        client_name="TestClient",
        status="sent",
        total=100,
    )
    db.session.add(inv)
    db.session.commit()

    login("u_search_inv")
    resp = client.get("/api/search?q=INV-9999")
    assert resp.status_code == 200

    titles = [r["title"] for r in resp.get_json()["results"]]
    assert "INV-9999" in titles