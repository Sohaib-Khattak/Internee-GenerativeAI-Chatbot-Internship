# Spec — Feature 3: Progress Tracking & Progress-Aware Re-Ranking

**Step:** SPECIFY (per `Spec As A Refrence.md`), informed by `specs/research.md`,
`Constitution.md`, Features 1–2. Behaviour only — no tech choices. Clarifications
made autonomously per the build directive and recorded at the end.

---

## Goal

The tool records an intern's **progress over time** as they complete milestones on a
learning path, uses that to **confirm/lift skills**, and **feeds the updated skill
state back into recommendations and paths**: roles whose gaps are closing move up,
and a learning path always starts at the intern's actual next step. Progress is an
append-only history (has timestamp + type), and the intern's current state is derived
from it.

## User scenarios

- **S1 — Marking progress.** An intern on a role's learning path marks a milestone
  "done." The tool records the event, and the milestone shows as completed.
- **S2 — Re-ranking after progress.** After the intern confirms new skills, re-running
  the recommendation ranks roles with closing gaps higher, and a role's matched/missing
  skills reflect the new state.
- **S3 — Path advances.** After completing a milestone, the learning path is re-generated
  so it starts at the **next incomplete** milestone (no re-teaching what's done).
- **S4 — History.** The intern's progress events are stored as a timestamped history, so
  an "as of" view and recency are possible.

## Functional requirements

### FR1 — Record progress
- FR1.1 The intern can mark a milestone (on a specific role's learning path) as **done**.
- FR1.2 Each progress event is **recorded with a timestamp** and its **type** (done).
- FR1.3 Progress is **append-only**: events are added, never silently overwritten or
  deleted, so a history exists.

### FR2 — Derived skill state
- FR2.1 Completing all milestones that teach a skill **confirms that skill** for the
  intern (it becomes part of their confirmed skills).
- FR2.2 Confirmed skills from progress are combined with the intern's base profile
  skills to form the **current effective skill set** used for matching.

### FR3 — Progress-aware re-ranking
- FR3.1 A role whose **gaps are closing** (more of its required skills now confirmed)
  ranks **higher** on re-run than before, all else equal.
- FR3.2 Matched/missing skills reported per role reflect the **updated** effective skill
  set (skills confirmed via progress appear as matched).
- FR3.3 Roles the intern is already fully qualified for are indicated, not silently
  dropped as "no match".

### FR4 — Path re-generation
- FR4.1 Re-generating a learning path excludes milestones already marked done.
- FR4.2 The first milestone of a re-generated path is the intern's **next (first
  incomplete) step**.

### FR5 — History & determinism
- FR5.1 The progress history is queryable by intern and shows event **type + timestamp**
  (an "as of" view).
- FR5.2 Progress is keyed to an intern profile id and a role's milestones; deterministic
  re-running given the same events yields the same state.

## Edge cases & rules

- **EC1 — No matching role for a milestone.** Recording progress for a role those
  skills/milestones advance; a milestone must map to a real role + skill in the catalogue
  or it is rejected.
- **EC2 — Idempotent completion.** Marking the same milestone done twice stores one
  logical completion (duplicates are not double-counted).
- **EC3 — Reverting.** Marking "done" is additive; there is **no** silent rollback — a
  later event is an explicit new event if anything changes.
- **EC4 — Empty history.** An intern with no progress events has an effective skill set
  equal to their base profile skills (no change).
- **EC5 — Privacy.** Progress history is private to the intern and stored with their
  profile; it holds no sensitive personal data.

## Out-of-scope

- **Gamification / streaks / rewards** — not included.
- **Multi-intern collaboration/sharing** — not included.
- **Re-ordering by time-decay of old skills** beyond simple recency messaging — included
  only as far as the research's "recent events are stronger evidence" is satisfied by
  append-only history + derived state.
- **Auto-suggesting which milestone to do next** outside the learning-path view — the
  path re-generation (FR4) is the mechanism.

## Acceptance criteria

- **AC1 (FR1.1, FR1.2, FR1.3):** Marking a milestone done appends a timestamped,
  typed event; recording the same completion again does not double-count (EC2).
- **AC2 (FR2.1, FR2.2, EC4):** Confirming the milestones for a skill adds that skill to
  the intern's effective confirmed set; an intern with no events keeps their base skills.
- **AC3 (FR3.1, FR3.2):** After confirming more required skills for a role, re-running
  ranks that role no lower, and its matched/missing skills reflect the new state.
- **AC4 (EC1):** Recording progress for a role/milestone not in the catalogue is
  rejected with a clear error.
- **AC5 (FR4.1, FR4.2):** Re-generating a path excludes done milestones and starts at
  the next incomplete one.
- **AC6 (FR5.1):** The history is queryable by intern with type + timestamp.
- **AC7 (FR5.2):** Given the same profile, role, and events, the derived state and
  re-ranking are identical across runs.

## Clarifications (autonomous, per build directive)

1. **Storage:** progress lives in an append-only event store keyed by intern profile id
   and role milestone (SQLite, stdlib) — matches the approved `ProgressEvent` design.
2. **Skill confirmation:** a skill is "confirmed via progress" when the intern has
   completed that skill's milestone(s) on the role's path; combined with base profile
   skills for the effective set.
3. **Re-ranking rule:** roles whose newly-confirmed skills reduce their gap score move
   up; matched/missing are recomputed from the effective set. No time-decay weighting is
   applied numerically yet (kept simple; history preserves the data for later).
4. **Path re-gen:** done milestones are excluded; path starts at first incomplete
   milestone (the next step to do).

## Definition of done (from `Constitution.md`)

- Behaviour matches this spec, edge cases included (all ACs pass).
- A human has reviewed the diff against the spec before merge.
