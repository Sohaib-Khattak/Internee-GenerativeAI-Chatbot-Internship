import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    # Google Gemini API
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("OPENCODE_API_KEY", ""))
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

    # Deprecated OpenCode config (kept for backward compatibility)
    OPENCODE_API_KEY = os.getenv("OPENCODE_API_KEY", "")
    OPENCODE_BASE_URL = os.getenv("OPENCODE_BASE_URL", "https://opencode.ai/zen/v1")
    OPENCODE_MODEL = os.getenv("OPENCODE_MODEL", "deepseek-v4-flash-free")

    # Telegram
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

    # WhatsApp (optional for MVP)
    WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "internee_chatbot_verify")

    # Rate limiting
    RATE_LIMIT_REQUESTS = 30
    RATE_LIMIT_WINDOW = 60  # seconds

    # Session
    SESSION_TTL_HOURS = 24
    MAX_HISTORY_MESSAGES = 20

    # Knowledge base
    KB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "knowledge-base")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
