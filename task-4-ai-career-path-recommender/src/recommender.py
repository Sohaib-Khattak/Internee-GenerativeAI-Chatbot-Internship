"""Recommendation orchestration (FR2, FR5; AC1-AC3, AC5, AC8, AC12).

Behavior-only responsibilities from `specs/spec.md`:
- AC1/EC1  Empty profile -> no recommendation; prompt to build the profile.
- AC2/EC2  One-sided profile -> low-confidence; no recommendation until both
           dimensions are present.
- AC3/EC3  Conflicting inputs -> flag the conflict and ask resolution.
- AC5/FR2  Complete valid profile -> ranked shortlist (up to 5), ordered by fit label.
- AC8/FR2.6/EC9  Output phrased as alternatives with a "starting point, not destiny"
           note; no single role presented as the only path.
- AC12/FR5  On failure, a clear error and preserved input; never a partial result as
           a full one.

Determinism (FR4/AC9) is delegated to the Matcher, which is deterministic for a fixed
catalogue version; the recommender records the catalogue version on the response.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from .matcher import Matcher, HeuristicMatcher
from .normalize import Catalogue, NormalizedField

DISCLAIMER = (
    "These are suggestions to explore, not a guaranteed career outcome. "
    "Use them as a starting point, not a verdict on what you must become."
)


@dataclass
class ProfileInput:
    """Raw intern input (two separate fields, FR1.1)."""
    skills: List[str] = field(default_factory=list)
    interests: List[str] = field(default_factory=list)


@dataclass
class NormalizedProfile:
    skills: NormalizedField
    interests: NormalizedField

    @property
    def is_empty(self) -> bool:
        return not self.skills.verified and not self.skills.unverified and not self.interests.verified and not self.interests.unverified

    @property
    def all_unrecognized(self) -> bool:
        """EC5: non-empty input, but nothing normalized to verified (or unverified only)."""
        return (not self.skills.verified and not self.interests.verified) and (
            self.skills.unverified or self.interests.unverified
        )


@dataclass
class RecommendationResult:
    """A successful recommendation response (FR2)."""
    candidates: List[dict]  # ordered shortlist
    catalogue_version: str
    disclaimer: str
    unverified_terms: List[str]  # EC4: surfaced, not counted
    completeness: str  # "complete" | "no_match" | "low_confidence" | "empty" | "conflict" | "unrecognized"
    conflict_asked: Optional[str] = None  # EC3 prompt text, when completeness == "conflict"
    message: str = ""  # user-facing guidance for non-full states


NO_MATCH_MESSAGE = (
    "We couldn't find job roles matching your profile. Try adding more skills or "
    "interests, or reword what you entered, and try again."
)


class RecommendationError(Exception):
    """An internal failure surfaced to the intern (AC12/FR5): a clear, non-partial
    error rather than a degraded result presented as a full recommendation."""


class Recommender:
    def __init__(self, catalogue: Catalogue, matcher: Optional[Matcher] = None):
        self.catalogue = catalogue
        self.matcher = matcher or HeuristicMatcher()
        self._path_gen = None

    # -- Feature 2: learning paths -------------------------------------------
    @property
    def _learning_path_gen(self):
        if self._path_gen is None:
            from .learning_path import LearningPathGenerator

            self._path_gen = LearningPathGenerator(self.catalogue)
        return self._path_gen

    def learning_path(
        self,
        profile: ProfileInput,
        role_id: str,
        refine_with_llm: bool = True,
        progress: Optional["ProgressStore"] = None,
        profile_id: Optional[str] = None,
    ):
        """Feature 2 + Feature 3 (FR4): build the learning path for a role.

        With ``progress``/``profile_id``, milestones already recorded as done are
        excluded and the path starts at the intern's next incomplete milestone.
        """
        from .learning_path import UnknownRoleError

        norm = self.normalize(profile)
        confirmed = norm.skills.verified
        if progress is not None and profile_id is not None:
            # Progress confirms skills (FR2.1); effective_skills merges them into the
            # confirmed set. The generator already excludes confirmed skills' milestones
            # (FR4.1), so no separate done-order filter is needed here.
            confirmed = progress.effective_skills(profile_id, confirmed)
        try:
            return self._learning_path_gen.generate(
                role_id, confirmed_skills=confirmed, refine_with_llm=refine_with_llm
            )
        except UnknownRoleError as exc:
            raise UnknownRoleError(str(exc))

    # -- normalization -------------------------------------------------------
    def normalize(self, profile: ProfileInput) -> NormalizedProfile:
        from .normalize import normalize_interests, normalize_skills

        return NormalizedProfile(
            skills=normalize_skills(profile.skills, self.catalogue),
            interests=normalize_interests(profile.interests, self.catalogue),
        )

    # -- validation gates (AC1, AC2, AC3, EC.skip) ---------------------------
    def _gate(self, norm: NormalizedProfile) -> Optional[RecommendationResult]:
        if norm.is_empty:
            return RecommendationResult(
                candidates=[], catalogue_version=self.catalogue.version,
                disclaimer=DISCLAIMER, unverified_terms=[],
                completeness="empty",
            )
        if norm.all_unrecognized:
            return RecommendationResult(
                candidates=[], catalogue_version=self.catalogue.version,
                disclaimer=DISCLAIMER, unverified_terms=norm.skills.unverified + norm.interests.unverified,
                completeness="unrecognized",
            )
        # AC2/EC2: require both dimensions present
        if not norm.skills.verified or not norm.interests.verified:
            missing = "interests" if not norm.interests.verified else "skills"
            return RecommendationResult(
                candidates=[], catalogue_version=self.catalogue.version,
                disclaimer=DISCLAIMER, unverified_terms=norm.skills.unverified + norm.interests.unverified,
                completeness="low_confidence",
                conflict_asked=f"Tell us a little about your {missing} so we can give a balanced recommendation.",
            )
        # AC3/EC3: contradicting skills vs interests
        conflict = _detect_conflict(norm)
        if conflict:
            return RecommendationResult(
                candidates=[], catalogue_version=self.catalogue.version,
                disclaimer=DISCLAIMER, unverified_terms=norm.skills.unverified + norm.interests.unverified,
                completeness="conflict",
                conflict_asked=conflict,
            )
        return None

    # -- main entry -----------------------------------------------------------
    def recommend(
        self,
        profile: ProfileInput,
        progress: Optional["ProgressStore"] = None,
        profile_id: Optional[str] = None,
    ) -> RecommendationResult:
        """Return a RecommendationResult. Raises RecommendationError only on internal
        failure (AC12) — validation rejections are returned, not raised.

        With ``progress``/``profile_id`` (Feature 3), matching uses the *effective*
        confirmed set = base profile skills + skills confirmed via progress (FR2.2),
        so roles whose gaps have closed rank higher (FR3.1).
        """
        try:
            norm = self.normalize(profile)
        except Exception:
            raise RecommendationError("Couldn't generate a recommendation right now.")

        gated = self._gate(norm)
        if gated is not None:
            return gated

        confirmed_skills = norm.skills.verified
        confirmed_interests = norm.interests.verified
        if progress is not None and profile_id is not None:
            confirmed_skills = progress.effective_skills(profile_id, confirmed_skills)

        try:
            shortlist = self.matcher.shortlist(confirmed_skills, confirmed_interests, self.catalogue, max_roles=5)
        except Exception as exc:
            # AC12/FR5: never present a partial result as a full one.
            raise RecommendationError("Couldn't generate a recommendation right now.") from exc

        candidates = []
        for r in shortlist:
            # FR3.3: a role the intern is already fully qualified for is indicated, not
            # silently dropped (no missing skills => fully qualified).
            candidates.append(
                {
                    "role_id": r.role_id,
                    "title": r.title,
                    "fit_label": r.fit_label,
                    "matched_skills": r.matched_skills,
                    "missing_skills": r.missing_skills,
                    "interest_only": r.interest_only,
                    "fully_qualified": not r.missing_skills,
                }
            )
        # AC8/FR2.6: ensure at least the openness framing is present and, when a single
        # role is all we have, it is still a suggestion (never the only path claim).
        # If no role cleared the relevance floor, give the intern honest guidance
        # (judgment call #2: a distinct "no matches" state rather than a bare empty list).
        if not candidates:
            return RecommendationResult(
                candidates=[],
                catalogue_version=self.catalogue.version,
                disclaimer=DISCLAIMER,
                unverified_terms=norm.skills.unverified + norm.interests.unverified,
                completeness="no_match",
                message=NO_MATCH_MESSAGE,
            )
        return RecommendationResult(
            candidates=candidates,
            catalogue_version=self.catalogue.version,
            disclaimer=DISCLAIMER,
            unverified_terms=norm.skills.unverified + norm.interests.unverified,
            completeness="complete",
        )


def _detect_conflict(norm: NormalizedProfile) -> Optional[str]:
    """A lightweight, deterministic consistency check (AC3/EC3).

    Flags a small set of demonstrable contradictions between the intern's stated skills
    and interests. Returns a resolution prompt, or None if no conflict is found.
    """
    sk = set(norm.skills.verified)
    it = set(norm.interests.verified)
    # Explicit, curated contradictions (AC3/EC3). Management-type interest (leadership or
    # project management) paired with deep technical/data skills is a demonstrable,
    # common intern ambiguity, so we ask which track they want before recommending.
    management = it & {"leadership", "project_management"}
    deep_technical = sk & {"machine_learning", "statistics", "cloud", "networking"}
    if management and deep_technical:
        return (
            "You listed both an interest in leadership/management and deep technical/"
            "data skills. Would you like an engineer track or a people/management "
            "track? Choose one so we recommend in the right direction."
        )
    return None
