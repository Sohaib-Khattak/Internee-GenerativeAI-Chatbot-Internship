"""Analytics API — query volume, top intents, latency, error tracking."""
from flask import Blueprint, jsonify, current_app
from app.core.session_manager import SessionManager
from app.core.rag_engine import RAGEngine

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/api/analytics/summary", methods=["GET"])
def analytics_summary():
    """Return analytics summary from the database."""
    sm = SessionManager()

    # Conn to SQLite for custom queries
    conn = sm._get_conn()

    try:
        # Total messages
        total_msgs = conn.execute("SELECT COUNT(*) as cnt FROM messages").fetchone()["cnt"]

        # Total sessions
        total_sessions = conn.execute("SELECT COUNT(*) as cnt FROM sessions").fetchone()["cnt"]

        # Messages by role
        user_msgs = conn.execute(
            "SELECT COUNT(*) as cnt FROM messages WHERE role='user'"
        ).fetchone()["cnt"]
        bot_msgs = conn.execute(
            "SELECT COUNT(*) as cnt FROM messages WHERE role='assistant'"
        ).fetchone()["cnt"]

        # Sessions by platform
        widget_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM sessions WHERE platform='widget'"
        ).fetchone()["cnt"]
        telegram_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM sessions WHERE platform='telegram'"
        ).fetchone()["cnt"]
        whatsapp_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM sessions WHERE platform='whatsapp'"
        ).fetchone()["cnt"]

        return jsonify({
            "total_queries": total_msgs,
            "total_sessions": total_sessions,
            "user_messages": user_msgs,
            "bot_responses": bot_msgs,
            "sessions_by_platform": {
                "widget": widget_count,
                "telegram": telegram_count,
                "whatsapp": whatsapp_count,
            },
            "status": "ok",
        }), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500
    finally:
        conn.close()
