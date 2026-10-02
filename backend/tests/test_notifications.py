from extensions import db
from models import (
    Deal,
    Invoice,
    Message,
    MessageBoard,
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


def test_deleted_lead_does_not_generate_notification(client, make_user, login):
    staff = make_user("u_notif_del_lead", ROLE_STAFF)

    lead = Deal(
        title="Gone Lead", contact_id=1, value=100,
        assigned_to_id=staff.id,
    )
    db.session.add(lead)
    db.session.commit()
    lead.deleted_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.session.commit()

    login("u_notif_del_lead")
    resp = client.get("/api/notifications")
    kinds = [n["kind"] for n in resp.get_json()["notifications"]]
    assert "assigned_lead" not in kinds


def test_deleted_pinned_message_does_not_generate_notification(client, make_user, login):
    staff = make_user("u_notif_pin_del", ROLE_STAFF)
    board = MessageBoard(name="Board", created_by_id=staff.id)
    db.session.add(board)
    db.session.flush()

    msg = Message(
        author_id=staff.id,
        board_id=board.id,
        content="Old pinned",
        is_pinned=True,
    )
    db.session.add(msg)
    db.session.commit()

    login("u_notif_pin_del")
    resp = client.get("/api/notifications")
    kinds = [n["kind"] for n in resp.get_json()["notifications"]]
    assert "pinned_message" in kinds

    msg.deleted_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.session.commit()
    Notification.query.filter_by(user_id=staff.id, kind="pinned_message").delete()
    db.session.commit()

    resp = client.get("/api/notifications")
    kinds = [n["kind"] for n in resp.get_json()["notifications"]]
    assert "pinned_message" not in kinds


def test_deleted_overdue_invoice_does_not_generate_notification(client, make_user, login):
    staff = make_user("u_notif_inv_del", ROLE_OWNER)

    inv = Invoice(
        invoice_number="INV-DEL-1",
        client_name="Gone Client",
        status="sent",
        due_date=__import__("datetime").date(2020, 1, 1),
        total=100,
    )
    db.session.add(inv)
    db.session.commit()

    login("u_notif_inv_del")
    resp = client.get("/api/notifications")
    kinds = [n["kind"] for n in resp.get_json()["notifications"]]
    assert "overdue_invoice" in kinds

    inv.deleted_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.session.commit()
    Notification.query.filter_by(user_id=staff.id, kind="overdue_invoice").delete()
    db.session.commit()

    resp = client.get("/api/notifications")
    kinds = [n["kind"] for n in resp.get_json()["notifications"]]
    assert "overdue_invoice" not in kinds


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



def test_pinned_notification_only_for_boards_user_belongs_to(
    client, make_user, login
):
    from models import Message, MessageBoard, MessageBoardMember

    staff = make_user("notif_pin_member", ROLE_STAFF)
    outsider = make_user("notif_pin_outsider", ROLE_STAFF)

    # Board staff is on
    shared_board = MessageBoard(name="Shared", created_by_id=staff.id)
    db.session.add(shared_board)
    db.session.flush()
    db.session.add(MessageBoardMember(
        board_id=shared_board.id, user_id=staff.id, added_by_id=staff.id,
    ))

    # Board staff is NOT on
    private_board = MessageBoard(name="Private", created_by_id=outsider.id)
    db.session.add(private_board)
    db.session.flush()
    db.session.add(MessageBoardMember(
        board_id=private_board.id, user_id=outsider.id, added_by_id=outsider.id,
    ))

    db.session.add(Message(
        author_id=staff.id, board_id=shared_board.id,
        content="Visible pin", is_pinned=True,
    ))
    db.session.add(Message(
        author_id=outsider.id, board_id=private_board.id,
        content="Hidden pin", is_pinned=True,
    ))
    db.session.commit()

    login("notif_pin_member")
    resp = client.get("/api/notifications")
    items = resp.get_json()["notifications"]
    pinned = [n for n in items if n["kind"] == "pinned_message"]

    # Only the pin on the board staff belongs to should be delivered.
    assert len(pinned) == 1
    assert "Visible pin" in pinned[0]["body"]
    assert "Hidden pin" not in pinned[0]["body"]