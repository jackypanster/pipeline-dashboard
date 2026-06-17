# ADR 0003 — `current.json.stage` is the feature-stage authority

## Status

Accepted.

## Context

The pipeline contract says `current.json.stage` names the most recently completed feature stage. The
repo may contain artifacts from multiple stages, and artifact presence can be stale, partial, or ahead
of the intended pointer during handoff.

## Decision

The dashboard displays the feature stage flow from `.pipeline/current.json.stage` only. It must not
re-derive stage from the presence or absence of PRD, arch, task, implementation, or review artifacts.

## Consequences

- The stage flow remains aligned with the cold-node bootstrap pointer.
- Missing or extra artifacts do not change the displayed current stage.
- Unknown stage values should produce a warning and fall back to a safe renderable default rather than
  scanning artifacts for an alternative truth source.
- Parser tests must cover stage authority independent of file presence.
