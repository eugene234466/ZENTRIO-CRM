"""Rate-limit tests. The shared fixture disables the limiter, so these
tests re-enable it explicitly and use unique keys per test to avoid
cross-test contamination of the in-memory storage."""

import uuid

import pytest


@pytest.fixture
def limited_app(app):
    app.config["RATELIMIT_ENABLED"] = True
    return app


def _uid(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def test_login_rate_limited(client, make_user, limited_app):
    username = _uid("rl_login")
    make_user(username, "staff")

    for _ in range(10):
        resp = client.post(
            "/auth/login", json={"username": username, "password": "wrongpass1"}
        )
        assert resp.status_code == 401

    resp = client.post(
        "/auth/login", json={"username": username, "password": "wrongpass1"}
    )
    assert resp.status_code == 429
    assert "error" in resp.get_json()


def test_login_limit_is_per_username(client, make_user, limited_app):
    first = _uid("rl_first")
    second = _uid("rl_second")
    make_user(first, "staff")
    make_user(second, "staff")

    for _ in range(10):
        client.post("/auth/login", json={"username": first, "password": "wrongpass1"})

    # A different username from the same IP still gets through.
    resp = client.post(
        "/auth/login", json={"username": second, "password": "password123"}
    )
    assert resp.status_code == 200


def test_signup_rate_limited(client, limited_app):
    tag = uuid.uuid4().hex[:8]
    for i in range(5):
        resp = client.post("/auth/signup", json={
            "username": f"rl_signup_{tag}_{i}",
            "email": f"rl_signup_{tag}_{i}@test.com",
            "password": "password123",
        })
        assert resp.status_code == 201

    resp = client.post("/auth/signup", json={
        "username": f"rl_signup_{tag}_x",
        "email": f"rl_signup_{tag}_x@test.com",
        "password": "password123",
    })
    assert resp.status_code == 429
    assert "error" in resp.get_json()


def test_lead_create_rate_limited(client, make_user, login, limited_app):
    username = _uid("rl_lead")
    make_user(username, "admin")
    login(username)

    for i in range(60):
        resp = client.post("/api/leads", json={"title": f"L{i}", "contact_id": 1})
        assert resp.status_code == 201

    resp = client.post("/api/leads", json={"title": "TooMany", "contact_id": 1})
    assert resp.status_code == 429
    assert "error" in resp.get_json()


def test_rate_limit_error_shape_is_json(client, make_user, limited_app):
    username = _uid("rl_shape")
    make_user(username, "staff")

    for _ in range(11):
        resp = client.post(
            "/auth/login", json={"username": username, "password": "wrongpass1"}
        )

    assert resp.status_code == 429
    assert resp.is_json
    assert resp.get_json() == {"error": "Too many requests. Please slow down."}
