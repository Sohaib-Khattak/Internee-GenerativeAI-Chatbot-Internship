"""
Google Gemini client configuration.

Uses the Google Generative AI API (free tier, personal API key) as the
LLM backend for resume evaluation. The actual model call is built in
src/ai/chains.py via langchain_google_genai.ChatGoogleGenerativeAI.

Configuration:
    GEMINI_BASE_URL = https://generativelanguage.googleapis.com/v1beta
    GEMINI_MODEL = gemini-3.5-flash
"""

from __future__ import annotations

from config import Config


def get_model_name() -> str:
    """Return the configured Gemini model name."""
    return Config.GEMINI_MODEL


def is_configured() -> bool:
    """
    Check if the Gemini API key is configured.

    Returns:
        True if API key is set and non-empty.
    """
    key = Config.GEMINI_API_KEY
    return bool(key) and key != "your-gemini-api-key"