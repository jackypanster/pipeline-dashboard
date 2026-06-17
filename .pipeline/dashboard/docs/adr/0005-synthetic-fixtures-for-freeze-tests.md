# ADR 0005 — Use synthetic fixtures for freeze tests

## Status

Accepted.

## Context

Live repo snapshots are convenient but unstable: they can contain unrelated dirty state, private data,
or incomplete bootstrap metadata. The parser contract needs deterministic fixtures that cover exact edge
cases.

## Decision

`pipeline-task` should create parser freeze tests using synthetic `.pipeline/` fixture trees under
`test/fixtures/`.

## Consequences

- Fixtures should cover happy path, blocked status, `attempts >= 3`, `pr: "none"`, missing/malformed
  `current.json`, missing current feature/tasks, invalid card status, and multiple feature dirs.
- Live self-dashboard generation can be a CLI/manual smoke check, not the frozen contract.
- Fixture names should map directly to the behavior being frozen so future cold agents can diagnose
  failures without rereading history.
