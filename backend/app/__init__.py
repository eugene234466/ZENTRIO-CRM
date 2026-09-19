from flask	import	Flask, app, app
from flask_sqlalchemy	import	SQLAlchemy
from flask_migrate	import	Migrate
from flask_jwt_extended	import	JWTManager
from flask_cors	import	CORS
from dotenv import load_dotenv
load_dotenv()
from app.config import DevelopmentConfig, ProductionConfig
from app.config import DevelopmentConfig
from app.extensions import db

migrate	=	Migrate()
jwt	=	JWTManager()


config_map = {
    "development":DevelopmentConfig,
    "production":ProductionConfig
}

def	create_app(config_name="development"):
    app	=	Flask(__name__)
    app.url_map.strict_slashes = False

    app.config.from_object(config_map[config_name])

    db.init_app(app)
    migrate.init_app(app,	db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)	
	
    from	app.routes.all_settings	import	settings_bp
    

   
    app.register_blueprint(settings_bp)

    return app