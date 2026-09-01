"""Learning-path generation (Feature 2, `specs/spec-feature2.md`).

Behavior-only responsibilities:
- FR1.1/1.2  An ordered list of milestones (title, skill, resources) for a single role.
- FR1.3/1.4  Order by the intern's *missing* skills first; exclude confirmed skills.
- FR2.1/EC4  Grounded: milestones and resources come only from the catalogue — never
             invented. Rationale references only catalogue items.
- FR2.2      Every milestone has a plain-language rationale.
- FR2.3/AC5  Carries the "starting point, not destiny" framing.
- FR3.1/AC6  Deterministic for a fixed catalogue version.
- FR3.2/EC3  Complete offline via a deterministic template fallback; an AI refinement
             (when a key is present) only rewrites rationale wording, never structure.
- FR4.1/EC2  Unknown role -> clear error, no path.

No new dependencies: template rationale is built here; AI refinement is optional.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List, Optional

from .normalize import Catalogue

DISCLAIMER = (
    "This learning path is a suggestion to explore — a starting point, not a verdict "
    "on the only way to get there."
)

# Per-skill rationale templates, grounded to catalogue skills (EC4).
_RATIONALE = {
    "python": "Python is a core, widely used language that powers most data, backend, and ML work.",
    "javascript": "JavaScript is essential for web and app interfaces and a backbone of modern software.",
    "html_css": "HTML and CSS are the foundations for building any user-facing web page.",
    "sql": "SQL is the standard for querying and working with relational data.",
    "statistics": "Statistics and probability are the reasoning tools behind data analysis and modeling.",
    "machine_learning": "Machine learning skills are the core of modeling and prediction work.",
    "data_visualization": "Turning numbers into clear visuals is how insight reaches an audience.",
    "cloud": "Cloud and deployment skills let you ship and run software at scale.",
    "linux": "Linux and the shell are the everyday environment for backend and operations work.",
    "networking": "Networking fundamentals explain how systems talk to each other.",
    "mobile": "Mobile development skills let you build applications for phones and tablets.",
    "project_management": "Project-management skills help plan, run, and deliver work with a team.",
}


@dataclass
class Milestone:
    order: int
    skill: str
    title: str
    resources: List[str] = field(default_factory=list)
    rationale: str = ""
    status: str = "todo"  # Feature 3 will drive this; always "todo" in Feature 2.

    def render_for_prompt(self) -> str:
        resources = ", ".join(self.resources) if self.resources else "(no resources)"
        return f"{self.order}. {self.title} (skill: {self.skill}; resources: {resources})"


@dataclass
class LearningPath:
    role_id: str
    role_title: str
    milestones: List[Milestone] = field(default_factory=list)
    disclaimer: str = DISCLAIMER


class UnknownRoleError(Exception):
    """EC2/FR4.1: requested role is not in the catalogue."""


class LearningPathGenerator:
    def __init__(self, catalogue: Catalogue):
        self.catalogue = catalogue

    def _rationale(self, skill: str) -> str:
        return _RATIONALE.get(
            skill, f"{skill.replace('_', ' ').title()} is a relevant skill for this role."
        )

    def generate(
        self,
        role_id: str,
        confirmed_skills: List[str],
        refine_with_llm: bool = True,
    ) -> LearningPath:
        role = next((r for r in self.catalogue.roles if r["role_id"] == role_id), None)
        if role is None:
            raise UnknownRoleError(f"No role with id '{role_id}' in the catalogue.")

        required_ids = [req["skill"] for req in role.get("required_skills", [])]
        confirmed = set(confirmed_skills)
        missing = [sid for sid in required_ids if sid not in confirmed]

        path_data = role.get("learning_path", [])
        # FR1.4/EC1: keep only milestones whose skill is missing (not already confirmed).
        # Preserve the catalogue's curated ordering (foundational first).
        ordered = [m for m in path_data if m["skill"] in set(missing)]
        ordered.sort(key=lambda m: m.get("order", 0))

        milestones = [
            Milestone(
                order=i,
                skill=m["skill"],
                title=m["title"],
                resources=list(m.get("resources", [])),
                rationale=self._rationale(m["skill"]),
            )
            for i, m in enumerate(ordered, start=1)
        ]

        # AI refinement (FR3.2/EC3): optional; never required, never structural.
        if refine_with_llm and milestones:
            refiner = _try_llm_refiner()
            if refiner is not None:
                prompts = [m.render_for_prompt() for m in milestones]
                refined = refiner(prompts)
                if len(refined) == len(milestones):
                    for m, text in zip(milestones, refined):
                        if text:
                            m.rationale = text

        return LearningPath(role_id=role_id, role_title=role["title"], milestones=milestones)


# -- optional AI refinement via Gemini (offline-safe) -----------------------------

def _try_llm_refiner():
    """Return a callable that rewrites milestone rationales, or None if unavailable.

    The Gemini client is only constructed if a GEMINI_API_KEY is present (loaded by
    ``src.config``); any failure is trapped so it never blocks or degrades the
    deterministic path (EC3).
    """
    from .config import gemini_available

    if not gemini_available():
        return None
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

        def refiner(prompts: List[str]) -> List[str]:
            return _llm_rewrite(client, types, prompts)

        return refiner
    except Exception:
        return None


def _llm_rewrite(client, types, prompts: List[str]) -> List[str]:
    """Best-effort: rewrite each rationale with Gemini. On any error, return an empty
    list so the caller keeps the template rationale (never a partial/None structure)."""
    try:
        import json

        system = (
            "You help write one-sentence rationales for learning milestones. "
            "Return ONLY JSON of the form {\"rationales\": [\"...\", ...]} with exactly "
            "one rationale per input milestone. Only reference skills that appear in "
            "the input. No invented courses."
        )
        user = "Milestones:\n" + "\n".join(prompts)
        resp = client.models.generate_content(
            model="gemini-3.6-flash",
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.2,
                response_mime_type="application/json",
            ),
            contents=user,
        )
        text = resp.text or "{}"
        # tolerate fenced JSON
        if "```" in text:
            text = text.split("```")[1].strip("json").strip()
        data = json.loads(text)
        return [str(x) for x in data.get("rationales", [])]
    except Exception:
        return []
