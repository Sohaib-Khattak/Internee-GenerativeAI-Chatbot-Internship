"""Configuration for the Gemini (Google AI) integration.

The API key is read from the `GEMINI_API_KEY` environment variable, or from a
local `.env` file if present. It is never hard-coded in source, so it can't leak
into version control. If no key is found, Gemini features fall back to their
deterministic offline path (the tool remains fully functional without a key).

The user supplies their key; here we only load it.
"""

from __future__ import annotations

import os
from pathlib import Path


def _load_env_file() -> None:
    """Best-effort: load KEY=VALUE pairs from a local .env (not required)."""
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    try:
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)
    except OSError:
        pass


_load_env_file()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

# Push the key into the genai client config path used in this project.
if GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY


def gemini_available() -> bool:
    return bool(GEMINI_API_KEY)
