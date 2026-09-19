"""Soft-delete behavior: deletes hide instead of removing, deleted rows are
invisible everywhere (get/list/search/pipeline/dashboard), and
admin/owner can restore with everything audited."""

from extensions import db
from models import AuditLog, Contacts, Deal


def test_delete_contact_hides_but_keeps_row(client, make_user, login):
    make_user("admin_soft_c", "admin")
    contact = Contacts(name="Soft", phone="1", email="s@s.com", address="X")
    db.session.add(contact)
    db.session.commit()
    cid = contact.id

    login("admin_soft_c")
    assert client.delete(f"/api/contacts/{cid}").status_code == 200

    # Row still exists, flagged.
    assert Contacts.query.get(cid) is not None
    assert Contacts.query.get(cid).deleted_at is not None

    # Invisible through the API.
    assert client.get(f"/api/contacts/{cid}").status_code == 404
    names = [c["name"] for c in client.get("/api/contacts/").get_json()["contacts"]]
    assert "Soft" not in names
    assert client.patch(f"/api/contacts/{cid}", json={"name": "X"}).status_code == 404

    assert AuditLog.query.filter_by(action="contact_delete").one().target_id == cid


def test_restore_contact(client, make_user, login, logout):
    make_user("admin_restore", "admin")
    make_user("staff_restore", "staff")
    contact = Contacts(name="Comeback", phone="1", email="c@c.com", address="X")
    db.session.add(contact)
    db.session.commit()
    cid = contact.id

    login("admin_restore")
    client.delete(f"/api/contacts/{cid}")
    resp = client.patch(f"/api/contacts/{cid}/restore")
    assert resp.status_code == 200
    assert resp.get_json()["name"] == "Comeback"
    assert client.get(f"/api/contacts/{cid}").status_code == 200
    assert AuditLog.query.filter_by(action="contact_restore").one().target_id == cid
    logout()

    # Staff cannot restore.
    client.delete(f"/api/contacts/{cid}")
    login("staff_restore")
    assert client.patch(f"/api/contacts/{cid}/restore").status_code in (403, 404)


def test_delete_lead_hides_from_pipeline_and_dashboard(client, make_user, login):
    make_user("admin_soft_l", "admin")
    lead = Deal(title="Vanish", contact_id=1, value=100, stage="NEW")
    db.session.add(lead)
    db.session.commit()
    lid = lead.id

    login("admin_soft_l")
    assert client.delete(f"/api/leads/{lid}").status_code == 200

    # Gone from pipeline board, stage moves, history, list, search.
    board = client.get("/api/pipeline").get_json()
    assert all(d["id"] != lid for stage in board.values() for d in stage)
    assert client.patch(f"/api/deals/{lid}/stage", json={"stage": "CONTACTED"}).status_code == 404
    assert client.get(f"/api/deals/{lid}/history").status_code == 404
    assert client.get("/api/leads").get_json()["total"] == 0
    assert client.get("/api/search", query_string={"q": "Vanish"}).get_json() == {"results": []}
    summary = client.get("/api/dashboard/summary").get_json()
    assert summary["total_deals"] == 0

    # Restore brings it back everywhere.
    assert client.patch(f"/api/leads/{lid}/restore").status_code == 200
    assert client.get("/api/leads").get_json()["total"] == 1
    assert AuditLog.query.filter_by(action="lead_restore").one().target_id == lid


def test_restore_missing_returns_404(client, make_user, login):
    make_user("admin_restore404", "admin")
    login("admin_restore404")
    assert client.patch("/api/contacts/9999/restore").status_code == 404
    assert client.patch("/api/leads/9999/restore").status_code == 404


def test_session_is_permanent_with_lifetime(client, make_user):
    make_user("sess_user", "staff")
    resp = client.post("/auth/login", json={"username": "sess_user", "password": "password123"})
    assert resp.status_code == 200
    cookie = next(h for h in resp.headers.getlist("Set-Cookie") if h.startswith("session="))
    assert "Expires=" in cookie or "Max-Age=" in cookie
