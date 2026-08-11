"""
DeepSeek v4 client configuration via OpenCode Zen API.

Uses the OpenAI SDK with a custom base URL pointing to the Zen API,
which provides free access to DeepSeek v4 models.

Configuration:
    ZEN_BASE_URL = https://opencode.ai/zen/v1
    ZEN_MODEL = deepseek-v4-flash-free
"""

from __future__ import annotations

import os

from openai import OpenAI

from config import Config


def get_client() -> OpenAI:
    """
    Create and return an OpenAI-compatible client for DeepSeek v4.

    Returns:
        Configured OpenAI client pointing at Zen API.
    """
    return OpenAI(
        api_key=Config.ZEN_API_KEY,
        base_url=Config.ZEN_BASE_URL,
    )


def get_model_name() -> str:
    """Return the configured model name."""
    return Config.ZEN_MODEL


def is_configured() -> bool:
    """
    Check if the Zen API key is configured.

    Returns:
        True if API key is set and non-empty.
    """
    key = Config.ZEN_API_KEY
    return bool(key) and key != "your-zen-api-key-here"
