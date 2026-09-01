# Constitution — AI Career Path Recommender

## What this project is

A personalized career recommendation tool for interns. An intern inputs their
skills and interests; the AI suggests learning paths and job roles, and the tool
tracks progress over time so recommendations stay relevant. Built with Python,
TensorFlow, and the OpenAI API.

This document is the governing contract for all work on the project. A new
contributor should understand it in 5 minutes.

## Principles

- **Plain language over cleverness.** A new contributor should understand any file
  in 5 minutes. Write for people, not for brevity.
- **Prefer well-established libraries over custom code.** Research before
  reinventing. Build on Python, TensorFlow, and the OpenAI API rather than
  hand-rolling what they already provide.
- **Every feature ships with its spec in `specs/`.** The spec is the source of
  truth for behaviour. No built feature is done without its spec, and no spec
  exists without a corresponding feature.
- **Recommendations are suggestions, not verdicts.** The tool guides an intern; it
  must never present a single career path as destiny. Handle uncertain or
  incomplete input gracefully rather than assuming it away.
- **Respect the intern's data.** Skills, interests, and progress are private and
  belong to the intern. Store only what the product needs and be transparent
  about how it is used.

## Constraints

- **Stack:** Python, TensorFlow, and the OpenAI API. Propose, don't add, new
  dependencies; justify any addition in the feature's spec.
- **Never touch `published/` or anything in `src/generated/`.** Treat both as
  build output — regenerate, don't edit.
- **The workflow in `Spec As A Refrence.md` governs all work.** No feature skips
  the RESEARCH → SPECIFY → CLARIFY → BUILD sequence.
- **AI output is reviewed.** Anything a model generates (recommendations, role
  suggestions) is fallible and must be reviewed before it reaches an intern.

## Definition of done

- Behaviour matches the spec, edge cases included.
- Acceptance criteria from the spec have been turned into checks and they pass.
- The recommender behaves sensibly on empty, partial, and conflicting input.
- A human has reviewed the diff against the spec before merge.
