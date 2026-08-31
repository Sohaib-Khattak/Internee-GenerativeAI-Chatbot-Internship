from flask import Flask, render_template
from config import config_map


def create_app(config_name: str = "development") -> Flask:
    """Flask app factory."""
    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map["development"]))

    # Register blueprints
    from app.api.health import health_bp
    from app.api.chat import chat_bp
    from app.integrations.telegram import telegram_bp
    from app.integrations.whatsapp import whatsapp_bp
    from app.api.analytics import analytics_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(telegram_bp)
    app.register_blueprint(whatsapp_bp)
    app.register_blueprint(analytics_bp)

    # Root endpoint — serve the chat widget UI
    @app.route("/")
    def index():
        return render_template("index.html")

    return app
