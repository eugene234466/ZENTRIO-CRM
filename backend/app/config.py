import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-dev-key-must-be-32-bytes-long-123456")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-dev-key-must-be-32-bytes-long-123456")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")