import os
from pathlib import Path

from flask import Flask, abort, jsonify, send_from_directory
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from sqlalchemy import inspect, text
load_dotenv()

from extensions import db, bcrypt, login_manager, cors, limiter
from config import config_map
from models import User

from routes.auth import auth_bp
from routes.contacts import contacts_bp
from routes.clients import clients_bp
from routes.pipeline import pipeline_bp
from routes.leads import leads_bp
from routes.dashboard import dashboard_bp
from routes.invoices import invoices_bp
from routes.audit_log import audit_bp

from search import search_bp
from notifications import notifications_bp
from routes.all_settings import settings_bp
from routes.messages import messages_bp


migrate = Migrate()
jwt = JWTManager()

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
USER_ROLES = ("owner", "admin", "manager", "staff", "accountant")


def create_app(config_name="development"):
    app = Flask(__name__, static_folder=None)
    app.url_map.strict_slashes = False
    app.config.from_object(config_map[config_name])

    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "login"
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}, r"/auth/*": {"origins": "*"}}, supports_credentials=True)
    limiter.init_app(app)
    app.register_error_handler(429, rate_limit_exceeded)

    app.register_blueprint(auth_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(pipeline_bp, url_prefix="/api")
    app.register_blueprint(leads_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(invoices_bp)
    app.register_blueprint(audit_bp, url_prefix="/api")
    app.register_blueprint(search_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
    app.register_blueprint(settings_bp)
    app.register_blueprint(messages_bp)

    # Ensure upload directories exist at startup so the first upload
    # doesn't race to create them. Both live under UPLOAD_FOLDER.
    os.makedirs(
        app.config.get("UPLOAD_FOLDER", "uploads"),
        exist_ok=True,
    )
    os.makedirs(
        app.config.get("AVATAR_FOLDER", "uploads/avatars"),
        exist_ok=True,
    )

    with app.app_context():
        if inspect(db.engine).has_table("user"):
            columns = {column["name"] for column in inspect(db.engine).get_columns("user")}
            if "role" not in columns:
                db.session.execute(
                    text("ALTER TABLE `user` ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'staff'")
                )
                db.session.commit()
        db.create_all()

    @app.route("/uploads/<path:filename>")
    def serve_uploads(filename):
        # Serves business logos AND avatars — avatars live in a subfolder
        # of UPLOAD_FOLDER, and the URL path mirrors that layout.
        upload_root = app.config.get("UPLOAD_FOLDER", "uploads")
        return send_from_directory(upload_root, filename)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("auth") or path.startswith("api"):
            abort(404)

        requested_file = FRONTEND_DIST / path
        if path and requested_file.is_file():
            return send_from_directory(str(FRONTEND_DIST), path)

        index_file = FRONTEND_DIST / "index.html"
        if index_file.is_file():
            return send_from_directory(str(FRONTEND_DIST), "index.html")

        abort(404)

    return app


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return {"error": "Login required."}, 401


def rate_limit_exceeded(e):
    return jsonify({"error": "Too many requests. Please slow down."}), 429