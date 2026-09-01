"""Persistent intern profile store (FR3, AC10, AC11).

Behavior-only responsibilities from `specs/spec.md`:
- FR3.1  A profile is persisted and retrievable by a stable profile identifier.
- FR3.2  The profile records when it was created and last updated.
- FR3.3  The stored profile changes only on an explicit save action; recommendations
         are always computed from the current submitted input, not the stored copy.
- FR3.4  The intern can delete their profile; once confirmed, it is removed and
         unrecoverable.
- FR3.5  Profiles unused for a stated period of inactivity are subject to auto-expiry
         (deleted per the stated policy).

Backed by sqlite3 (Python standard library — no new dependency, matches the research's
physical-store guidance and scales to the relational model later).
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

# Auto-expiry (FR3.5): a profile is "inactive" if not saved in this long.
INACTIVITY_WINDOW = timedelta(days=180)
# On the rare manual prune, now - last_saved > INACTIVITY_WINDOW -> deleted.
_SCHEMA = """
CREATE TABLE IF NOT EXISTS profiles (
    profile_id   TEXT PRIMARY KEY,
    skills       TEXT NOT NULL,
    interests    TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    last_saved   TEXT NOT NULL
);
"""


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


@dataclass
class StoredProfile:
    profile_id: str
    skills: List[str]
    interests: List[str]
    created_at: str
    last_saved: str


class ProfileStore:
    """SQLite-backed profile persistence with explicit-save semantics."""

    def __init__(self, db_path: str = "data/profiles.db"):
        self.db_path = db_path
        self._conn = sqlite3.connect(db_path)
        self._conn.executescript(_SCHEMA)

    # -- FR3.1/FR3.2 read -----------------------------------------------------
    def get(self, profile_id: str) -> Optional[StoredProfile]:
        row = self._conn.execute(
            "SELECT profile_id, skills, interests, created_at, last_saved "
            "FROM profiles WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        if row is None:
            return None
        return StoredProfile(
            profile_id=row[0],
            skills=json.loads(row[1]),
            interests=json.loads(row[2]),
            created_at=row[3],
            last_saved=row[4],
        )

    # -- FR3.3 save (explicit) / FR3.4 delete / FR3.5 expiry --------------------
    def save(self, profile_id: str, skills: List[str], interests: List[str]) -> StoredProfile:
        """FR3.3 explicit save: persists/replaces the stored profile only when called
        deliberately. Never invoked implicitly by a recommendation."""
        now = _utcnow_iso()
        existing = self.get(profile_id)
        created_at = existing.created_at if existing else now
        self._conn.execute(
            "INSERT INTO profiles (profile_id, skills, interests, created_at, last_saved) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(profile_id) DO UPDATE SET "
            "skills=excluded.skills, interests=excluded.interests, last_saved=excluded.last_saved",
            (profile_id, json.dumps(skills), json.dumps(interests), created_at, now),
        )
        self._conn.commit()
        return StoredProfile(
            profile_id=profile_id, skills=list(skills), interests=list(interests),
            created_at=created_at, last_saved=now,
        )

    def delete(self, profile_id: str) -> bool:
        """FR3.4 delete a profile; once removed it is unrecoverable."""
        cur = self._conn.execute("DELETE FROM profiles WHERE profile_id = ?", (profile_id,))
        self._conn.commit()
        return cur.rowcount > 0

    def expiry_cutoff_iso(self, now: Optional[str] = None) -> str:
        """The ``last_saved`` threshold at or before which a profile is considered
        inactive (FR3.5). Exposed to tests; callers use it to prune."""
        base = _parse_iso(now) if now else datetime.now(timezone.utc)
        return (base - INACTIVITY_WINDOW).isoformat()

    def prune_expired(self, now: Optional[str] = None) -> int:
        """FR3.5 delete profiles whose last_saved is at/before the inactivity cutoff.
        Returns the number deleted. Deterministic for a given ``now`` (used in tests)."""
        cutoff = self.expiry_cutoff_iso(now)
        cur = self._conn.execute("DELETE FROM profiles WHERE last_saved <= ?", (cutoff,))
        self._conn.commit()
        return cur.rowcount

    def list_ids(self) -> List[str]:
        rows = self._conn.execute("SELECT profile_id FROM profiles").fetchall()
        return [r[0] for r in rows]

    def close(self):
        self._conn.close()
