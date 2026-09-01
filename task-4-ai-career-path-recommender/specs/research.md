# Research — AI Career Path Recommender

**Step:** RESEARCH (per `Spec As A Refrence.md`). Consolidates four parallel research
areas into one findings doc. Readable in ~5 minutes.

**Recommendation at a glance:** build a **hybrid** system — a lightweight taxonomy as
the structure/ground-truth backbone, embedding similarity as the deterministic
first-pass matcher, and the OpenAI API as the composer that turns top matches into
ranked, explained role suggestions and ordered learning paths. Collaborative
filtering is out of scope until real user data accrues.

---

## 1. Approaches & trade-offs

| Approach | Cold-start friendly | Explainability | Semantic | Sequencing | Cost/complexity | Main risk |
|---|---|---|---|---|---|---|
| Content/keyword | Yes | High | Low | No | Trivial | Misses synonyms, overspecializes |
| Collaborative filtering | No (fatal early) | Low | Medium | No | Medium (needs data) | Cold start, no data |
| Knowledge graph / taxonomy | Yes | High | Low | Yes (excellent) | High | Rotting taxonomy, brittle |
| Embedding similarity | Yes | Low–Med | High | No | Low–Med | Black box, no sequencing |
| LLM generation | Yes | High | High | Yes | Med–High (per-call) | Hallucination, cost, non-determinism |
| **Hybrid (embed + LLM + taxonomy)** | **Yes** | **High** | **High** | **Yes** | Med–High | Orchestration complexity |

- **Content/keyword:** match profile against role attribute profiles (cosine/Jaccard/
  weighted keyword). Zero training data, fully explainable, cheap — but misses
  synonyms and overspecializes. "The floor, not the ceiling."
- **Collaborative filtering:** learns from other users' behavior. *Fatal cold start*
  for a greenfield tool (no users, no behavioral signal), no implicit "like" behavior
  for career decisions, black box. Realistic only later as a secondary "others who did
  this path also did X" signal once thousands of users exist. **Out of scope now.**
- **Knowledge graph / taxonomy (ESCO-style):** skills & roles as structured relations
  (prerequisite, skill→role). Highly explainable, deterministic, *excellent at
  sequencing* — the natural backbone for progress tracking. Expensive/slow to maintain,
  rots as the market shifts, brittle (a skill absent from the graph doesn't exist).
- **Embedding similarity:** encode profile + role descriptions into a shared vector
  space, rank by cosine similarity. Semantic understanding, zero training data,
  cheap/offline/deterministic. Black box (no skill-level "why"), no sequencing.
- **LLM generation (OpenAI):** generate ranked roles + reasoning + step-by-step paths
  from free text. Unmatched explainable output and path-planning; no taxonomy needed;
  generalizes to emerging roles. Hallucination, latency/cost, non-determinism. Use as
  generator over a verified base, never as the sole source of truth.
- **Hybrid (recommended):** the layers cover each other's failure modes —
  1. taxonomy/graph = skeleton (roles, skills, prerequisites — structure, ground truth,
     progress backbone),
  2. embeddings = first-pass matcher (semantic, free, handles free-text/synonyms),
  3. LLM = composer/humanizer (ranked, explained roles and ordered paths, grounded in
     the catalogue so it can't invent courses).

Sources: SBERT docs, ESCO taxonomy, arxiv 2306.12067 (job-rec techniques), ResumeMatcher.

---

## 2. Stack fit & data model

**Decision — TensorFlow (hybrid plan):** the MVP matching layer uses lightweight,
deterministic embedding similarity (scikit-learn / sentence-transformers). A small
dataset would overfit a trained TensorFlow model, and TF is a 500MB–2GB install the
MVP doesn't need. **TensorFlow stays in the project as a planned component:** the
matcher sits behind an interface with a documented TF integration path, so TF swaps
in when interaction data grows and a learned model justifies it. This honors the
stated stack (Python/TensorFlow/OpenAI API) while following the constitution's
"propose, don't add dependencies."

- **Python** = application backbone (ingestion, orchestration, storage, API).
- **OpenAI API** = the product's intelligence layer:
  - `gpt-*` for natural-language learning paths, role suggestions w/ rationale, and
    progress summaries (the differentiating feature).
  - `text-embedding-3-small` (1536 dims, ~62.5k pages/$) for deterministic matching,
    ranked by cosine similarity. **Embed catalogue offline / cache it**; embed only
    intern free-text at request time. Embedding knowledge cutoff (Sept-2021): vet
    fast-moving skills via the curated catalogue/LLM, don't trust embeddings alone.

**Data model:**
- **Intern profile:** id, name, `skills[{id, proficiency 1–5}]`, `interests` (free
  text + tags), `experience_level`, `goals`, timestamps.
- **Role:** id, title, description, `required_skills[{skill, weight}]` (many-to-many),
  `domain`/`interests_related`, `level`, cached embedding.
- **Skill catalogue + prerequisite DAG** (`SkillPrerequisite` edge table) — enables
  topologically-ordered learning paths; **reject cycles**.
- **Learning path:** id, intern FK, target_role FK, status, ordered steps.
- **Progress:** `ProgressEvent` fact table (append-only, timestamped: intern, skill,
  event_type, ts UTC, value) + derived `InternSkillState` snapshot. **Store events,
  not just current state.**
- **Physical store:** SQLite (relational, not a vector DB — the catalogue is small and
  embeddings fit in memory).

**Progress-aware re-ranking (two-stage recall → re-rank):**
1. **Gap vector** per role: Σ weight(skill) × (1 − proficiency(skill)) — closing gaps
   move a role up.
2. **DAG reachability/feasibility** — only recommend paths whose prerequisites are
   satisfied so far.
3. **Recency weighting** — recent events are stronger evidence; suppress already-done
   skills.
4. **Learning-curve ordering** — next step is the first incomplete skill whose own
   prerequisites are met.
5. **Hybrid blend** — OpenAI semantic seed → progress-aware gap/feasibility re-rank →
   LLM rewrites the top-N as natural language. The LLM *formats*; deterministic
   scoring does the heavy ranking.

Sources: OpenAI Embeddings guide, TensorFlow Keras classification tutorial.

---

## 3. Failure modes & edge cases

Grounding: OWASP GenAI LLM Top 10 (2026), cold-start + rec-eval literature.

**Degenerate input**
- Empty profile → block generation, guided onboarding wizard, persist drafts.
- Skills-only or interests-only → separate weighted feature axes, mark "low
  confidence," ask a targeted follow-up; never assume the missing side is neutral.
- Conflicting inputs → lightweight consistency check; present the conflict back;
  if unresolved offer multiple coherent alternatives.
- Sparse vs verbose free text → min/max length validation; structured extraction into
  a fixed taxonomy before recommending.
- Typos / made-up skills → canonicalize against a curated skill dictionary (fuzzy
  match); flag & confirm unknown terms; distinguish "claimed" vs "verified" skills.
- **Cross-cutting rule:** the extraction/validation layer is deterministic and testable,
  independent of the generative LLM.

**Cold start (greenfield-default)**
- No historical data → start **content-based / knowledge-based** (curated
  skills→role→path graph); layer collaboration later.
- Preference elicitation (short onboarding questionnaire) to bootstrap profiles.
- Popularity-bias lock-in → treat diversity/serendipity as first-class objectives;
  audit recommendation distribution for concentration.

**Recommendation quality**
- Implausible/broad roles → constrain the LLM to a **closed taxonomy** (structured
  output / schema validation) + rule checks (prereqs vs profile); enforce max breadth.
- Overconfidence → **always return a ranked shortlist (3–5) with confidence scores and
  stated assumptions**, phrased as alternatives with a "starting point, not destiny"
  disclaimer. Recommendation = a distribution over options, not an argmax.
- Stale knowledge → versioned, refreshable taxonomy; separate the stable ontology from
  the live LLM layer.

**LLM-specific risks**
- Hallucination → ground every output against the closed taxonomy (RAG-style), emit
  structured JSON, schema-validate on ingest, treat output as untrusted (OWASP LLM02).
- Prompt injection (OWASP LLM01, #1 risk) → treat all user free-text as untrusted;
  never concatenate it into the system prompt as instructions — pass it as a delimited
  data blob; least-privilege (the model produces only text/JSON the app parses).
- Non-determinism → low temperature / seeded calls, cache per normalized-profile hash,
  record prompt+output for reproducibility.
- Cost/latency → precompute & cache by normalized profile, summarize verbose input,
  cheap model for extraction / expensive model for final output, token bounds, latency
  budget + a rule-based fallback if the LLM fails.

**Progress tracking**
- Stale data → timestamps + "as of" dates, nudge re-confirmation.
- Users who stop updating → recency/decay weighting; checkpoint/refresh flow.
- Progress recorded but not acted on → connect events back to recommendations
  (completed items unlock/rerank the next path); make the causal link explicit.
- Data privacy (OWASP LLM06) → explicit consent, pseudonymize/minimize payloads (send
  normalized vectors, not raw text), no train-on-your-data, retention/deletion for
  inactive interns, don't echo sensitive detail into logs.

**Evaluation**
- Offline metrics alone mislead → hybrid suite: precision@k/nDCG on held-out seed data
  + LLM-as-judge + human rubric (relevance, diversity, plausibility) + rule checks
  (taxonomy, 3–5 list, "suggestion not verdict").
- Real signal = online: click-through, thumbs up/down, saved-path, follow-through;
  A/B tests; north-star = engagement ("start path").
- Guard reproducibility (pin data splits/seeds/regression suite); track diversity/
  serendipity/trust; audit against feedback-loop bias (echo chamber).

**Cross-cutting:** (1) deterministic, testable layer separate from the LLM; (2) user
input *and* LLM output are untrusted; (3) cold start is the default; (4) ranked
suggestions with confidence, never a verdict — enforced by schema/phrasing/diversity,
not just prompt wording; (5) evaluation is a tiered loop (offline + rubric now, A/B once
users exist).

Sources: OWASP GenAI LLM Top 10 (2026), Wikipedia cold-start, rec-eval literature.

---

## 4. System architecture sketch

**Design principles:** prefer established libraries; incremental build; the two ML
engines do *different jobs* and never call each other directly — they meet only inside
an orchestrator. "**LLM for language, TF/similarity for signal.**"

**Components (6):**
1. **Profile Store** (SQLite) — normalized intern profile + skill embeddings.
2. **Role & Skill Catalogue** (taxonomy) — static, versioned JSON/YAML shipped in the
   repo; the single source of truth read by both the matcher and the LLM.
3. **Matcher** (embedding similarity; TF-ready interface) — candidate retrieval +
   ranking: embeds profile & role skills, cosine similarity. Deterministic, cheap,
   explainable.
4. **LLM Planner** (OpenAI API) — takes the ranked shortlist + profile + progress,
   generates natural-language learning paths, milestones, rationale. Does the prose,
   not the ranking.
5. **Progress Trail** (SQLite) — append-only log of completed milestones w/ timestamps.
6. **Planner / API layer** (FastAPI) — orchestrates the two-phase flow, exposes the
   contracts.

**Where each sits:** matching is deterministic and cheap (runs on every request, CI-
testable offline with zero OpenAI calls); the LLM adds value exactly where determinism
is *not* wanted (human explanation). Coexistence rule: the Planner is the only module
that touches both — you can swap providers or fall back to templates without touching
the matcher.

**Data flow:** submit profile → normalize against catalogue (map aliases: "py"→Python)
→ embed + cosine-sim vs roles → top-K ranked candidates → LLM generates a learning
path per role → return RecommendationResponse → intern marks a milestone "done" →
append to Trail, mutate stored profile → next request reruns retrieval with the updated
profile. **The loop closes: progress mutates the profile; the profile drives the next
retrieval.**

**Key contracts:**
```
Profile        { id, interests[], skills[{name, level}], embedding[], progress_summary }
Role (catalog) { role_id, title, required_skills[{skill, weight}], related_topics[], embedding }
Recommendation { candidates[{ role_id, title, score, matched_skills[], missing_skills[],
                              path{ rationale, milestones[] } }], generated_at }
Progress       { profile_id, milestone_id, status: done|in_progress|skipped, at }
```
Internal seam — the only two cross-engine interfaces:
```
Matcher.retrieve(profile_vector, k) -> List[ScoredRole{role_id, score}]
LLMPlanner.plan(profile, scored_roles, progress) -> List[Path{role_id, milestones[]}]
```

**Incremental build order** (each step independently testable):
1. **Catalogue + Profile Store** — no ML yet. Ship `POST /profile`.
2. **Matcher** — candidate retrieval. Ship `POST /recommend` returning `candidates`
   (scores, matched/missing skills).
3. **LLM Planner** — add learning-path prose on top of step 2 (recommendation now has
   both parts).
4. **Progress Trail + feedback** — wired into retrieval and LLM context (feature 3).

TF and OpenAI are only combined at steps 3–4, minimizing integration risk. This sketch
rests on standard, well-established recommendation-system patterns (retrieval→ranking
with embeddings + similarity, content-based filtering over a static taxonomy, and
structured-retriever → LLM orchestration); web search returned empty results in this
environment, so no external citations are attached here.

---

## Next step

This completes **RESEARCH**. Move to **SPECIFY**: draft `specs/spec.md` for the first
feature (catalogue + profile store + matcher) — goal, user scenarios, functional
requirements, edge cases & rules, out-of-scope, acceptance criteria — behavior only,
no tech choices.
