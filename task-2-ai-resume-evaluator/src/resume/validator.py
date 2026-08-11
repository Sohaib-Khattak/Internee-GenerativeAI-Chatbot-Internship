"""
File validation for uploaded resumes.

Validates file type, size, MIME type, and content before processing.
"""

from __future__ import annotations

import os
from typing import Any

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from config import Config


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

# MIME type mapping (as reported by Flask/browser upload)
EXTENSION_MIME_MAP: dict[str, set[str]] = {
    ".pdf": {
        "application/pdf",
        "application/x-pdf",
        "application/acrobat",
        "application/vnd.pdf",
    },
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",  # Some browsers send this for docx
    },
    ".txt": {
        "text/plain",
        "text/plain; charset=utf-8",
        "text/plain;charset=utf-8",
    },
}


def validate_file(file_storage: FileStorage) -> dict[str, Any]:
    """
    Validate an uploaded resume file.

    Checks:
    - File exists and is not empty
    - Extension is allowed (.pdf, .docx, .txt)
    - MIME type matches extension
    - File size is within limit

    Args:
        file_storage: Flask FileStorage object from request.files.

    Returns:
        dict with keys:
            - 'valid' (bool): Whether file is valid.
            - 'filename' (str): Sanitized filename (if valid).
            - 'error' (str): Error message (if invalid).
            - 'code' (str): Error code (if invalid).
    """
    # Check file was actually uploaded
    if not file_storage or not file_storage.filename:
        return {
            "valid": False,
            "error": "No file selected.",
            "code": "EMPTY_FILE",
        }

    # Sanitize filename
    original_filename = file_storage.filename
    safe_filename = secure_filename(original_filename)

    if not safe_filename:
        return {
            "valid": False,
            "error": "Invalid filename.",
            "code": "EMPTY_FILE",
        }

    # Check extension
    ext = os.path.splitext(safe_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return {
            "valid": False,
            "error": "Unsupported format. Use PDF, DOCX, or TXT.",
            "code": "UNSUPPORTED_FORMAT",
        }

    # Check MIME type (browser-provided, best-effort)
    mime = file_storage.content_type or ""
    allowed_mimes = EXTENSION_MIME_MAP.get(ext, set())
    if allowed_mimes and mime and mime not in allowed_mimes and mime != "application/octet-stream":
        return {
            "valid": False,
            "error": "File type does not match extension.",
            "code": "UNSUPPORTED_FORMAT",
        }

    # Check file size
    file_storage.seek(0, os.SEEK_END)
    file_size = file_storage.tell()
    file_storage.seek(0)  # Reset stream position

    if file_size == 0:
        return {
            "valid": False,
            "error": "File appears to be empty.",
            "code": "EMPTY_FILE",
        }

    if file_size > Config.MAX_FILE_SIZE_BYTES:
        return {
            "valid": False,
            "error": f"File too large. Max {Config.MAX_FILE_SIZE_MB} MB.",
            "code": "FILE_TOO_LARGE",
        }

    return {
        "valid": True,
        "filename": safe_filename,
        "size": file_size,
        "extension": ext,
        "error": None,
        "code": None,
    }


def check_daily_limit(user_data: dict) -> bool:
    """
    Check if user has reached their daily evaluation limit.

    Args:
        user_data: User data dict with evaluations list.

    Returns:
        True if user can still evaluate, False if limit reached.
    """
    if user_data.get("tier") == "pro":
        return True

    today_count = user_data.get("total_evaluations", 0)
    return today_count < Config.FREE_TIER_DAILY_LIMIT
