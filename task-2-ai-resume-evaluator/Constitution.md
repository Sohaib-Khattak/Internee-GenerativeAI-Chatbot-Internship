# Constitution — Smart Notes

## Principles

- Plain language over cleverness. A new contributor should understand any file in 5 minutes.
- Prefer well-established libraries over custom code. Research before reinventing.
- Every feature ships with its spec in `specs/`. The spec is the source of truth.

## Constraints

- Stack: keep it to what's already here. Propose, don't add, new dependencies.
- Never touch `published/` or anything in `src/generated/`.

## Definition of done

- Behaviour matches the spec, edge cases included.
- A human has reviewed the diff against the spec before merge.