"""Chat API endpoint for the web widget."""
from flask import Blueprint, request, jsonify, current_app, Response, stream_with_context
import os
import json

from config import Config
from app.core.llm_client import OpenCodeLLM
from app.core.knowledge_base import KnowledgeBase
from app.core.session_manager import SessionManager
from app.core.rag_engine import RAGEngine
from app.core.rate_limiter import rate_limit, limiter

chat_bp = Blueprint("chat", __name__)

# Lazy-init globals
_rag_engine = None


def _get_rag_engine() -> RAGEngine:
    global _rag_engine
    if _rag_engine is None:
        kb_path = current_app.config.get("KB_PATH", Config.KB_PATH)
        llm = OpenCodeLLM(
            api_key=current_app.config["GEMINI_API_KEY"],
            model=current_app.config.get("GEMINI_MODEL"),
        )
        kb = KnowledgeBase(kb_path)
        sm = SessionManager()
        _rag_engine = RAGEngine(llm_client=llm, knowledge_base=kb, session_manager=sm)
    return _rag_engine


@chat_bp.route("/api/chat", methods=["POST"])
@rate_limit(limit=30, per=60)
def chat():
    """Main chat endpoint for the web widget."""
    data = request.get_json(silent=True) or {}

    query = (data.get("message") or "").strip()
    platform_user_id = data.get("user_id") or request.remote_addr or "anonymous"

    if not query:
        return jsonify({"error": "Message is required"}), 400

    engine = _get_rag_engine()
    result = engine.process_query(
        platform="widget",
        platform_user_id=platform_user_id,
        query=query,
    )

    return jsonify(result), 200


@chat_bp.route("/api/chat/stream/<session_id>", methods=["GET"])
def stream_chat(session_id):
    """SSE streaming endpoint for web widget typing effect."""
    # This endpoint pairs with the POST /api/chat endpoint.
    # The widget first calls POST /api/chat, then opens this SSE stream
    # to receive tokens as they arrive (if available).
    return Response(
        stream_with_context(_generate_sse(session_id)),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


def _generate_sse(session_id: str):
    """Generate SSE events for a given session."""
    import time
    # For now, send a heartbeat and then done
    # Full streaming will be implemented when the RAG engine supports it
    yield f"event: token\ndata: \n\n"
    time.sleep(0.1)
    yield f"event: done\ndata: {json.dumps({'session_id': session_id})}\n\n"
