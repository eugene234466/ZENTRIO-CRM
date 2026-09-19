from extensions import db
from models import (
    Deal,
    Invoice,
    Notification,
    NotificationPreference,
)
from permissions import ROLE_STAFF, ROLE_OWNER


def test_get_notifications_empty(client, make_user, login):
    make_user("u_notif_empty", ROLE_STAFF)
    login("u_notif_empty")

    resp = client.get("/api/notifications")
    assert resp.status_code == 200
    assert resp.get_json() == {"notifications": []}


def test_get_preferences_defaults(client, make_user, login):
    make_user("u_notif_pref", ROLE_STAFF)
    login("u_notif_pref")

    resp = client.get("/api/notifications/preferences")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["overdue_invoices"] is True
    assert data["assigned_leads"] is True
    assert data["assigned_tasks"] is True
    assert data["pinned_messages"] is True


def test_update_preferences(client, make_user, login):
    make_user("u_notif_upd", ROLE_STAFF)
    login("u_notif_upd")

    resp = client.patch(
        "/api/notifications/preferences",
        json={"overdue_invoices": False},
    )
    assert resp.status_code == 200
    assert resp.get_json()["overdue_invoices"] is False
    assert resp.get_json()["assigned_leads"] is True


def test_notification_for_assigned_lead(client, make_user, login):
    staff = make_user("u_notif_lead", ROLE_STAFF)

    lead = Deal(
        title="My Assigned Lead", contact_id=1, value=100,
        assigned_to_id=staff.id,
    )
    db.session.add(lead)
    db.session.commit()

    login("u_notif_lead")
    resp = client.get("/api/notifications")
    assert resp.status_code == 200

    kinds = [n["kind"] for n in resp.get_json()["notifications"]]
    assert "assigned_lead" in kinds


def test_mark_notification_read(client, make_user, login):
    staff = make_user("u_notif_read", ROLE_STAFF)

    # This creates a notification directly for this user
    note = Notification(
        user_id=staff.id,
        kind="test",
        title="Test",
        body="",
        link="/x",
    )
    db.session.add(note)
    db.session.commit()

    login("u_notif_read")
    resp = client.patch(f"/api/notifications/{note.id}/read")
    assert resp.status_code == 200

    # This part confirm it's now read
    resp = client.get("/api/notifications")
    items = resp.get_json()["notifications"]
    assert any(n["id"] == note.id and n["is_read"] for n in items)


def test_mark_all_read(client, make_user, login):
    staff = make_user("u_notif_all", ROLE_STAFF)

    for i in range(3):
        db.session.add(Notification(
            user_id=staff.id, kind="test",
            title=f"T{i}", body="", link=f"/x{i}",
        ))
    db.session.commit()

    login("u_notif_all")
    resp = client.patch("/api/notifications/read-all")
    assert resp.status_code == 200

    resp = client.get("/api/notifications")
    items = resp.get_json()["notifications"]
    assert all(n["is_read"] for n in items)


def test_cannot_read_someone_elses_notification(client, make_user, login):
    staff = make_user("u_notif_other_a", ROLE_STAFF)
    other = make_user("u_notif_other_b", ROLE_STAFF)

    note = Notification(
        user_id=other.id, kind="test", title="Not Yours",
        body="", link="/y",
    )
    db.session.add(note)
    db.session.commit()

    login("u_notif_other_a")
    resp = client.patch(f"/api/notifications/{note.id}/read")
    assert resp.status_code == 404