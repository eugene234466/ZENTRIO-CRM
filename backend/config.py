import os
from datetime import timedelta



_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


def _normalize_sqlite_uri(database_url):
    if not database_url or not database_url.startswith("sqlite://"):
        return database_url

    db_path = database_url.replace("sqlite:///", "", 1)
    if not os.path.isabs(db_path):
        db_path = os.path.join(_BACKEND_DIR, db_path)
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    return database_url


def _sqlite_uri():
    sqlite_path = os.path.join(_BACKEND_DIR, "instance", "zentrio-dev.db")
    os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    return f"sqlite:///{sqlite_path}"


def _mysql_uri():
    user = os.environ.get("DB_USER", "zentrio")
    password = os.environ.get("DB_PASSWORD", "zentrio")
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "3306")
    name = os.environ.get("DB_NAME", "zentrio")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-fallback")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI", "memory://")
    # Office machines stay logged in: cap every session at 8 hours.
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)

    # Upper bound on any request body (uploads included). Individual
    # upload endpoints enforce their own tighter per-file limits.
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024

    UPLOAD_FOLDER = os.path.join(_BACKEND_DIR, "uploads")
 
    AVATAR_FOLDER = os.path.join(_BACKEND_DIR, "uploads", "avatars")


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _normalize_sqlite_uri(os.environ.get("DATABASE_URL") or _sqlite_uri())


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = _normalize_sqlite_uri(os.environ.get("DATABASE_URL"))


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}