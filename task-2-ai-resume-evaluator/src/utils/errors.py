"""
Error handling system for AI Resume Evaluator.

Defines AppError exception hierarchy and Flask error handler registration.
All user-facing errors go through this system for consistent JSON responses.
"""

from __future__ import annotations

from typing import Any

from flask import Flask, jsonify


class AppError(Exception):
    """
    Base application error with structured information for API responses.

    Attributes:
        message: Human-readable error message shown to users.
        code: Machine-readable error code (e.g., FILE_TOO_LARGE).
        status_code: HTTP status code (400, 413, 422, 429, 401, 500).
        actionable: Whether the user can take action to resolve the error.
    """

    def __init__(
        self,
        message: str,
        code: str,
        status_code: int = 400,
        actionable: bool = False,
    ) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        self.actionable = actionable
        super().__init__(message)


# ---------------------------------------------------------------------------
# Error registry — every user-facing error the app can produce
# ---------------------------------------------------------------------------

ERRORS: dict[str, dict[str, Any]] = {
    "FILE_TOO_LARGE": {
        "message": "File too large. Max 5 MB.",
        "status_code": 413,
        "actionable": True,
    },
    "UNSUPPORTED_FORMAT": {
        "message": "Unsupported format. Use PDF, DOCX, or TXT.",
        "status_code": 400,
        "actionable": True,
    },
    "EMPTY_FILE": {
        "message": "File appears to be empty.",
        "status_code": 400,
        "actionable": True,
    },
    "EXTRACTION_FAILED": {
        "message": "Couldn't read file. Try another format.",
        "status_code": 422,
        "actionable": True,
    },
    "PROTECTED_FILE": {
        "message": "File is password-protected. Please remove protection first.",
        "status_code": 422,
        "actionable": True,
    },
    "SCANNED_PDF": {
        "message": "No text could be extracted. Try a digital PDF, not a scanned image.",
        "status_code": 422,
        "actionable": True,
    },
    "AI_PROCESSING_ERROR": {
        "message": "Evaluation failed. Please try again.",
        "status_code": 500,
        "actionable": True,
    },
    "VALIDATION_ERROR": {
        "message": "Unexpected response format. Please try again.",
        "status_code": 500,
        "actionable": True,
    },
    "RATE_LIMITED": {
        "message": "Daily evaluation limit reached (10/10). Upgrade to Pro for unlimited evaluations.",
        "status_code": 429,
        "actionable": True,
    },
    "UNAUTHORIZED": {
        "message": "Please sign in first.",
        "status_code": 401,
        "actionable": True,
    },
    "NOT_FOUND": {
        "message": "Page not found.",
        "status_code": 404,
        "actionable": False,
    },
    "INTERNAL_ERROR": {
        "message": "An unexpected error occurred.",
        "status_code": 500,
        "actionable": False,
    },
}


def raise_app_error(code: str) -> None:
    """Raise an AppError by code from the error registry."""
    spec = ERRORS.get(code)
    if not spec:
        raise AppError("Unknown error.", "UNKNOWN_ERROR", 500)
    raise AppError(
        message=spec["message"],
        code=code,
        status_code=spec["status_code"],
        actionable=spec["actionable"],
    )


# ---------------------------------------------------------------------------
# Flask error handler registration
# ---------------------------------------------------------------------------


def register_error_handlers(app: Flask) -> None:
    """Register structured error handlers on a Flask application."""

    @app.errorhandler(AppError)
    def handle_app_error(error: AppError) -> tuple[Any, int]:
        return (
            jsonify(
                {
                    "error": error.message,
                    "code": error.code,
                    "actionable": error.actionable,
                }
            ),
            error.status_code,
        )

    @app.errorhandler(404)
    def handle_not_found(_error: Exception) -> tuple[Any, int]:
        return (
            jsonify(
                {
                    "error": ERRORS["NOT_FOUND"]["message"],
                    "code": "NOT_FOUND",
                    "actionable": False,
                }
            ),
            404,
        )

    @app.errorhandler(500)
    def handle_internal_error(_error: Exception) -> tuple[Any, int]:
        return (
            jsonify(
                {
                    "error": ERRORS["INTERNAL_ERROR"]["message"],
                    "code": "INTERNAL_ERROR",
                    "actionable": False,
                }
            ),
            500,
        )
