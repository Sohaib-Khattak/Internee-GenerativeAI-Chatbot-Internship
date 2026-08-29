"""
Server-side storage for pending (in-progress) resume evaluations.

Flask's default session is a signed cookie with a ~4KB size limit, so
raw resume text (up to 50,000 chars) cannot be stored in the session
directly — it would silently be dropped and the "Run Evaluation" step
would lose the resume.

Instead, the resume text is written to a server-side JSON file keyed by
a short random token. Only that small token is kept in the session
cookie. The file is deleted once the evaluation completes (or after an
expiry window) so no raw resume content persists indefinitely.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any, Optional

from config import Config

PENDING_DIR = os.path.join(Config.DATA_DIR, "pending")
PENDING_TTL_SECONDS = 60 * 60  # 1 hour — long enough for evaluation + retries


def _ensure_dir() -> None:
    """Create the pending storage directory if it doesn't exist."""
    os.makedirs(PENDING_DIR, exist_ok=True)


def _path(token: str) -> str:
    """Resolve the file path for a token (sanitised)."""
    return os.path.join(PENDING_DIR, f"{token}.json")


def save_pending(payload: dict[str, Any]) -> str:
    """
    Persist pending evaluation payload to disk and return a token.

    Args:
        payload: Dict of resume metadata (resume_text, filename, etc.).

    Returns:
        A token string to store in the session cookie.
    """
    _ensure_dir()
    token = os.urandom(16).hex()
    record = {
        "payload": payload,
        "created_at": time.time(),
    }
    with open(_path(token), "w") as f:
        json.dump(record, f)
    return token


def load_pending(token: str) -> Optional[dict[str, Any]]:
    """
    Load a pending evaluation payload by token.

    Returns:
        The stored payload dict, or None if missing/expired/invalid.
    """
    if not token or not token.isalnum() or len(token) > 40:
        return None
    path = _path(token)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r") as f:
            record = json.load(f)
    except (json.JSONDecodeError, IOError):
        return None

    # Expire old records
    if time.time() - record.get("created_at", 0) > PENDING_TTL_SECONDS:
        delete_pending(token)
        return None

    return record.get("payload")


def delete_pending(token: str) -> None:
    """Delete a pending evaluation record by token."""
    if not token or not token.isalnum() or len(token) > 40:
        return
    path = _path(token)
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass


def purge_expired() -> int:
    """
    Remove all expired pending records.

    Returns:
        Number of records purged.
    """
    _ensure_dir()
    now = time.time()
    purged = 0
    for filename in os.listdir(PENDING_DIR):
        if not filename.endswith(".json"):
            continue
        token = filename[:-5]
        path = _path(token)
        try:
            with open(path, "r") as f:
                record = json.load(f)
            if now - record.get("created_at", 0) > PENDING_TTL_SECONDS:
                delete_pending(token)
                purged += 1
        except (json.JSONDecodeError, IOError):
            delete_pending(token)
            purged += 1
    return purged
