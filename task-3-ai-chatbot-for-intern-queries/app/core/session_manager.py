"""SQLite-backed session storage — persists across restarts."""
import sqlite3
import uuid
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from dataclasses import dataclass, asdict
from config import Config


@dataclass
class Message:
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: str = ""


@dataclass
class Session:
    id: str
    platform: str  # "widget" | "telegram" | "whatsapp"
    platform_user_id: str
    messages: list[Message]
    created_at: str
    is_active: bool = True


class SessionManager:
    """SQLite-backed session and message storage."""

    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                "data",
                "chatbot.db",
            )
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._db_path = db_path
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        conn = self._get_conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                platform TEXT NOT NULL,
                platform_user_id TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(platform, platform_user_id)
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp);
        """)
        conn.commit()
        conn.close()

    def get_or_create(self, platform: str, platform_user_id: str) -> Session:
        """Find existing session or create a new one."""
        conn = self._get_conn()
        cur = conn.execute(
            "SELECT id, platform, platform_user_id, is_active, created_at FROM sessions "
            "WHERE platform = ? AND platform_user_id = ?",
            (platform, platform_user_id),
        )
        row = cur.fetchone()

        if row is None:
            session_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            conn.execute(
                "INSERT INTO sessions (id, platform, platform_user_id, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (session_id, platform, platform_user_id, now, now),
            )
            conn.commit()
            session_data = {
                "id": session_id, "platform": platform,
                "platform_user_id": platform_user_id, "is_active": 1, "created_at": now,
            }
        else:
            session_data = dict(row)

        # Load message history (last 20)
        max_history = Config.MAX_HISTORY_MESSAGES
        cur = conn.execute(
            "SELECT role, content, timestamp FROM messages "
            "WHERE session_id = ? ORDER BY timestamp ASC",
            (session_data["id"],),
        )
        messages = [Message(**dict(m)) for m in cur.fetchall()][-max_history:]
        conn.close()

        return Session(
            id=session_data["id"],
            platform=session_data["platform"],
            platform_user_id=session_data["platform_user_id"],
            messages=messages,
            created_at=session_data["created_at"],
            is_active=bool(session_data["is_active"]),
        )

    def add_message(self, session_id: str, role: str, content: str) -> int:
        """Add a message and return its ID."""
        conn = self._get_conn()
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?",
            (now, session_id),
        )
        cur = conn.execute(
            "INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
            (session_id, role, content, now),
        )
        msg_id = cur.lastrowid
        conn.commit()
        conn.close()
        return msg_id

    def clear_session(self, session_id: str):
        """Delete a session and all its messages."""
        conn = self._get_conn()
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        conn.close()

    def get_active_session_count(self) -> int:
        """Count of active sessions (for analytics)."""
        conn = self._get_conn()
        cur = conn.execute("SELECT COUNT(*) as cnt FROM sessions WHERE is_active = 1")
        row = cur.fetchone()
        conn.close()
        return row["cnt"] if row else 0
