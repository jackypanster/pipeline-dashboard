# ADR 0002 — Input is a local path argument

## Status

Accepted.

## Context

The operator already controls freshness by pulling target repos. Phase 1 explicitly excludes network,
credentials, forge APIs, servers, databases, and multi-repo orchestration.

## Decision

The CLI accepts a local filesystem path to a target repo checkout and reads `<path>/.pipeline/`.
Output defaults to `board.html`, with an `--out <file>` override.

## Consequences

- The tool performs no git clone, pull, fetch, or API calls.
- No credentials or `.env` are needed for normal operation.
- If the path is missing or its pipeline metadata is malformed, parsing returns warnings and a valid
  empty `StateModel` where possible.
- The observed repo's `.pipeline/` is read-only input; only the configured output HTML file is written.
