# ADR 0004 — Keep logic in parse and rendering dumb

## Status

Accepted.

## Context

The dashboard has one part with a deterministic right answer (`.pipeline/` projection to `StateModel`)
and one part whose value is primarily visual (`StateModel` to HTML). The pipeline freeze gate is most
useful when it pins the deterministic part.

## Decision

All business logic lives in parsing/projection. Rendering accepts a complete `StateModel` and maps it to
HTML without filesystem access, state inference, card filtering, lane grouping, or model mutation.

## Consequences

- `parse.ts` owns current.json parsing, card discovery, frontmatter projection, validation, sorting,
  lane grouping, blocked computation, and warnings.
- `render.ts` owns only HTML escaping and presentation.
- Frozen tests target `parse -> StateModel`.
- Visual correctness is reviewed by opening `board.html` during pipeline-review.
