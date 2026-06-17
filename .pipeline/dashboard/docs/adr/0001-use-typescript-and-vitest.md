# ADR 0001 — Use TypeScript and Vitest

## Status

Accepted.

## Context

The dashboard's load-bearing contract is a structured `StateModel` produced by parsing `.pipeline/`.
The repo already has TypeScript, Vitest, and strict TypeScript configuration in `package.json` and
`tsconfig.json`.

## Decision

Implement Phase 1 with TypeScript and use Vitest for parser freeze tests.

## Consequences

- `Stage`, `CardStatus`, `Card`, and `StateModel` should be exported TypeScript types/interfaces.
- Parser tests can compare JSON-like `StateModel` values from deterministic fixtures.
- Exact HTML snapshot tests are not the primary freeze surface; renderer tests should stay smoke-level
  unless later requirements demand more.
