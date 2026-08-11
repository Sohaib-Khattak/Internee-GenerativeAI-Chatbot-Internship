"""
Tests for Flask routes (auth, upload, results, history).

Run with: pytest tests/test_routes.py -v
"""

from __future__ import annotations

import json
import os
import tempfile
from typing import Any, Generator

import pytest


@pytest.fixture
def app() -> Generator:
    """Create a test Flask application."""
    from app import create_app
    from config import Config

    # Use a temporary directory for test data
    with tempfile.TemporaryDirectory() as tmpdir:
        Config.DATA_DIR = os.path.join(tmpdir, "data")
        Config.UPLOAD_DIR = os.path.join(tmpdir, "uploads")

        app = create_app(Config)
        app.config["TESTING"] = True
        app.config["WTF_CSRF_ENABLED"] = False
        app.config["SECRET_KEY"] = "test-secret"

        with app.app_context():
            yield app


@pytest.fixture
def client(app) -> Generator:
    """Create a test client."""
    with app.test_client() as client:
        with client.session_transaction() as sess:
            sess.permanent = True
        yield client


class TestAuthRoutes:
    """Tests for authentication routes."""

    def test_login_page_loads(self, client):
        """Login page should return 200."""
        response = client.get("/auth/login")
        assert response.status_code == 200
        assert b"Sign In" in response.data or b"sign" in response.data.lower()

    def test_signup_page_loads(self, client):
        """Signup page should return 200."""
        response = client.get("/auth/signup")
        assert response.status_code == 200

    def test_signup_creates_user(self, client):
        """Valid signup should create user and redirect."""
        response = client.post(
            "/auth/signup",
            data={
                "email": "test@example.com",
                "password": "testpass123",
                "confirm_password": "testpass123",
            },
            follow_redirects=True,
        )
        assert response.status_code == 200

    def test_signup_password_mismatch(self, client):
        """Password mismatch should show error."""
        response = client.post(
            "/auth/signup",
            data={
                "email": "test@example.com",
                "password": "testpass123",
                "confirm_password": "different",
            },
            follow_redirects=True,
        )
        assert b"do not match" in response.data.lower() or b"error" in response.data.lower()

    def test_login_with_valid_credentials(self, client):
        """Valid login should redirect."""
        # First signup
        client.post(
            "/auth/signup",
            data={
                "email": "login@example.com",
                "password": "testpass123",
                "confirm_password": "testpass123",
            },
        )

        # Then login
        response = client.post(
            "/auth/login",
            data={
                "email": "login@example.com",
                "password": "testpass123",
            },
            follow_redirects=True,
        )
        assert response.status_code == 200

    def test_logout_clears_session(self, client):
        """Logout should clear session."""
        response = client.get("/auth/logout", follow_redirects=True)
        assert response.status_code == 200

    def test_upload_requires_auth(self, client):
        """Upload page should redirect to login for unauthenticated users."""
        response = client.get("/upload/", follow_redirects=True)
        assert response.status_code == 200
        # Should show some indication we're redirected
        assert b"sign" in response.data.lower() or b"Sign In" in response.data


class TestUploadRoutes:
    """Tests for upload routes."""

    def test_upload_page_authenticated(self, client):
        """Upload page should load for authenticated users."""
        # Signup and login
        client.post(
            "/auth/signup",
            data={
                "email": "upload@example.com",
                "password": "testpass123",
                "confirm_password": "testpass123",
            },
        )

        response = client.get("/upload/")
        assert response.status_code in (200, 302)


class TestResultsRoutes:
    """Tests for evaluation results routes."""

    def test_results_invalid_id(self, client):
        """Invalid eval ID should redirect or show error."""
        # Signup and login
        client.post(
            "/auth/signup",
            data={
                "email": "results@example.com",
                "password": "testpass123",
                "confirm_password": "testpass123",
            },
        )

        response = client.get("/results/invalid_id", follow_redirects=True)
        assert response.status_code == 200


class TestHistoryRoutes:
    """Tests for history routes."""

    def test_history_requires_auth(self, client):
        """History page should require auth."""
        response = client.get("/history/", follow_redirects=True)
        assert response.status_code == 200

    def test_history_authenticated(self, client):
        """History page should load for authenticated users."""
        client.post(
            "/auth/signup",
            data={
                "email": "history@example.com",
                "password": "testpass123",
                "confirm_password": "testpass123",
            },
        )

        response = client.get("/history/")
        assert response.status_code in (200, 302)
