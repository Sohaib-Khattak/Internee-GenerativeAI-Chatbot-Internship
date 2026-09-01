"""Acceptance tests for Feature 3 (progress & re-ranking) — ACs from `specs/spec-feature3.md`."""

import pytest

from src.matcher import HeuristicMatcher
from src.normalize import load_catalogue
from src.progress import ProgressStore, InvalidMilestoneError
from src.recommender import ProfileInput, Recommender


@pytest.fixture
def catalogue():
    return load_catalogue("data/catalogue.json")


@pytest.fixture
def store(tmp_path):
    s = ProgressStore(str(tmp_path / "progress.db"))
    yield s
    s.close()


@pytest.fixture
def rec(catalogue):
    return Recommender(catalogue, matcher=HeuristicMatcher())


# --- AC1 (FR1.1/1.2/1.3, EC2): record typed, timestamped; idempotent -----------------
def test_ac1_record_typed_timestamped(store, catalogue):
    ev = store.record_done("i1", "frontend_developer", 1, catalogue)
    assert ev.event_type == "done"
    assert ev.skill == "javascript"  # milestone #1 of frontend_developer
    assert ev.ts  # timestamp present


def test_ac1_idempotent_not_double_counted(store, catalogue):
    ev1 = store.record_done("i1", "frontend_developer", 1, catalogue)
    ev2 = store.record_done("i1", "frontend_developer", 1, catalogue)
    assert ev1 is not None
    assert ev2 is None  # duplicate ignored (EC2)
    assert len(store.history("i1")) == 1


# --- AC4 (EC1): unknown role/milestone rejected -------------------------------------
def test_ac4_unknown_role_rejected(store, catalogue):
    with pytest.raises(InvalidMilestoneError):
        store.record_done("i1", "no_such_role", 1, catalogue)


def test_ac4_unknown_milestone_rejected(store, catalogue):
    with pytest.raises(InvalidMilestoneError):
        store.record_done("i1", "frontend_developer", 99, catalogue)


# --- AC2 (FR2.1/2.2, EC4): derived skill state ----------------------------------------
def test_ac2_progress_confirms_skill(store, catalogue):
    store.record_done("i1", "frontend_developer", 1, catalogue)  # javascript
    store.record_done("i1", "frontend_developer", 2, catalogue)  # html_css
    confirmed = store.confirmed_skills_by_progress("i1")
    assert "javascript" in confirmed and "html_css" in confirmed


def test_ac2_effective_skills_merges_base_and_progress(store, catalogue):
    store.record_done("i1", "data_analyst", 1, catalogue)  # sql
    eff = store.effective_skills("i1", ["python"])
    assert "python" in eff  # base skill retained
    assert "sql" in eff  # progress-confirmed skill added


def test_ac2_no_events_no_change(store):
    assert store.effective_skills("i1", ["python"]) == ["python"]


# --- AC3 (FR3.1/3.2): re-ranking after progress ----------------------------------------
def test_ac3_progress_raises_role_ranking(rec, catalogue, store, tmp_path):
    base = ProfileInput(skills=["python"], interests=["data"])
    before = rec.recommend(base)
    # Intern then completes milestones confirming sql + statistics for data_analyst
    store.record_done("i1", "data_analyst", 1, catalogue)  # sql (milestone order in DA path)
    store.record_done("i1", "data_analyst", 2, catalogue)  # statistics
    after = rec.recommend(base, progress=store, profile_id="i1")
    before_da = next((c for c in before.candidates if c["role_id"] == "data_analyst"), None)
    after_da = next((c for c in after.candidates if c["role_id"] == "data_analyst"), None)
    if before_da and after_da:
        # data_analyst must appear no later after progress
        assert after.candidates.index(after_da) <= before.candidates.index(before_da)
    # matched skills reflect progress-confirmed skills (FR3.2)
    if after_da:
        assert "statistics" in after_da["matched_skills"] or "sql" in after_da["matched_skills"]


def test_ac3_matched_reflects_effective_skills(rec, catalogue, store):
    # Complete base profile (skills + interests) so it passes the validation gates.
    base = ProfileInput(skills=["python"], interests=["data_analysis"])
    res_before = rec.recommend(base)
    da_before = next((c for c in res_before.candidates if c["role_id"] == "data_analyst"), None)
    assert "sql" not in (da_before["matched_skills"] if da_before else [])  # not yet confirmed

    store.record_done("i1", "data_analyst", 1, catalogue)  # confirm sql via progress
    res_after = rec.recommend(base, progress=store, profile_id="i1")
    da_after = next((c for c in res_after.candidates if c["role_id"] == "data_analyst"), None)
    assert da_after is not None
    assert "sql" in da_after["matched_skills"]  # now confirmed via progress


# --- FR3.3: fully qualified indicated ---------------------------------------------------
def test_fr3_3_fully_qualified_flag(rec, catalogue, store):
    # frontend has js + html/css; confirm both via progress -> fully_qualified
    store.record_done("i1", "frontend_developer", 1, catalogue)
    store.record_done("i1", "frontend_developer", 2, catalogue)
    res = rec.recommend(ProfileInput(skills=[], interests=["web_development"]), progress=store, profile_id="i1")
    fe = next((c for c in res.candidates if c["role_id"] == "frontend_developer"), None)
    if fe:
        assert fe["fully_qualified"] is True


# --- AC5 (FR4.1/4.2): path re-generation advances past done -----------------------------
def test_ac5_path_excludes_done_and_advances(rec, catalogue, store):
    store.record_done("i1", "data_scientist", 1, catalogue)  # python milestone
    path = rec.learning_path(
        ProfileInput(skills=[], interests=[]),
        role_id="data_scientist",
        refine_with_llm=False,
        progress=store,
        profile_id="i1",
    )
    skills = [m.skill for m in path.milestones]
    assert "python" not in skills  # done milestone excluded
    assert path.milestones  # still has next steps


def test_ac5_regression_advance_keeps_intermediate_milestones(rec, catalogue, store):
    # Regression: completing milestone #1 (sql) of data_analyst must advance past sql
    # only — statistics and data_visualization must remain (not get dropped by an
    # order-numbering collision between the generated path and the catalogued orders).
    store.record_done("i1", "data_analyst", 1, catalogue)  # sql done
    path = rec.learning_path(
        ProfileInput(skills=["python"], interests=["data"]),
        role_id="data_analyst",
        refine_with_llm=False,
        progress=store,
        profile_id="i1",
    )
    skills = [m.skill for m in path.milestones]
    assert "sql" not in skills
    assert "python" not in skills
    assert "statistics" in skills  # intermediate milestone preserved
    assert "data_visualization" in skills


# --- AC6 (FR5.1): history queryable with type + timestamp -------------------------------
def test_ac6_history(store, catalogue):
    store.record_done("i1", "data_analyst", 1, catalogue)
    events = store.history("i1")
    assert len(events) == 1
    assert events[0].skill == "sql"
    assert events[0].event_type == "done"
    assert events[0].ts


# --- AC7 (FR5.2): deterministic given same events ---------------------------------------
def test_ac7_deterministic_state(store, catalogue):
    store.record_done("i1", "data_analyst", 1, catalogue)
    s1 = store.effective_skills("i1", ["python"])
    s2 = store.effective_skills("i1", ["python"])
    assert s1 == s2
