"""WhatsApp Business API integration via Cloud API."""
import requests
import hashlib
import hmac
from flask import Blueprint, request, jsonify, current_app

whatsapp_bp = Blueprint("whatsapp", __name__)


class WhatsAppClient:
    """WhatsApp Business Cloud API wrapper."""

    API_BASE = "https://graph.facebook.com/v21.0"

    def __init__(self, phone_number_id: str, access_token: str):
        self.phone_number_id = phone_number_id
        self.access_token = access_token

    def send_text(self, to: str, text: str):
        """Send a plain text message."""
        return self._call_api({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": text},
        })

    def send_interactive_buttons(self, to: str, body: str, buttons: list):
        """Send quick-reply buttons."""
        return self._call_api({
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body},
                "action": {"buttons": buttons},
            },
        })

    def _call_api(self, payload: dict) -> dict:
        url = f"{self.API_BASE}/{self.phone_number_id}/messages"
        resp = requests.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


def get_whatsapp_client():
    phone_id = current_app.config.get("WHATSAPP_PHONE_NUMBER_ID")
    token = current_app.config.get("WHATSAPP_ACCESS_TOKEN")
    if not phone_id or not token:
        return None
    return WhatsAppClient(phone_id, token)


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


@whatsapp_bp.route("/api/webhooks/whatsapp", methods=["GET"])
def whatsapp_verify():
    """WhatsApp webhook verification challenge."""
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    expected_token = current_app.config.get("WHATSAPP_VERIFY_TOKEN", "internee_chatbot_verify")

    if mode == "subscribe" and token == expected_token and challenge:
        return challenge, 200
    return jsonify({"error": "Verification failed"}), 403


@whatsapp_bp.route("/api/webhooks/whatsapp", methods=["POST"])
def whatsapp_webhook():
    """WhatsApp incoming message webhook."""
    data = request.get_json(silent=True) or {}

    # Verify signature if configured
    # signature = request.headers.get("X-Hub-Signature-256", "")

    entry = data.get("entry", [])
    for e in entry:
        changes = e.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            for msg in messages:
                if msg.get("type") == "text":
                    from_number = msg.get("from", "")
                    text = msg.get("text", {}).get("body", "").strip()
                    msg_id = msg.get("id", "")

                    if not from_number or not text:
                        continue

                    # Process via RAG engine
                    rag = get_rag_engine()
                    result = rag.process_query(
                        platform="whatsapp",
                        platform_user_id=from_number,
                        query=text,
                    )

                    # Send reply
                    client = get_whatsapp_client()
                    if client:
                        reply = result.get("reply", "Sorry, I couldn't process that.")
                        client.send_text(from_number, reply)

    return jsonify({"ok": True}), 200
