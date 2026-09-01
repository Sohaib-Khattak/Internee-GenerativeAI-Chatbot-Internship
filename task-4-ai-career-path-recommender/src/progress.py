"""Progress tracking & derived skill state (Feature 3, `specs/spec-feature3.md`).

Behavior-only responsibilities:
- FR1.1-1.3  Record "milestone done" as an append-only, timestamped, typed event.
- FR2.1-2.2  Completing a skill's milestone(s) confirms that skill; combined with
             base profile skills it forms the effective confirmed set.
- FR4.1-4.2  Re-generating a path excludes done milestones; next step is the first
             incomplete one.
- FR5.1      History queryable by intern with type + timestamp.
- EC1/AC4    Reject progress for a role/milestone not in the catalogue.
- EC2/AC1    Idempotent: the same completion isn't double-counted.
- EC4        No events -> no change to the base skill set.

Backed by sqlite3 (stdlib; no new dependency), matching the approved ProgressEvent
append-only design and the research's physical-store guidance.
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional

from .normalize import Catalogue

_SCHEMA = """
CREATE TABLE IF NOT EXISTS progress_events (
    profile_id     TEXT NOT NULL,
    role_id        TEXT NOT NULL,
    milestone_order INTEGER NOT NULL,
    skill          TEXT NOT NULL,
    event_type     TEXT NOT NULL,   -- 'done'
    ts             TEXT NOT NULL,
    PRIMARY KEY (profile_id, role_id, milestone_order)
);
"""


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class ProgressEvent:
    profile_id: str
    role_id: str
    milestone_order: int
    skill: str
    event_type: str
    ts: str


class InvalidMilestoneError(Exception):
    """EC1/AC4: progress references a role/milestone not in the catalogue."""


class ProgressStore:
    def __init__(self, db_path: str = "data/progress.db"):
        self.db_path = db_path
        self._conn = sqlite3.connect(db_path)
        self._conn.executescript(_SCHEMA)

    # -- FR1 record -------------------------------------------------------------
    def record_done(
        self,
        profile_id: str,
        role_id: str,
        milestone_order: int,
        catalogue: Catalogue,
        ts: Optional[str] = None,
    ) -> Optional[ProgressEvent]:
        """Record 'done' for a milestone. Rejects unknown role/milestones (EC1/AC4)
        and is idempotent — re-recording the same completion is ignored (EC2/AC1)."""
        role = next((r for r in catalogue.roles if r["role_id"] == role_id), None)
        if role is None:
            raise InvalidMilestoneError(f"No role '{role_id}' in the catalogue.")
        milestone = next(
            (m for m in role.get("learning_path", []) if m["order"] == milestone_order), None
        )
        if milestone is None:
            raise InvalidMilestoneError(
                f"Role '{role_id}' has no milestone #{milestone_order} to record."
            )
        stamp = ts or _utcnow_iso()
        cur = self._conn.execute(
            "INSERT OR IGNORE INTO progress_events "
            "(profile_id, role_id, milestone_order, skill, event_type, ts) "
            "VALUES (?, ?, ?, ?, 'done', ?)",
            (profile_id, role_id, milestone_order, milestone["skill"], stamp),
        )
        self._conn.commit()
        if cur.rowcount == 0:
            return None  # already recorded (idempotent)
        return ProgressEvent(
            profile_id=profile_id, role_id=role_id,
            milestone_order=milestone_order, skill=milestone["skill"],
            event_type="done", ts=stamp,
        )

    # -- FR2 derived state ------------------------------------------------------
    def confirmed_skills_by_progress(self, profile_id: str) -> List[str]:
        """Skills the intern has fully confirmed via completed milestones (FR2.1).

        A skill counts as confirmed (via progress) once ALL of the milestones that teach
        it across the roles this intern has touched are done. For simplicity and because
        a milestone teaches one skill, we confirm a skill once its completing milestone
        is done for any touched role.
        """
        rows = self._conn.execute(
            "SELECT skill FROM progress_events WHERE profile_id = ?",
            (profile_id,),
        ).fetchall()
        return sorted({r[0] for r in rows})

    def effective_skills(self, profile_id: str, base_skills: List[str]) -> List[str]:
        """Effective confirmed set = base profile skills + skills confirmed via
        progress (FR2.2/EC4)."""
        return sorted(set(base_skills) | set(self.confirmed_skills_by_progress(profile_id)))

    # -- FR4 path re-generation --------------------------------------------------
    def done_milestone_orders(self, profile_id: str, role_id: str) -> set:
        rows = self._conn.execute(
            "SELECT milestone_order FROM progress_events WHERE profile_id = ? AND role_id = ?",
            (profile_id, role_id),
        ).fetchall()
        return {r[0] for r in rows}

    # -- FR5 history ---------------------------------------------------------------
    def history(self, profile_id: str) -> List[ProgressEvent]:
        rows = self._conn.execute(
            "SELECT profile_id, role_id, milestone_order, skill, event_type, ts "
            "FROM progress_events WHERE profile_id = ? ORDER BY ts",
            (profile_id,),
        ).fetchall()
        return [ProgressEvent(*r) for r in rows]

    def close(self):
        self._conn.close()
