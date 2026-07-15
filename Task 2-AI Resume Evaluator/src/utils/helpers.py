"""
Shared utility helpers for AI Resume Evaluator.

Provides miscellaneous helper functions used across the application.
"""

from __future__ import annotations

import math
from typing import Any


def format_file_size(size_bytes: int) -> str:
    """
    Format a byte count into a human-readable file size string.

    Args:
        size_bytes: File size in bytes.

    Returns:
        Human-readable string like "2.5 MB" or "340 KB".
    """
    if size_bytes == 0:
        return "0 B"

    units = ["B", "KB", "MB", "GB"]
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 1)

    return f"{s} {units[i]}"


def truncate_text(text: str, max_chars: int = 100) -> str:
    """
    Truncate text to a maximum number of characters, preserving word boundaries.

    Args:
        text: Text to truncate.
        max_chars: Maximum character count.

    Returns:
        Truncated text with ellipsis if needed.
    """
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "..."
