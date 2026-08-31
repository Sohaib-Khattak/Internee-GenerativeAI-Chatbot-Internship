"""Telegram Bot integration."""
import requests
from flask import Blueprint, request, jsonify, current_app

telegram_bp = Blueprint("telegram", __name__)


class TelegramBot:
    """Telegram Bot API wrapper."""

    def __init__(self, token: str):
        self.token = token
        self.base_url = f"https://api.telegram.org/bot{token}"

    def set_webhook(self, url: str):
        return requests.post(f"{self.base_url}/setWebhook", json={"url": url}).json()

    def send_message(self, chat_id: int, text: str):
        return requests.post(f"{self.base_url}/sendMessage", json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown",
        }).json()


def get_telegram_bot() -> object:
    token = current_app.config.get("TELEGRAM_BOT_TOKEN")
    if not token:
        return None
    return TelegramBot(token)


def get_rag_engine():
    """Get or create the shared RAG engine."""
    from app.core.llm_client import OpenCodeLLM
    from app.core.knowledge_base import KnowledgeBase
    from app.core.session_manager import SessionManager
    from app.core.rag_engine import RAGEngine

    if not hasattr(current_app, "_rag_engine") or current_app._rag_engine is None:
        kb_path = current_app.config.get("KB_PATH", "knowledge-base")
        llm = OpenCodeLLM(
            api_key=current_app.config["GEMINI_API_KEY"],
            model=current_app.config.get("GEMINI_MODEL"),
        )
        kb = KnowledgeBase(kb_path)
        sm = SessionManager()
        current_app._rag_engine = RAGEngine(llm=llm, knowledge_base=kb, session_manager=sm)
    return current_app._rag_engine


@telegram_bp.route("/api/webhooks/telegram", methods=["POST"])
def telegram_webhook():
    """Telegram webhook endpoint."""
    bot = get_telegram_bot()
    if not bot:
        return jsonify({"error": "Telegram not configured"}), 503

    data = request.get_json(silent=True) or {}
    message = data.get("message") or data.get("edited_message")
    if not message:
        return jsonify({"ok": True})

    chat_id = message.get("chat", {}).get("id")
    text = message.get("text", "").strip()
    user_id = message.get("from", {}).get("id")

    if not chat_id or not text:
        return jsonify({"ok": True})

    rag = get_rag_engine()
    result = rag.process_query(
        platform="telegram",
        platform_user_id=str(user_id),
        query=text,
    )

    reply = result.get("reply", "Sorry, I couldn't process that.")
    bot.send_message(chat_id, reply)

    return jsonify({"ok": True})
