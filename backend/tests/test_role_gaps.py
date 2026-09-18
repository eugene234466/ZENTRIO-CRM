"""Regression tests for the admin/staff separation gaps:

- Reassignment (assigned_to_id changes) requires ACTION_ASSIGN (admin/owner).
- Sensitive actions (role changes, deletes, reassignments) write audit entries.
- /api/audit-log is visible to owner/admin only.
"""

from extensions import db
from models import AuditLog, Contacts, Deal


def _own_lead(owner):
    lead = Deal(title="Own", contact_id=1, value=50, assigned_to_id=owner.id)
    db.session.add(lead)
    db.session.commit()
    return lead


def _own_contact(owner):
    contact = Contacts(
        name="Own Co", phone="1", email="own@co.com", address="X",
        assigned_to_id=owner.id,
    )
    db.session.add(contact)
    db.session.commit()
    return contact


def test_staff_cannot_reassign_own_lead(client, make_user, login):
    staff = make_user("staff_reassign", "staff")
    other = make_user("staff_other", "staff")
    lead = _own_lead(staff)

    login("staff_reassign")
    resp = client.patch(f"/api/leads/{lead.id}", json={"assigned_to_id": other.id})
    assert resp.status_code == 403

    db.session.refresh(lead)
    assert lead.assigned_to_id == staff.id


def test_admin_can_reassign_lead_and_it_is_audited(client, make_user, login):
    staff = make_user("staff_admin_re", "staff")
    admin = make_user("admin_reassign", "admin")
    lead = _own_lead(staff)

    login("admin_reassign")
    resp = client.patch(f"/api/leads/{lead.id}", json={"assigned_to_id": admin.id})
    assert resp.status_code == 200

    entry = AuditLog.query.filter_by(action="lead_reassign").one()
    assert entry.target_id == lead.id
    assert entry.actor_id == admin.id


def test_staff_cannot_reassign_own_contact(client, make_user, login):
    staff = make_user("staff_reassign_c", "staff")
    other = make_user("staff_other_c", "staff")
    contact = _own_contact(staff)

    login("staff_reassign_c")
    resp = client.patch(f"/api/contacts/{contact.id}", json={"assigned_to_id": other.id})
    assert resp.status_code == 403

    db.session.refresh(contact)
    assert contact.assigned_to_id == staff.id


def test_staff_can_still_edit_own_lead_title(client, make_user, login):
    staff = make_user("staff_edit_ok", "staff")
    lead = _own_lead(staff)

    login("staff_edit_ok")
    resp = client.patch(f"/api/leads/{lead.id}", json={"title": "Renamed"})
    assert resp.status_code == 200
    assert resp.get_json()["title"] == "Renamed"


def test_staff_cannot_create_lead_for_someone_else(client, make_user, login):
    staff = make_user("staff_create_for", "staff")
    other = make_user("staff_create_target", "staff")

    login("staff_create_for")
    resp = client.post("/api/leads", json={
        "title": "X", "contact_id": 1, "assigned_to_id": other.id,
    })
    assert resp.status_code == 403


def test_admin_can_create_lead_for_someone_else(client, make_user, login):
    make_user("admin_create_for", "admin")
    target = make_user("admin_create_target", "staff")

    login("admin_create_for")
    resp = client.post("/api/leads", json={
        "title": "X", "contact_id": 1, "assigned_to_id": target.id,
    })
    assert resp.status_code == 201


def test_role_change_is_audited_and_log_is_restricted(client, make_user, login, logout):
    make_user("owner_audit", "owner")
    make_user("admin_audit", "admin")
    make_user("staff_audit", "staff")
    target = make_user("audit_target", "staff")

    login("admin_audit")
    resp = client.patch(f"/auth/users/{target.id}/role", json={"role": "accountant"})
    assert resp.status_code == 200

    entry = AuditLog.query.filter_by(action="role_change").one()
    assert entry.target_id == target.id
    assert "staff -> accountant" in entry.detail

    resp = client.get("/api/audit-log")
    assert resp.status_code == 200
    assert any(e["action"] == "role_change" for e in resp.get_json()["entries"])
    logout()

    login("staff_audit")
    assert client.get("/api/audit-log").status_code == 403
    logout()

    login("owner_audit")
    assert client.get("/api/audit-log").status_code == 200


def test_delete_contact_is_audited(client, make_user, login):
    make_user("admin_del_audit", "admin")
    contact = Contacts(name="Doomed", phone="1", email="d@d.com", address="X")
    db.session.add(contact)
    db.session.commit()

    login("admin_del_audit")
    resp = client.delete(f"/api/contacts/{contact.id}")
    assert resp.status_code == 200

    entry = AuditLog.query.filter_by(action="contact_delete").one()
    assert entry.target_id == contact.id
