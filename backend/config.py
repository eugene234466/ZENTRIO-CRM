import os
from datetime import timedelta



_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

def _mysql_uri():
    user = os.environ.get("DB_USER", "root")
    password = os.environ.get("DB_PASSWORD", "Namore_ddonne_287#")
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "3306")
    name = os.environ.get("DB_NAME", "crm")
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


    UPLOAD_FOLDER = os.path.join(_BACKEND_DIR, "uploads")
 
    AVATAR_FOLDER = os.path.join(_BACKEND_DIR, "uploads", "avatars")


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or _mysql_uri()


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}