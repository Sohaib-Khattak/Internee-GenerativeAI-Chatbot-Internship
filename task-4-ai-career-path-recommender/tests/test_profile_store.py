"""Acceptance tests for the profile store (AC10, AC11 from `specs/spec.md`)."""

import datetime

import pytest

from src.profile_store import INACTIVITY_WINDOW, ProfileStore


@pytest.fixture
def store(tmp_path):
    s = ProfileStore(str(tmp_path / "test.db"))
    yield s
    s.close()


# --- AC10 (FR3.1/FR3.2/FR3.3): persist, timestamps, explicit-save-only -------------
def test_ac10_persist_and_retrieve_by_id(store):
    saved = store.save("intern-1", ["python"], ["data"])
    got = store.get("intern-1")
    assert got is not None
    assert got.profile_id == "intern-1"
    assert got.skills == ["python"]
    assert got.interests == ["data"]


def test_ac10_timestamps(store):
    saved = store.save("intern-1", ["python"], ["data"])
    assert saved.created_at  # non-empty
    assert saved.last_saved  # non-empty
    assert saved.created_at <= saved.last_saved  # ISO strings compare lexicographically here


def test_ac10_explicit_save_preserves_created(store):
    first = store.save("intern-1", ["python"], ["data"])
    second = store.save("intern-1", ["python", "sql"], ["data"])
    # Re-saving overwrites skills (FR3.3 explicit save) but preserves created_at (FR3.2)
    assert second.skills == ["python", "sql"]
    assert second.created_at == first.created_at
    got = store.get("intern-1")
    assert got.created_at == first.created_at


# --- AC11 (FR3.4/FR3.5): delete + auto-expiry --------------------------------------
def test_ac11_delete_removes_irrecoverably(store):
    store.save("intern-1", ["python"], ["data"])
    assert store.delete("intern-1") is True
    assert store.get("intern-1") is None  # unrecoverable


def test_ac11_delete_missing_returns_false(store):
    assert store.delete("does-not-exist") is False


def test_ac11_auto_expiry(store):
    store.save("active", ["python"], ["data"])
    store.save("stale", ["javascript"], ["web"])

    # Freeze "now" and age the stale profile past the inactivity window.
    now = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc).isoformat()
    cutoff = store.expiry_cutoff_iso(now)
    aged = (datetime.datetime.fromisoformat(cutoff) - datetime.timedelta(days=1)).isoformat()
    store._conn.execute("UPDATE profiles SET last_saved=? WHERE profile_id=?", (aged, "stale"))
    store._conn.commit()

    deleted = store.prune_expired(now=now)
    assert deleted == 1
    assert store.get("stale") is None
    assert store.get("active") is not None  # recently saved survives


def test_ac11_inactivity_window_is_stated():
    # The expiry policy is a stated, concrete window (FR3.5).
    assert INACTIVITY_WINDOW.days > 0
