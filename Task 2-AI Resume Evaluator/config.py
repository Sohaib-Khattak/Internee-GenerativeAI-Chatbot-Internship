"""
Configuration management for AI Resume Evaluator.

Reads environment variables with sensible defaults.
Uses python-dotenv to load .env file in development.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration loaded from environment variables."""

    # Flask
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-to-a-random-secret-key")
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")

    # AI Provider (DeepSeek v4 free via OpenCode Zen API)
    ZEN_API_KEY: str = os.getenv("ZEN_API_KEY", "")
    ZEN_BASE_URL: str = os.getenv(
        "ZEN_BASE_URL", "https://opencode.ai/zen/v1"
    )
    ZEN_MODEL: str = os.getenv("ZEN_MODEL", "deepseek-v4-flash-free")

    # App Limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "5"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    EVALUATION_TTL_DAYS: int = int(os.getenv("EVALUATION_TTL_DAYS", "30"))
    MAX_TEXT_LENGTH: int = 50_000  # Max chars extracted from resume
    FREE_TIER_DAILY_LIMIT: int = 10  # Evaluations per day for free users
    SLOW_EVAL_THRESHOLD_SECONDS: int = 15

    # Allowed file types
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".txt"}
    ALLOWED_MIME_TYPES: dict = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
    }

    # Paths
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
