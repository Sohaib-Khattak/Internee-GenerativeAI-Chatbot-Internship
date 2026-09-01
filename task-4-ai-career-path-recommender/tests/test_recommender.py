"""Acceptance tests for the recommendation core — every AC from `specs/spec.md`.

Each test maps to at least one AC and would fail if a build ignored that requirement.
"""

import pytest

from src.matcher import HeuristicMatcher
from src.normalize import load_catalogue, normalize_interests, normalize_skills
from src.profile_store import ProfileStore
from src.recommender import ProfileInput, RecommendationError, Recommender

DISCLAIMER_MARKERS = ["starting point", "not destiny", "suggestion"]


# --- AC1 (EC1): empty profile ------------------------------------------------
def test_ac1_empty_profile_no_recommendation(recommender):
    res = recommender.recommend(ProfileInput(skills=[], interests=[]))
    assert res.completeness == "empty"
    assert res.candidates == []


def test_ac1_whitespace_is_empty(recommender):
    res = recommender.recommend(ProfileInput(skills=["   "], interests=[" "]))
    assert res.completeness == "empty"


# --- AC2 (EC2): one-sided profile ---------------------------------------------
def test_ac2_skills_only_blocked(recommender):
    res = recommender.recommend(ProfileInput(skills=["python"], interests=[]))
    assert res.completeness == "low_confidence"
    assert res.candidates == []
    assert res.conflict_asked  # targeted follow-up for the missing dimension


def test_ac2_interests_only_blocked(recommender):
    res = recommender.recommend(ProfileInput(skills=[], interests=["data"]))
    assert res.completeness == "low_confidence"
    assert res.candidates == []


# --- AC3 (EC3): conflicting inputs --------------------------------------------
def test_ac3_conflict_flagged(recommender):
    res = recommender.recommend(
        ProfileInput(skills=["python", "machine_learning"], interests=["leadership"])
    )
    assert res.completeness == "conflict"
    assert res.candidates == []
    assert "Choose one" in res.conflict_asked


# --- AC4 (FR1.3/FR1.4, EC4): alias + unverified tagging -------------------------
def test_ac4_alias_resolves(catalogue):
    skills = normalize_skills(["py"], catalogue)
    assert skills.verified == ["python"]  # FR1.3 "py" -> Python


def test_ac4_unknown_term_surfaced_not_counted(recommender):
    # "xyzzy" is unverifiable; must be surfaced and not counted (EC4)
    res = recommender.recommend(
        ProfileInput(skills=["python", "xyzzy"], interests=["data"])
    )
    assert "xyzzy" in res.unverified_terms
    # match set must not include the unverified term
    for c in res.candidates:
        assert "xyzzy" not in c["matched_skills"]


# --- AC5 (FR2.1/FR2.3, EC7): ranked shortlist up to 5 --------------------------
def test_ac5_returns_ranked_shortlist(recommender):
    res = recommender.recommend(
        ProfileInput(skills=["python", "machine_learning"], interests=["artificial_intelligence"])
    )
    assert res.completeness == "complete"
    assert 1 <= len(res.candidates) <= 5
    labels = [c["fit_label"] for c in res.candidates]
    order = {"Strong": 0, "Moderate": 1, "Possible": 2}
    ranks = [order[l] for l in labels]
    assert ranks == sorted(ranks)  # ordered by fit label


def test_ac5_max_five_roles(recommender):
    # A broad profile must not exceed 5 distinct roles
    res = recommender.recommend(
        ProfileInput(
            skills=["python", "javascript", "sql", "statistics", "machine_learning", "linux", "cloud"],
            interests=["data", "web_development", "artificial_intelligence", "infrastructure"],
        )
    )
    assert len(res.candidates) <= 5
    ids = [c["role_id"] for c in res.candidates]
    assert len(set(ids)) == len(ids)  # distinct roles (FR2.1)


# --- AC6 (FR2.2/FR2.4): floor + matched/missing ---------------------------------
def test_ac6_floor_requires_skill_or_interest_match(recommender, catalogue):
    # A complete profile whose skills/interests match nothing must yield no roles.
    # "project_management" is a valid skill but no role requires it; "leadership" is a
    # valid interest but no role lists it -> 0 eligible roles (judgment call #2).
    res = recommender.recommend(
        ProfileInput(skills=["project_management"], interests=["leadership"])
    )
    assert res.completeness == "no_match"
    assert res.candidates == []  # neither a confirmed skill nor interest matches any role
    assert res.message  # honest "no matches" guidance, not a bare empty list


def test_ac6_matched_are_confirmed_only(recommender):
    res = recommender.recommend(
        ProfileInput(skills=["sql", "statistics", "xyzzy"], interests=["data"])
    )
    for c in res.candidates:
        assert all(s not in ("xyzzy",) for s in c["matched_skills"])  # unverified never matched


def test_ac6_lists_matched_and_missing(recommender):
    res = recommender.recommend(ProfileInput(skills=["sql"], interests=["data"]))
    data_analyst = next((c for c in res.candidates if c["role_id"] == "data_analyst"), None)
    assert data_analyst is not None
    assert "sql" in data_analyst["matched_skills"]
    assert set(data_analyst["missing_skills"])  # has some missing skills


# --- AC7 (FR2.5): interest-only flagged and ranked below skill-backed -------------
def test_ac7_interest_only_flagged_and_ranked_below(recommender):
    # skills back "data_scientist"; interests alone back "mobile_developer"
    res = recommender.recommend(
        ProfileInput(skills=["sql", "statistics", "python"], interests=["mobile_apps", "data"])
    )
    by_id = {c["role_id"]: c for c in res.candidates}
    # mobile surfaces via interest only -> flagged
    if "mobile_developer" in by_id:
        assert by_id["mobile_developer"]["interest_only"] is True
    # any skill-backed candidate must come before any interest-only candidate
    saw_interest_only = False
    for c in res.candidates:
        if c["interest_only"]:
            saw_interest_only = True
        else:
            assert not saw_interest_only  # no skill-backed after an interest-only


# --- AC14 (EC11): complete profile, no eligible roles -----------------------------
def test_ac14_no_match_state_with_guidance(recommender):
    # Valid, complete profile but no role clears the relevance floor -> "no matches".
    res = recommender.recommend(
        ProfileInput(skills=["project_management"], interests=["leadership"])
    )
    assert res.completeness == "no_match"
    assert res.candidates == []
    assert "couldn't find job roles" in res.message.lower()  # honest guidance


# --- AC8 (FR2.6/EC9): alternatives, never a verdict ------------------------------
def test_ac8_disclaimer_present(recommender):
    res = recommender.recommend(
        ProfileInput(skills=["sql", "statistics"], interests=["data"])
    )
    low = res.disclaimer.lower()
    assert any(m in low for m in DISCLAIMER_MARKERS)


def test_ac8_shortlist_not_single_verdict(recommender):
    # Even a profile strongly matched to one role must return the disclaimer and be a
    # suggestion; completeness=complete implies a shortlist, not a single "destiny".
    res = recommender.recommend(
        ProfileInput(skills=["sql", "statistics", "data_visualization", "python"], interests=["data"])
    )
    assert res.completeness == "complete"
    assert 1 <= len(res.candidates) <= 5
    assert "suggestion" in res.disclaimer.lower()


# --- AC9 (FR4): determinism per catalogue version --------------------------------
def test_ac9_deterministic(recommender):
    profile = ProfileInput(skills=["python", "sql"], interests=["data"])
    r1 = recommender.recommend(profile)
    r2 = recommender.recommend(profile)
    assert [c["role_id"] for c in r1.candidates] == [c["role_id"] for c in r2.candidates]
    assert r1.catalogue_version == r2.catalogue_version


def test_ac9_records_catalogue_version(recommender):
    res = recommender.recommend(ProfileInput(skills=["python"], interests=["data"]))
    assert res.catalogue_version  # non-empty version is recorded (FR4.2)


# --- EC5: distinct unrecognized-terms state --------------------------------------
def test_ec5_all_unrecognized_state(recommender):
    res = recommender.recommend(ProfileInput(skills=["xyzzy"], interests=["foobar"]))
    assert res.completeness == "unrecognized"
    assert res.candidates == []
    assert "xyzzy" in res.unverified_terms and "foobar" in res.unverified_terms


# --- AC12 (FR5): failure never shows a partial result as full ----------------------
def test_ac12_recommendation_failure_is_error_not_partial():
    """A matcher that raises mid-computation must surface an error, not a partial
    shortlist (FR5.1/FR5.2)."""
    from src.normalize import load_catalogue

    class ExplodingMatcher(HeuristicMatcher):
        def score(self, *args, **kwargs):  # pragma: no cover - deliberately broken
            raise RuntimeError("boom")

    cat = load_catalogue("data/catalogue.json")
    r = Recommender(cat, matcher=ExplodingMatcher())
    with pytest.raises(RecommendationError):
        r.recommend(ProfileInput(skills=["python"], interests=["data"]))


# --- AC13 (EC5/EC6/EC10): free text, privacy, English-only -------------------------
def test_ac13_verbose_and_sparse_input_ok(recommender):
    # Very long free text (single-term tokens) must not crash and must not exceed 5 roles
    long_text = ["python", "sql", "statistics", "data_visualization"] * 50
    res = recommender.recommend(ProfileInput(skills=long_text, interests=["data"]))
    assert res.completeness == "complete"
    assert len(res.candidates) <= 5


def test_ac13_english_only_output(recommender):
    res = recommender.recommend(ProfileInput(skills=["python"], interests=["data"]))
    for c in res.candidates:
        assert c["title"].isascii()
        assert c["fit_label"] in ("Strong", "Moderate", "Possible")
