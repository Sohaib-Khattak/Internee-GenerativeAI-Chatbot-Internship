# Spec — Feature 2: Learning-Path Generation

**Step:** SPECIFY (per `Spec As A Refrence.md`), informed by `specs/research.md` and
`Constitution.md`. Builds on Feature 1 (`specs/spec.md`). Behaviour only — no tech
choices. Clarifications were made autonomously per the build directive and are
recorded at the end.

---

## Goal

For a role an intern is matched to, the tool returns an **ordered learning path** —
the sequence of milestones that close the gap between the intern's confirmed skills
and the role's requirements, each with **suggested resources** and a plain-language
**rationale** for why each step matters. The path is grounded in the catalogue (never
invents courses or skills), starts from what the intern already has, and reads as a
guidance plan.

## User scenarios

- **S1 — Path for a recommended role.** After an intern gets a ranked shortlist, they
  pick a role and request its learning path. The tool returns an ordered list of
  milestones covering the role's **missing skills**, each with resources and a
  rationale.
- **S2 — Path skips what's already known.** If the intern already has some of the
  role's required skills, those are **not** re-taught; the path starts at the first
  missing skill.
- **S3 — Offline by default.** The tool produces the full path with **no external
  dependency** (no API key required); an AI enhancement only refines wording when
  available. The intern always gets a complete, useful path.
- **S4 — Re-request stability.** The same intern + role + catalogue version yields the
  same path and rationale (determinism).

## Functional requirements

### FR1 — Path structure
- FR1.1 A learning path is an **ordered list of milestones** for a single role.
- FR1.2 Each milestone has a **title**, the **skill it teaches**, and a list of
  **suggested resources**.
- FR1.3 Milestones are ordered so the intern's **missing skills** appear first (the
  gap to close), in a prerequisite-sensible order.
- FR1.4 Milestones the intern has already confirmed are **excluded** (not re-taught).

### FR2 — Grounding & honesty
- FR2.1 Every milestone's skill and resources come **only from the catalogue**; the
  tool never invents a course, skill, or step (no hallucination).
- FR2.2 Each milestone has a **plain-language rationale** explaining why it matters for
  the role.
- FR2.3 The path reads as a **suggestion, not a guarantee**, and carries the same
  "starting point, not destiny" framing as Feature 1.

### FR3 — Generation & determinism
- FR3.1 The tool generates the full path **deterministically** from the catalogue for
  a fixed catalogue version (same intern + role + version → same path).
- FR3.2 If an AI/Augmentation service is available it may refine the rationale wording,
  but the **structure, milestones, and ordering never depend on it** — the path is
  complete without it.

### FR4 — Failure
- FR4.1 If a requested role is not in the catalogue, the tool returns a clear
  error/unknown-role notice (never an empty or invented path passed off as valid).

## Edge cases & rules

- **EC1 — No missing skills.** If the intern already has all of a role's required
  skills, the path is empty and the tool says so ("you already cover the core skills
  for this role") rather than manufacturing busywork.
- **EC2 — Unknown role.** A role_id not in the catalogue → clear error, no path.
- **EC3 — No API availability.** Path generation succeeds fully offline; the AI
  refinement is optional and never blocks or degrades the result.
- **EC4 — Rationale grounded.** Rationale only references catalogue skills/milestones/
  resources; a generated rationale mentioning an out-of-catalogue item is a defect.

## Out-of-scope

- **Progress tracking / completion status** of milestones — Feature 3.
- **Progress-aware re-ordering** of the path — Feature 3.
- **External live course-catalog search** (real links to third-party courses) — the
  resources are curated catalogue entries, not a live search.
- **Personalization by experience level / goals** — deferred.

## Acceptance criteria

- **AC1 (FR1.1, FR1.2):** Requesting a path for a known role returns an ordered list of
  milestones, each with a title, a skill, and ≥1 resource.
- **AC2 (FR1.3, FR1.4, EC1):** The path starts at the first **missing** skill; confirmed
  skills are excluded; if none are missing the path is empty with a notification.
- **AC3 (FR2.1, EC4):** Every milestone's skill and every resource exists in the
  catalogue; rationale references only catalogue items.
- **AC4 (FR2.2):** Every milestone has a non-empty plain-language rationale.
- **AC5 (FR2.3):** The path carries the "starting point, not destiny" framing.
- **AC6 (FR3.1):** Same intern + role + catalogue version → identical path and rationale.
- **AC7 (FR3.2, EC3):** With no AI/API available, the full path is still generated and
  complete (deterministic fallback).
- **AC8 (FR4.1, EC2):** An unknown role_id yields a clear error and no path.

## Clarifications (autonomous, per build directive)

1. **Source of truth:** the learning path is generated from the catalogue's grounded
   `learning_path` data (added in v1.1.0), not authored by the generator.
2. **Ordering:** missing skills first, in prerequisite-sensible (weight-ordered) order.
3. **AI role:** optional prose refinement only; deterministic template fallback always
   produces a complete path (honors EC3 and the research's "LLM formats, deterministic
   does the work").
4. **Resources:** curated catalogue entries, not a live external search.

## Definition of done (from `Constitution.md`)

- Behaviour matches this spec, edge cases included (all ACs pass).
- A human has reviewed the diff against the spec before merge.
