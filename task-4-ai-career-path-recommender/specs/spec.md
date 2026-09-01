# Spec — Career Path Recommender: Core Recommendation (Feature 1)

**Step:** SPECIFY (per `Spec As A Refrence.md`), informed by `specs/research.md` and
the `Constitution.md`. Behaviour only — no tech choices. Each requirement is written
so that a build ignoring it would visibly fail. Clarified through the CLARIFY step
(15 decisions folded in; see "Clarifications" at the end).

---

## Goal

When an intern enters their **skills** and **interests**, the tool returns a **ranked
shortlist of plausible job roles** (flexibly 3–5), each labelled with a plain-language
fit (Strong / Moderate / Possible), the confirmed skills they already have, and the
skills they'd need to learn. The recommendation reads as **suggestions, never a
verdict**: the intern always sees alternatives and an explicit note that this is a
starting point, not a destiny.

## User scenarios

- **S1 — Returning a recommendation.** A new intern enters skills and interests and
  submits. They see a ranked shortlist of roles, each showing a fit label and which of
  their confirmed skills matched and which are missing.
- **S2 — Incomplete profile.** An intern enters skills but no interests (or vice
  versa). The tool does not guess — it marks the profile low-confidence and asks a
  single targeted follow-up for the missing dimension. It produces **no**
  recommendation until both dimensions are present; once the intern supplies the
  missing side, the profile is complete and a recommendation is generated.
- **S3 — Empty submission.** An intern submits with nothing filled in. The tool does
  not invent a career for them — it blocks and prompts them to build the profile
  (guided onboarding), preserving any partial draft.
- **S4 — Re-submission.** An intern re-runs with an unchanged profile against an
  unchanged catalogue and gets the same ranked result (determinism).
- **S5 — Unrecognized terms.** An intern enters only terms the tool can't match. The
  tool explains none were recognized and offers to add them as custom entries or
  retry — distinct from the blank-input onboarding in S3.

## Functional requirements

### FR1 — Profile input
- FR1.1 The intern provides skills and interests in **two separate structured fields**
  (a skills field and an interests field).
- FR1.2 Within each field, the intern can both **choose from suggested tags** and
  **type free text**.
- FR1.3 Free text is normalized against a known vocabulary (typos and aliases,
  e.g. "py" → "Python") in the field's own category.
- FR1.4 A term that can be **confirmed** against the vocabulary is treated as verified;
  a term that cannot be confirmed is treated as **unverified**.

### FR2 — Recommendation output
- FR2.1 Given a complete, valid profile, the tool returns a **ranked shortlist of
  distinct job roles**: up to 5, and no fewer than those that clear the relevance
  floor (never padded with implausible roles).
- FR2.2 **Relevance floor:** a role is eligible for the shortlist iff it has **at
  least one confirmed matching skill OR at least one explicitly matched interest**.
- FR2.3 Each role carries a **plain-language fit label** — Strong, Moderate, or
  Possible — used for ordering (most to least relevant).
- FR2.4 For each role, the output lists **matched skills** (confirmed skills the intern
  has) and **missing skills** (skills needed but not confirmed).
- FR2.5 A role may be surfaced from **interests alone** (no matching confirmed skills),
  but is then **flagged** ("matched by interest; no matching skills yet") and ranked
  below roles backed by confirmed skills.
- FR2.6 The output is phrased as **alternatives with stated assumptions** and includes
  an explicit note that this is a suggestion and a starting point, not a guaranteed
  outcome.
- FR2.7 A role's fit explanation is limited to its **fit label + matched skills +
  missing skills**; no free-form prose rationale or resource links in this feature.

### FR3 — Profile storage
- FR3.1 An intern's profile (skills, interests, and normalization results) is
  **persisted** and retrievable by a stable profile identifier.
- FR3.2 The profile records when it was created and last updated.
- FR3.3 The stored profile changes **only on an explicit save action**; a recommendation
  is always computed from the intern's **current submitted input**, not the stored copy.
- FR3.4 The intern can **delete their profile**; once confirmed, the profile (and stored
  skills/interests) is removed and unrecoverable.
- FR3.5 Profiles unused for a stated period of inactivity are **subject to auto-expiry**
  (deleted per the stated policy).

### FR4 — Determinism
- FR4.1 The same valid profile produces the same ranked recommendation **for a given
  catalogue version**; the result is reproducible for that version.
- FR4.2 The recommendation records **which catalogue version** it was produced from,
  so results change only when the underlying version changes (and that change is
  attributable).

### FR5 — System failure
- FR5.1 If a recommendation cannot be produced (backend unavailable, timeout, or any
  error), the tool shows a clear message ("couldn't generate a recommendation right
  now") and **preserves the submitted input** so a retry reuses it.
- FR5.2 The tool never presents a **partial or degraded result as a full
  recommendation**.

## Edge cases & rules

- **EC1 — Empty submission.** No skills and no interests (or all whitespace) is treated
  as "profile incomplete": no recommendation; prompt the intern to build the profile.
- **EC2 — Missing dimension.** Skills present but no interests, or interests present
  but no skills: the profile is **low-confidence** and a single targeted question is
  asked for the missing dimension. **No recommendation is generated while a dimension
  is missing**; the missing side is never assumed neutral. Once both dimensions are
  present, the profile is complete and a recommendation may be generated.
- **EC3 — Conflicting inputs.** If entered skills/interests contradict each other, flag
  the conflict and ask the intern to resolve it; only a resolved profile is recommended
  on.
- **EC4 — Unverified terms (soft/provisional).** A recommendation is generated from the
  **confirmed** terms; unverified terms are **surfaced alongside** ("not counted —
  confirm to include") rather than blocking the whole result. Unverified terms never
  count toward matched skills or the relevance floor.
- **EC5 — All terms unrecognized.** If input is non-empty but nothing normalizes, route
  to the distinct **unrecognized-terms** state (S5) — explain no match was found and
  offer to add custom entries or retry — not to the blank-input onboarding (S3).
- **EC6 — Extreme input length.** Very short or very long free text is bounded and
  handled gracefully (via normalization and summarization), never crashed on.
- **EC7 — Product breadth.** The shortlist is capped at 5; eligible roles that clear
  the floor are included, but an implausibly broad catch-all is never returned as a
  single "safe" recommendation.
- **EC8 — Privacy.** Skills, interests, and the returned recommendation are private to
  the intern; nothing requires storing or echoing sensitive personal details.
- **EC9 — No verdicts.** Under no circumstance does the tool present a single role as
  the only or guaranteed path (see FR2.6); the shortlist + fit labels + disclaimer are
  mandatory.
- **EC10 — Language.** The vocabulary, role titles, fit labels, and explanations are in
  **English only** for this feature (aliasing covers common variants of popular terms).
- **EC11 — No eligible roles (complete profile, no match).** If a complete, valid
  profile yields **no role that clears the relevance floor**, the tool returns a
  **"no matches" state** with honest guidance ("we couldn't find roles matching your
  profile — try adding more skills/interests"), never an invented role or a bare empty
  list presented as success.

## Out-of-scope

- **Learning-path generation** (ordered milestones, resource links, prose rationale) —
  a later feature built on this one.
- **Progress tracking over time** and progress-aware/gap-based re-ranking — a later
  feature.
- **Collaborative filtering** ("interns like you…") — deferred until real user data exists.
- **Experience level and goals** as ranking inputs — deferred to the later features.
- **Multi-language support** — English only for this feature.
- **Account/auth, multi-tenant isolation, and deployment** — not part of this feature.
- **Externally-verifiable career outcomes** or guarantees of employment.

## Acceptance criteria

Each maps to at least one requirement; a build that fails any of these is not done.

- **AC1 (EC1, FR1.1):** Submitting an empty profile produces no recommendation and a
  prompt to complete the profile. *(visible: empty → fake career)*
- **AC2 (EC2, FR1.1):** A one-sided profile (skills only, or interests only) is marked
  low-confidence and prompts for the missing dimension, and produces **no**
  recommendation until both dimensions are present. *(visible: one-sided → blocked,
  no fabricated result)*
- **AC3 (EC3):** Conflicting inputs raise a flag and a resolution question instead of a
  recommendation. *(visible: conflict → resolution prompt)*
- **AC4 (FR1.3, FR1.4, EC4):** A typo/alias ("py") resolves correctly and counts as a
  confirmed match when it clears confirmation; a truly unknown term is surfaced as
  unverified and **does not** count toward matches or the floor. *(visible: "py" → Python
  match; "xyzzy" → unverified, not counted)*
- **AC5 (FR2.1, FR2.3, EC7):** A complete valid profile returns a ranked shortlist of
  eligible roles (up to 5), ordered by fit label, with eligible roles included and no
  single catch-all.
- **AC6 (FR2.2, FR2.4):** A role appears only if it has ≥1 confirmed skill match or an
  explicit interest match; each shown role lists confirmed matched and missing skills.
- **AC7 (FR2.5):** A role matched only by interest is labelled ("matched by interest; no
  matching skills yet") and ranked below skill-backed roles.
- **AC8 (FR2.6, EC9):** Output is phrased as alternatives with a "starting point, not a
  destiny" note; no single role is presented as the only path.
- **AC9 (FR4.1, FR4.2):** Running twice on the same valid profile and catalogue version
  yields the same ranking, and the result records its catalogue version.
- **AC10 (FR3.1, FR3.2, FR3.3):** A persisted profile is retrievable by id with
  created/updated timestamps; the stored profile changes only on explicit save; a
  recommendation reflects current submitted input.
- **AC11 (FR3.4, FR3.5):** The delete action removes the profile irrecoverably; the
  auto-expiry policy is stated and applied.
- **AC12 (FR5.1, FR5.2):** On a failure/timeout, the tool shows a clear error, preserves
  the input for retry, and never shows a degraded result as a full one.
- **AC13 (FR1.2, EC5, EC6, EC10):** Varied-length free text works without error;
  all-unrecognized input routes to the distinct state; output is English-only; no
  sensitive personal details stored.
- **AC14 (EC11):** A complete, valid profile with no role clearing the relevance floor
  returns the "no matches" state with honest guidance, and never an invented role or a
  bare empty list presented as success.

## Clarifications (CLARIFY step, one question at a time)

1. **Input structure:** separate structured fields for skills vs. interests, each
   accepting tags + free text (EC2 trigger is natural).
2. **Shortlist count:** flexible, up to 5, no padding with implausible roles.
3. **Confidence display:** plain-language fit label (Strong/Moderate/Possible) primary;
   underlying score available for transparency.
4. **Retention:** persist until delete + explicit delete action + stated auto-expiry
   for long inactivity.
5. **Determinism:** versioned (reproducible per catalogue version; result records its
   version).
6. **Profile data scope:** skills + interests only for Feature 1 (experience/goals later).
7. **Unknown-term strictness:** soft/provisional (recommend on confirmed terms, flag the
   rest).
8. **All-unrecognized:** distinct unrecognized-terms state (not blank-input onboarding).
9. **Matched = confirmed; ordering is relevance-driven** (gap-based re-ranking deferred).
10. **Interest-only roles:** allowed with a transparency flag, ranked below skill-backed.
11. **Profile mutation:** recommendation from current input; stored profile changes only
    on explicit save.
12. **Language:** English only for this feature.
13. **System failure:** honest error with saved state; never a degraded result as full.
14. **Relevance floor:** a role is eligible iff ≥1 confirmed skill match OR ≥1 explicit
    interest match.
15. **Output scope:** missing skills name-only (no resources); explanation is fit label +
    matched/missing skills only (richer rationale deferred).

## Definition of done (from `Constitution.md`)

- Behaviour matches this spec, edge cases included (all ACs pass).
- A human has reviewed the spec and the resulting work before merge.
