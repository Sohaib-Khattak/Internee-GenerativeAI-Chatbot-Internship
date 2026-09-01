"""Role matching: eligibility, fit labels, and ranking (FR2, AC5/AC6/AC7/AC9).

Behavior-only responsibilities from `specs/spec.md`:
- FR2.2  Relevance floor: a role is eligible iff it has >=1 confirmed matching skill
         OR >=1 explicitly matched interest.
- FR2.3  Each role carries a plain-language fit label (Strong/Moderate/Possible) used
         for ordering.
- FR2.4  Each role lists matched skills (confirmed) and missing skills (not confirmed).
- FR2.5  A role surfaced from interests alone is flagged and ranked below skill-backed.
- FR4    Determinism: the same profile + catalogue version yields the same ranking.

The structural logic (eligibility, coverage, fit labels) is deterministic and needs no
network. Embeddings refine the semantic ordering. Two implementations of the same
``Matcher`` interface let the embedding backend be swapped (research: TF-ready
interface) and provide an offline fallback (FR5.1):
  - ``HeuristicMatcher`` : structural coverage only, no network. Default/offline.
  - ``GeminiEmbeddingMatcher`` : adds Gemini `text-embedding-004` semantic scores,
    with catalogue embeddings cached per catalogue version (determinism, AC9).
"""

from __future__ import annotations

import json
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import numpy as np

from .normalize import Catalogue

# Fit-label thresholds on confirmed-skill coverage of required-skill weight.
_LABEL_STRONG = 0.66
_LABEL_MODERATE = 0.33


@dataclass
class RoleScore:
    role_id: str
    title: str
    score: float  # 0..1 relevance, used for ordering
    matched_skills: List[str] = field(default_factory=list)
    missing_skills: List[str] = field(default_factory=list)
    fit_label: str = "Possible"
    interest_only: bool = False


def _coverage(matched_ids: List[str], required: List[dict]) -> float:
    """Fraction of the role's required-skill weight covered by matched skills."""
    matched_set = set(matched_ids)
    total = sum(r["weight"] for r in required)
    if total <= 0:
        return 0.0
    covered = sum(r["weight"] for r in required if r["skill"] in matched_set)
    return covered / total


def _fit_label(coverage: float) -> str:
    if coverage >= _LABEL_STRONG:
        return "Strong"
    if coverage >= _LABEL_MODERATE:
        return "Moderate"
    return "Possible"


class Matcher(ABC):
    """Computes a scored, ranked shortlist of roles for a normalized profile.

    Implementations must keep ``score`` deterministic for a fixed catalogue version so
    that repeated calls produce the same ranking (FR4, AC9).
    """

    @abstractmethod
    def score(
        self,
        confirmed_skills: List[str],
        confirmed_interests: List[str],
        catalogue: Catalogue,
    ) -> List[RoleScore]:
        """Return every eligible role scored, not yet trimmed to a shortlist."""

    def shortlist(
        self,
        confirmed_skills: List[str],
        confirmed_interests: List[str],
        catalogue: Catalogue,
        max_roles: int = 5,
    ) -> List[RoleScore]:
        """Rank all eligible roles and return up to ``max_roles`` (FR2.1, FR2.3, FR2.5)."""
        scored = self.score(confirmed_skills, confirmed_interests, catalogue)
        return _order_shortlist(scored)[:max_roles]


def _order_shortlist(scored: List[RoleScore]) -> List[RoleScore]:
    """Deterministic ranking: skill-backed first (by score), interest-only after."""
    rank = {"Strong": 0, "Moderate": 1, "Possible": 2}
    skill_backed = [r for r in scored if not r.interest_only]
    interest_only = [r for r in scored if r.interest_only]
    skill_backed.sort(key=lambda r: (rank[r.fit_label], -r.score, r.role_id))
    interest_only.sort(key=lambda r: (rank[r.fit_label], -r.score, r.role_id))
    return skill_backed + interest_only


class HeuristicMatcher(Matcher):
    """Deterministic, offline structural matcher (coverage only, no embeddings)."""

    def score(self, confirmed_skills, confirmed_interests, catalogue) -> List[RoleScore]:
        skill_set = set(confirmed_skills)
        interest_set = set(confirmed_interests)
        results: List[RoleScore] = []
        for role in catalogue.roles:
            required = role.get("required_skills", [])
            matched = [r["skill"] for r in required if r["skill"] in skill_set]
            missing = [r["skill"] for r in required if r["skill"] not in skill_set]
            interests_matched = [i for i in role.get("related_interests", []) if i in interest_set]
            # FR2.2 relevance floor
            if not matched and not interests_matched:
                continue
            coverage = _coverage(matched, required)
            results.append(
                RoleScore(
                    role_id=role["role_id"],
                    title=role["title"],
                    score=coverage + 0.01 * len(interests_matched),  # structural tiebreak
                    matched_skills=matched,
                    missing_skills=missing,
                    fit_label=_fit_label(coverage),
                    interest_only=not matched,  # FR2.5
                )
            )
        return results


class GeminiEmbeddingMatcher(Matcher):
    """Blends Gemini semantic similarity with the deterministic structural coverage.

    Catalogue embeddings are cached per catalogue version on disk so that matching is
    deterministic for a fixed version (FR4, AC9) and repeated calls are cheap. If the
    Gemini API is unavailable (or no key is set), it delegates to
    :class:`HeuristicMatcher` (FR5.1 graceful fallback) — never a partial result.
    """

    EMBEDDING_MODEL = "gemini-embedding-001"
    _SEMANTIC_WEIGHT = 0.4  # blend: semantic vs structural

    def __init__(
        self,
        cache_path: str = "data/catalogue_embeddings.json",
        fallback: Optional[Matcher] = None,
        api_key: Optional[str] = None,
    ):
        self.cache_path = cache_path
        self.fallback = fallback or HeuristicMatcher()
        self._client = None
        self._api_key = api_key
        self._cache: Dict[str, dict] = _load_cache(cache_path)

    # -- embedding backend ---------------------------------------------------
    def _get_client(self):
        if self._client is None:
            try:
                from .config import GEMINI_API_KEY

                from google import genai

                key = self._api_key or GEMINI_API_KEY
                if not key:
                    self._client = False
                else:
                    self._client = genai.Client(api_key=key)
            except Exception:
                self._client = False  # unavailable
        return self._client if self._client else None

    def _embed(self, texts: List[str], key: str) -> Optional[List[List[float]]]:
        cached = self._cache.get(key)
        if cached and len(cached) == len(texts):
            return cached
        client = self._get_client()
        if client is None or not texts:
            return None
        try:
            vectors = []
            for t in texts:
                result = client.models.embed_content(
                    model=self.EMBEDDING_MODEL,
                    contents=t,
                )
                # `result.embeddings` is a list of ContentEmbedding; take the first.
                emb = result.embeddings[0]
                vectors.append(list(emb.values))
            self._cache[key] = vectors
            _save_cache(self.cache_path, self._cache)
            return vectors
        except Exception:
            return None

    # -- Matcher interface ----------------------------------------------------
    def score(self, confirmed_skills, confirmed_interests, catalogue) -> List[RoleScore]:
        base = self.fallback.score(confirmed_skills, confirmed_interests, catalogue)
        if not base:
            return base
        semantic = self._semantic_scores(confirmed_skills, confirmed_interests, catalogue)
        if semantic is None:
            return base  # graceful offline fallback (FR5.1)
        for rs in base:
            rs.score = (1 - self._SEMANTIC_WEIGHT) * rs.score + self._SEMANTIC_WEIGHT * semantic.get(rs.role_id, 0.0)
        return base

    def _semantic_scores(self, confirmed_skills, confirmed_interests, catalogue) -> Optional[Dict[str, float]]:
        """Embed profile + roles and return per-role cosine similarity (0..1)."""
        profile_blob = " ".join(
            [catalogue.skill_names[s] for s in confirmed_skills]
            + [catalogue.interest_names[i] for i in confirmed_interests]
        )
        role_texts = [(r["role_id"], catalogue.build_role_embedding_text(r)) for r in catalogue.roles]
        embed_key = f"v{catalogue.version}"
        role_vectors = self._embed([t for _, t in role_texts], embed_key)
        if role_vectors is None:
            return None
        profile_vec = self._embed([profile_blob], f"v{catalogue.version}.profile.{embed_key}") if confirmed_skills or confirmed_interests else None
        if role_vectors is None:
            return None
        roles_arr = np.array(role_vectors, dtype=np.float32)
        if profile_vec is None:
            # No profile text to compare; fall back to 0 baseline.
            return {rid: 0.0 for rid, _ in role_texts}
        prof = np.array(profile_vec[0], dtype=np.float32)
        sims = _cosine(roles_arr, prof)
        return {rid: float(max(0.0, min(1.0, s))) for rid, s in zip([rid for rid, _ in role_texts], sims)}


def _cosine(vectors: np.ndarray, query: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1)
    qnorm = np.linalg.norm(query)
    if qnorm == 0:
        return np.zeros(len(vectors))
    denom = norms * qnorm
    denom[denom == 0] = 1.0
    return (vectors @ query) / denom


def _load_cache(path: str) -> Dict[str, dict]:
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def _save_cache(path: str, cache: Dict[str, dict]):
    try:
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(cache, fh)
    except OSError:
        pass
