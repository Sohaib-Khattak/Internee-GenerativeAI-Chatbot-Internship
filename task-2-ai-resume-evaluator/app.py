"""
AI Resume Evaluator — Main Flask Application Entry Point

Serves as the monolithic application combining frontend (Jinja2 templates)
and backend (resume parsing, AI evaluation, auth) in a single process.

Usage:
    flask run
    gunicorn app:app
"""

from __future__ import annotations

import os

from flask import Flask, render_template

from config import Config
from src.utils.errors import register_error_handlers


def create_app(config_class: type[Config] = Config) -> Flask:
    """
    Application factory — creates and configures the Flask instance.

    Args:
        config_class: Configuration class to use (defaults to Config).

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure data directories exist
    os.makedirs(config_class.DATA_DIR, exist_ok=True)
    os.makedirs(config_class.UPLOAD_DIR, exist_ok=True)

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints (lazy-import to avoid circular dependencies)
    from src.routes.auth import auth_bp
    from src.routes.upload import upload_bp
    from src.routes.results import results_bp
    from src.routes.history import history_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(results_bp)
    app.register_blueprint(history_bp)

    # Root route — landing page
    @app.route("/")
    def index():
        """Render the landing/home page."""
        from src.routes.auth import get_current_user
        return render_template("index.html")

    # Settings route
    @app.route("/settings")
    def settings():
        """Render the settings/preferences page."""
        from src.routes.auth import get_current_user, login_required

        user = get_current_user()
        if not user:
            return render_template("login.html")
        return render_template("settings.html")

    # Inject default context into all templates
    @app.context_processor
    def inject_globals() -> dict:
        """Make config and auth state available in all templates."""
        from src.routes.auth import get_current_user

        return {
            "current_user": get_current_user(),
            "app_name": "AI Resume Evaluator",
            "max_file_size_mb": config_class.MAX_FILE_SIZE_MB,
        }

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
