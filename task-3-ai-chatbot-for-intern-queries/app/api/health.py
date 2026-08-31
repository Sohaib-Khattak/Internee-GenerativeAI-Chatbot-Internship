from flask import Blueprint, current_app
import time

health_bp = Blueprint("health", __name__)

_start_time = time.time()


@health_bp.route("/api/health")
def health_check():
    """Health check endpoint for uptime monitoring."""
    uptime = int(time.time() - _start_time)
    return {
        "status": "healthy",
        "uptime_seconds": uptime,
        "flask_env": current_app.config.get("FLASK_ENV", "unknown"),
    }
