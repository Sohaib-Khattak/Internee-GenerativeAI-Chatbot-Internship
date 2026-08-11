"""
Authentication routes — signup, login, logout, and session management.

Uses Werkzeug password hashing and Flask session-based auth.
Google OAuth placeholder included for Phase 2 integration.

User data is stored as JSON files in the data/ directory.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Callable, Optional

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

USERS_DIR = os.path.join(Config.DATA_DIR, "users")


def _ensure_users_dir() -> None:
    """Create the users data directory if it doesn't exist."""
    os.makedirs(USERS_DIR, exist_ok=True)


def _get_user_path(user_id: str) -> str:
    """Get the file path for a user's data file."""
    return os.path.join(USERS_DIR, f"{user_id}.json")


def _load_user(user_id: str) -> Optional[dict[str, Any]]:
    """Load user data from JSON file. Returns None if not found."""
    path = _get_user_path(user_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def _save_user(user_id: str, data: dict[str, Any]) -> None:
    """Save user data to JSON file."""
    _ensure_users_dir()
    path = _get_user_path(user_id)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def _find_user_by_email(email: str) -> Optional[tuple[str, dict[str, Any]]]:
    """Find a user by email. Returns (user_id, user_data) or None."""
    _ensure_users_dir()
    email_lower = email.lower().strip()
    for filename in os.listdir(USERS_DIR):
        if not filename.endswith(".json"):
            continue
        user_id = filename[:-5]
        user_data = _load_user(user_id)
        if user_data and user_data.get("email", "").lower() == email_lower:
            return (user_id, user_data)
    return None


def get_current_user() -> Optional[dict[str, Any]]:
    """
    Get the currently logged-in user's data.

    Returns:
        dict with user data, or None if not authenticated.
    """
    user_id = session.get("user_id")
    if not user_id:
        return None
    return _load_user(user_id)


def login_required(f: Callable) -> Callable:
    """
    Decorator to require authentication for a route.

    Redirects to login page if user is not authenticated.
    """

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        if "user_id" not in session:
            flash("Please sign in first.", "warning")
            return redirect(url_for("auth.login", next=request.path))
        return f(*args, **kwargs)

    return decorated_function


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    """Handle user registration with email + password."""
    if "user_id" in session:
        return redirect(url_for("upload.index"))

    if request.method == "GET":
        return render_template("signup.html")

    # POST — process form
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    confirm = request.form.get("confirm_password", "")

    # Validation
    errors: list[str] = []
    if not email or "@" not in email:
        errors.append("Please enter a valid email address.")
    if len(password) < 6:
        errors.append("Password must be at least 6 characters.")
    if password != confirm:
        errors.append("Passwords do not match.")

    if errors:
        for err in errors:
            flash(err, "error")
        return render_template("signup.html", email=email)

    # Check if email already exists
    existing = _find_user_by_email(email)
    if existing:
        flash("An account with this email already exists. Please sign in.", "error")
        return render_template("signup.html", email=email)

    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_data: dict[str, Any] = {
        "user_id": user_id,
        "email": email,
        "password_hash": generate_password_hash(password),
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "evaluations": [],
        "total_evaluations": 0,
        "settings": {
            "dark_mode": False,
        },
    }

    _save_user(user_id, user_data)
    session["user_id"] = user_id
    session.permanent = True

    flash("Account created successfully!", "success")
    return redirect(url_for("upload.index"))


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """Handle user login with email + password."""
    if "user_id" in session:
        return redirect(url_for("upload.index"))

    if request.method == "GET":
        return render_template("login.html")

    # POST — process form
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    next_page = request.args.get("next", url_for("upload.index"))

    if not email or not password:
        flash("Please enter both email and password.", "error")
        return render_template("login.html", email=email)

    # Find user
    found = _find_user_by_email(email)
    if not found:
        flash("No account found with this email.", "error")
        return render_template("login.html", email=email)

    user_id, user_data = found

    # Verify password
    if not check_password_hash(user_data["password_hash"], password):
        flash("Incorrect password.", "error")
        return render_template("login.html", email=email)

    session["user_id"] = user_id
    session.permanent = True

    flash("Signed in successfully!", "success")
    return redirect(next_page)


@auth_bp.route("/logout")
def logout():
    """Clear the user session and redirect to home."""
    session.clear()
    flash("Signed out successfully.", "success")
    return redirect(url_for("upload.index"))


@auth_bp.route("/google-login")
def google_login():
    """
    Placeholder for Google OAuth login.
    Will be implemented with authlib in Phase 2.
    """
    flash("Google sign-in is coming soon. Use email/password for now.", "info")
    return redirect(url_for("auth.login"))
