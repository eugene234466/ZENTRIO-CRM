"""
extensions.py
Single shared instances of db, bcrypt, login_manager, and CORS,
used across auth, contacts, and leads/pipeline/dashboard.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, current_user
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
cors = CORS()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
)


def rate_limit_user_key():
    """Key mutating limits by logged-in user id, falling back to IP."""
    try:
        if getattr(current_user, "is_authenticated", False):
            return f"user:{current_user.id}"
    except Exception:
        pass
    return get_remote_address()
