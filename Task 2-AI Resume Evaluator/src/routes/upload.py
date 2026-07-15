"""
Upload routes — file upload, validation, parsing, and evaluation trigger.

Handles:
- File upload form (GET /upload)
- File processing (POST /upload)
- Drag-and-drop zone with client-side JS integration
- Anonymous evaluation checkbox
- Target role / job description input
"""

from __future__ import annotations

import time
from typing import Any

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from config import Config
from src.resume.parser import extract_text, get_text_preview
from src.resume.pii import mask_all
from src.resume.validator import check_daily_limit, validate_file
from src.routes.auth import get_current_user, login_required

upload_bp = Blueprint("upload", __name__, url_prefix="/upload")


@upload_bp.route("/")
@login_required
def index():
    """Render the upload page."""
    user = get_current_user()
    if not user:
        return redirect(url_for("auth.login"))

    limit_reached = not check_daily_limit(user)

    return render_template(
        "upload.html",
        limit_reached=limit_reached,
        max_file_size_mb=Config.MAX_FILE_SIZE_MB,
        slow_eval_timeout=Config.SLOW_EVAL_THRESHOLD_SECONDS,
    )


@upload_bp.route("/process", methods=["POST"])
@login_required
def process():
    """
    Process uploaded resume file.

    Validates → parses → masks PII → renders text preview.
    Actual AI evaluation happens in /evaluate (results route).
    """
    user = get_current_user()
    if not user:
        return redirect(url_for("auth.login"))

    # Check daily limit
    if not check_daily_limit(user):
        flash(
            f"Daily evaluation limit reached ({Config.FREE_TIER_DAILY_LIMIT}/{Config.FREE_TIER_DAILY_LIMIT}). "
            "Upgrade to Pro for unlimited evaluations.",
            "warning",
        )
        return render_template(
            "upload.html",
            limit_reached=True,
        )

    # Check if file was provided
    if "resume" not in request.files:
        flash("No file selected.", "error")
        return redirect(url_for("upload.index"))

    file_storage = request.files["resume"]

    # Validate file
    validation = validate_file(file_storage)
    if not validation["valid"]:
        flash(validation["error"], "error")
        return redirect(url_for("upload.index"))

    # Get optional inputs
    target_role = request.form.get("target_role", "").strip()
    anonymous = request.form.get("anonymous_eval") == "on"

    # Extract text from resume
    result = extract_text(file_storage, validation["filename"])

    if "error" in result:
        flash(result["error"], "error")
        return redirect(url_for("upload.index"))

    # Mask PII
    text = result["text"]
    if anonymous:
        from src.resume.pii import mask_name

        text = mask_name(text, enabled=True)

    text = mask_all(text, anonymous=anonymous)

    # Store in session for evaluation
    session["resume_text"] = text
    session["resume_filename"] = validation["filename"]
    session["resume_pages"] = result.get("pages", 1)
    session["resume_format"] = result.get("format", "")
    session["resume_truncated"] = result.get("truncated", False)
    session["anonymous_eval"] = anonymous
    session["target_role"] = target_role

    # Text preview
    preview = get_text_preview(text)

    return render_template(
        "upload.html",
        text_preview=preview,
        filename=validation["filename"],
        file_size=validation.get("size", 0),
        pages=result.get("pages", 1),
        file_format=result.get("format", ""),
        truncated=result.get("truncated", False),
        target_role=target_role,
        anonymous=anonymous,
        text_ready=True,
    )
