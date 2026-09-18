import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret"

import pytest
from app import create_app
from extensions import db, bcrypt
from models import User


@pytest.fixture
def app():
    app = create_app("development")
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False

    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def make_user(app):
    counter = {"n": 0}

    def _make(username=None, role="staff", password="password123"):
        counter["n"] += 1
        if username is None:
            username = f"user{counter['n']}"

        user = User(
            username=username,
            email=f"{username}@test.com",
            password=bcrypt.generate_password_hash(password).decode("utf-8"),
            role=role,
        )
        db.session.add(user)
        db.session.commit()
        return user

    return _make


@pytest.fixture
def login(client):
    def _login(username, password="password123"):
        return client.post(
            "/auth/login",
            json={"username": username, "password": password},
        )

    return _login


@pytest.fixture
def logout(client):
    def _logout():
        return client.post("/auth/logout")

    return _logout