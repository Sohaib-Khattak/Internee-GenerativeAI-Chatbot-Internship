# AI Career Path Recommender

## Project overview

**Objective:** Design an AI system to suggest career paths based on intern profiles.

**Deliverable:** A personalized career recommendation tool for interns.

## Features

- **Input skills and interests.** Interns tell the tool what they know and what they care about.
- **AI suggests learning paths and job roles.** Based on that input, the AI recommends what to learn next and which roles fit.
- **Track progress over time.** The tool records progress so recommendations can evolve as the intern grows.

## Tools

- **Python** — primary language.
- **TensorFlow** — for the recommendation/modeling layer.
- **OpenAI API** — for AI-generated suggestions (learning paths, job roles).

## How the project is structured

Two governing documents define how work proceeds:

- `Constitution.md` — the governing principles, constraints, and definition of done for all work on this project.
- `Spec As A Refrence.md` — the feature workflow (RESEARCH → SPECIFY → CLARIFY → BUILD) that every feature must follow.
- `CLAUDE.md` — this file; the entry point describing what the project is and where everything lives.
- `specs/` — one spec per feature; the spec is the source of truth for behaviour.

## Workflow

Every feature follows the sequence in `Spec As A Refrence.md` — do not skip to building:

1. **RESEARCH** — investigate how the feature is usually built, the approaches and trade-offs, what it must fit in this project, and its failure modes / edge cases. Output: a one-page findings doc. No design or code yet.
2. **SPECIFY** — draft `spec.md`: goal, user scenarios, functional requirements, edge cases & rules, out-of-scope, acceptance criteria. Behaviour only — no tech choices.
3. **CLARIFY** — interview the user about the spec, one question at a time, until nothing is left to misread. No code yet.
4. **BUILD** — right-size it; small steps, each checked against the spec and committed as you go.

## Definition of done

- Behaviour matches the spec, edge cases included.
- A human has reviewed the diff against the spec before merge.
- Recommendation logic behaves sensibly on empty, partial, and conflicting input.
