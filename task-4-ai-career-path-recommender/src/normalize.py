"""Free-text normalization for skills and interests (FR1.3, FR1.4, EC4, EC5).

Behavior-only responsibilities from `specs/spec.md`:
- FR1.3  Resolve typos/aliases ("py" -> "Python") within the field's own category.
- FR1.4  A term confirmed against the vocabulary is "verified"; otherwise "unverified".
- EC4    Unverified terms never count toward matches or the relevance floor; they are
         surfaced alongside rather than blocking the whole result.
- EC5    If input is non-empty but nothing normalizes, that is the distinct
         "unrecognized terms" state (not the blank-input onboarding path).

This module is deterministic and testable, independent of any LLM (per research
cross-cutting rule #1).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional

# Matches a quoted phrase ("python programming") or a single word term.
_TOKEN_RE = re.compile(r'"[^"]+"|\S+')


@dataclass(frozen=True)
class Catalogue:
    """An immutable view of the static skill/interests/role catalogue.

    ``aliases`` maps every lowercase-alias (and canonical id/name) to its canonical
    skill id or interest id. ``names`` is a synonym list used to build embeddings.
    """

    version: str
    skill_names: Dict[str, str]  # skill_id -> display name
    interest_names: Dict[str, str]  # interest_id -> display name
    skill_aliases: Dict[str, str]  # alias/lower -> skill_id
    interest_aliases: Dict[str, str]  # alias/lower -> interest_id
    roles: List[dict]

    def build_skill_embedding_text(self, skill_id: str) -> str:
        """A canonical text blob for a skill, used to embed the catalogue offline."""
        # Canonical name only; aliases are covered by normalizing to the id first.
        return self.skill_names[skill_id]

    def build_interest_embedding_text(self, interest_id: str) -> str:
        return self.interest_names[interest_id]

    def build_role_embedding_text(self, role: dict) -> str:
        parts = [role["title"], role["description"]]
        for req in role.get("required_skills", []):
            parts.append(self.skill_names.get(req["skill"], req["skill"]))
        for iid in role.get("related_interests", []):
            parts.append(self.interest_names.get(iid, iid))
        return " ".join(parts)


def load_catalogue(path: str = "data/catalogue.json") -> Catalogue:
    """Load and index the static catalogue JSON into a Catalogue."""
    import json

    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    skill_names: Dict[str, str] = {}
    skill_aliases: Dict[str, str] = {}
    for sid, info in data["skills"].items():
        skill_names[sid] = info["name"]
        _index_aliases(skill_aliases, sid, sid.lower(), info["name"], *info.get("aliases", []))

    interest_names: Dict[str, str] = {}
    interest_aliases: Dict[str, str] = {}
    for iid, info in data["interests"].items():
        interest_names[iid] = info["name"]
        _index_aliases(interest_aliases, iid, iid.lower(), info["name"], *info.get("aliases", []))

    return Catalogue(
        version=data["catalogue_version"],
        skill_names=skill_names,
        interest_names=interest_names,
        skill_aliases=skill_aliases,
        interest_aliases=interest_aliases,
        roles=data["roles"],
    )


def _index_aliases(index: Dict[str, str], canonical: str, *words: Optional[str]):
    for w in words:
        if w:
            index[w.strip().lower()] = canonical


def _normalize_term(term: str) -> str:
    """Lowercase and collapse whitespace for matching against the alias index."""
    return re.sub(r"\s+", " ", term.strip()).lower()


@dataclass
class NormalizedField:
    """The normalized result of one input field (skills or interests).

    ``verified`` are canonical ids that cleared confirmation (FR1.4).
    ``unverified`` are the original terms that could NOT be matched (EC4) and so never
    count toward matches or the relevance floor.
    """

    verified: List[str] = field(default_factory=list)
    unverified: List[str] = field(default_factory=list)


def _normalize_field(raw_terms: Iterable[str], aliases: Dict[str, str]) -> NormalizedField:
    result = NormalizedField()
    seen: set = set()
    for term in raw_terms:
        key = _normalize_term(term)
        if not key:
            continue
        canon = aliases.get(key)
        if canon is not None and canon not in seen:
            seen.add(canon)
            result.verified.append(canon)
        elif canon is None:
            result.unverified.append(term)
    return result


def normalize_skills(raw_skills: Iterable[str], catalogue: Catalogue) -> NormalizedField:
    """Normalize a skills field: resolve aliases, tag unverified terms (FR1.3, FR1.4)."""
    return _normalize_field(raw_skills, catalogue.skill_aliases)


def normalize_interests(raw_interests: Iterable[str], catalogue: Catalogue) -> NormalizedField:
    """Normalize an interests field: resolve aliases, tag unverified terms (FR1.3, FR1.4)."""
    return _normalize_field(raw_interests, catalogue.interest_aliases)


def tokenize_free_text(text: str) -> List[str]:
    """Split free text into candidate terms (quoted phrases or single words)."""
    return [m.replace('"', "").strip() for m in _TOKEN_RE.findall(text) if m.strip()]
