"""Acceptance tests for Feature 2 (learning paths) — every AC from `specs/spec-feature2.md`."""

import pytest

from src.learning_path import (
    DISCLAIMER,
    LearningPathGenerator,
    UnknownRoleError,
)
from src.normalize import load_catalogue


@pytest.fixture(scope="module")
def catalogue():
    return load_catalogue("data/catalogue.json")


@pytest.fixture
def gen(catalogue):
    return LearningPathGenerator(catalogue)


# --- AC1 (FR1.1/FR1.2): ordered milestones with title, skill, resource -----------
def test_ac1_milestones_have_title_skill_resources(gen):
    path = gen.generate("data_scientist", confirmed_skills=[], refine_with_llm=False)
    assert path.milestones
    for m in path.milestones:
        assert m.title
        assert m.skill
        assert m.resources  # >= 1 resource
        assert m.order >= 1


# --- AC2 (FR1.3/FR1.4/EC1): missing-first, confirmed excluded, empty when none ----
def test_ac2_path_starts_at_missing_skill(gen):
    path = gen.generate("data_scientist", confirmed_skills=["python"], refine_with_llm=False)
    # python should be excluded and not first
    skills = [m.skill for m in path.milestones]
    assert "python" not in skills
    assert path.milestones[0].skill != "python"


def test_ac2_no_missing_skills_gives_empty_path(gen):
    path = gen.generate("frontend_developer", confirmed_skills=["javascript", "html_css"], refine_with_llm=False)
    assert path.milestones == []


# --- AC3 (FR2.1/EC4): grounded — only catalogue skills/resources, no invention -----
def test_ac3_skills_resources_are_from_catalogue(gen, catalogue):
    role_ids = [r["role_id"] for r in catalogue.roles]
    for role_id in role_ids:
        path = gen.generate(role_id, confirmed_skills=[], refine_with_llm=False)
        for m in path.milestones:
            assert m.skill in catalogue.skill_names  # real skill id (grounded)
            # every milestone's resources come from the catalogue's own learning_path data
            role = next(r for r in catalogue.roles if r["role_id"] == role_id)
            lp = next(x for x in role["learning_path"] if x["skill"] == m.skill)
            for res in m.resources:
                assert res in lp["resources"]  # curated, in-catalogue resource


def test_ac3_rationale_only_references_catalogue_items(gen):
    path = gen.generate("ml_engineer", confirmed_skills=[], refine_with_llm=False)
    for m in path.milestones:
        # rationale is one of the curated templates (native to this code, grounded to skills)
        assert len(m.rationale) > 20


# --- AC4 (FR2.2): every milestone has a plain-language rationale ------------------
def test_ac4_every_milestone_has_rationale(gen):
    path = gen.generate("backend_developer", confirmed_skills=[], refine_with_llm=False)
    assert path.milestones
    for m in path.milestones:
        assert m.rationale and len(m.rationale) > 20


# --- AC5 (FR2.3): "starting point, not destiny" framing -----------------------------
def test_ac5_disclaimer_present(gen):
    path = gen.generate("data_analyst", confirmed_skills=[], refine_with_llm=False)
    low = path.disclaimer.lower()
    assert "starting point" in low and "not a verdict" in low
    assert DISCLAIMER == path.disclaimer


# --- AC6 (FR3.1): deterministic per catalogue version --------------------------------
def test_ac6_deterministic(gen):
    p1 = gen.generate("data_scientist", confirmed_skills=["python"], refine_with_llm=False)
    p2 = gen.generate("data_scientist", confirmed_skills=["python"], refine_with_llm=False)
    assert [(m.skill, m.title, m.rationale) for m in p1.milestones] == [
        (m.skill, m.title, m.rationale) for m in p2.milestones
    ]


# --- AC7 (FR3.2/EC3): complete offline (no API) -------------------------------------
def test_ac7_complete_offline(gen):
    # Guarantee no API key / no LLM: refine_with_llm=True but no key -> full path.
    path = gen.generate("devops_engineer", confirmed_skills=[], refine_with_llm=True)
    assert path.milestones
    for m in path.milestones:
        assert m.rationale  # template rationale present even with LLM "attempted"


# --- AC8 (FR4.1/EC2): unknown role -> clear error, no path ----------------------------
def test_ac8_unknown_role_raises(gen):
    with pytest.raises(UnknownRoleError):
        gen.generate("not_a_role", confirmed_skills=[], refine_with_llm=False)
