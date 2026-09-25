from extensions import db
from models import Message, MessageBoard, MessageBoardMember


def _board(owner, members=()):
    board = MessageBoard(name="Test board", created_by_id=owner.id)
    db.session.add(board)
    db.session.flush()
    ids = {owner.id, *(member.id for member in members)}
    db.session.add_all(MessageBoardMember(board_id=board.id, user_id=user_id, added_by_id=owner.id) for user_id in ids)
    db.session.commit()
    return board


def _message(author, board, content="Original"):
    message = Message(author_id=author.id, board_id=board.id, content=content)
    db.session.add(message)
    db.session.commit()
    return message


def test_message_uses_authenticated_author(client, make_user, login):
    author = make_user("message_author", "staff")
    board = _board(author)
    login("message_author")

    response = client.post(
        f"/api/boards/{board.id}/messages",
        json={"content": "Hello", "author_id": 999, "author": "Forged"},
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["author"]["id"] == author.id
    assert payload["author"]["username"] == author.username
    assert payload["author"]["role"] == "staff"


def test_staff_can_edit_own_message(client, make_user, login):
    author = make_user("message_editor", "staff")
    board = _board(author)
    message = _message(author, board)
    login("message_editor")

    response = client.patch(
        f"/api/boards/{board.id}/messages/{message.id}",
        json={"content": "Updated"},
    )

    assert response.status_code == 200
    assert response.get_json()["content"] == "Updated"


def test_staff_cannot_edit_or_delete_other_message(client, make_user, login):
    author = make_user("message_owner", "staff")
    other = make_user("message_other", "staff")
    board = _board(author, [other])
    message = _message(author, board)
    login("message_other")

    edit_response = client.patch(
        f"/api/boards/{board.id}/messages/{message.id}",
        json={"content": "Changed"},
    )
    delete_response = client.delete(f"/api/boards/{board.id}/messages/{message.id}")

    assert edit_response.status_code == 403
    assert delete_response.status_code == 403


def test_manager_can_delete_other_message(client, make_user, login):
    author = make_user("message_staff", "staff")
    manager = make_user("message_manager", "manager")
    board = _board(author, [manager])
    message = _message(author, board)
    login("message_manager")

    response = client.delete(f"/api/boards/{board.id}/messages/{message.id}")

    assert response.status_code == 200
    assert Message.query.filter_by(id=message.id).first().deleted_at is not None


def test_staff_cannot_pin_message(client, make_user, login):
    author = make_user("message_pin_owner", "staff")
    board = _board(author)
    message = _message(author, board)
    login("message_pin_owner")

    response = client.patch(
        f"/api/boards/{board.id}/messages/{message.id}/pin",
        json={"is_pinned": True},
    )

    assert response.status_code == 403


def test_message_validation(client, make_user, login):
    author = make_user("message_validation", "staff")
    login("message_validation")

    board = _board(author)
    response = client.post(f"/api/boards/{board.id}/messages", json={"content": "  "})

    assert response.status_code == 400


def test_non_member_cannot_read_or_post_to_board(client, make_user, login):
    owner = make_user("board_owner", "staff")
    stranger = make_user("board_stranger", "staff")
    board = _board(owner)
    login("board_stranger")

    assert client.get(f"/api/boards/{board.id}/messages").status_code == 403
    assert client.post(f"/api/boards/{board.id}/messages", json={"content": "No access"}).status_code == 403
