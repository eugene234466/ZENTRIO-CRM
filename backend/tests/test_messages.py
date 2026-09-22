from extensions import db
from models import Message


def _message(author, content="Original"):
    message = Message(author_id=author.id, content=content)
    db.session.add(message)
    db.session.commit()
    return message


def test_message_uses_authenticated_author(client, make_user, login):
    author = make_user("message_author", "staff")
    login("message_author")

    response = client.post(
        "/api/messages",
        json={"content": "Hello", "author_id": 999, "author": "Forged"},
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["author"]["id"] == author.id
    assert payload["author"]["username"] == author.username
    assert payload["author"]["role"] == "staff"


def test_staff_can_edit_own_message(client, make_user, login):
    author = make_user("message_editor", "staff")
    message = _message(author)
    login("message_editor")

    response = client.patch(
        f"/api/messages/{message.id}",
        json={"content": "Updated"},
    )

    assert response.status_code == 200
    assert response.get_json()["content"] == "Updated"


def test_staff_cannot_edit_or_delete_other_message(client, make_user, login):
    author = make_user("message_owner", "staff")
    other = make_user("message_other", "staff")
    message = _message(author)
    login("message_other")

    edit_response = client.patch(
        f"/api/messages/{message.id}",
        json={"content": "Changed"},
    )
    delete_response = client.delete(f"/api/messages/{message.id}")

    assert edit_response.status_code == 403
    assert delete_response.status_code == 403


def test_manager_can_delete_other_message(client, make_user, login):
    author = make_user("message_staff", "staff")
    manager = make_user("message_manager", "manager")
    message = _message(author)
    login("message_manager")

    response = client.delete(f"/api/messages/{message.id}")

    assert response.status_code == 200
    assert Message.query.filter_by(id=message.id).first().deleted_at is not None


def test_staff_cannot_pin_message(client, make_user, login):
    author = make_user("message_pin_owner", "staff")
    message = _message(author)
    login("message_pin_owner")

    response = client.patch(
        f"/api/messages/{message.id}/pin",
        json={"is_pinned": True},
    )

    assert response.status_code == 403


def test_message_validation(client, make_user, login):
    make_user("message_validation", "staff")
    login("message_validation")

    response = client.post("/api/messages", json={"content": "  "})

    assert response.status_code == 400
