# 0007 — Provenance is collected in the shell, rendered as data

Status: accepted (2026-07-11, `board-provenance` arch)

## Context

`board.html` gains a `generated <when> · source <where> · HEAD <sha> (<branch>)` footer because a
stale board was indistinguishable from a fresh one. The repo's standing shape is logic-in-parse /
dumb-render (ADR 0004) with the freeze gate pinning parse→StateModel only (ADR 0005). Provenance
describes the **act of observing** (wall clock + the observed checkout's git HEAD), not `.pipeline/`
content — so it does not belong in `StateModel`, and forcing it there would churn frozen fixtures
for a presentation concern.

## Decision

- New impure edge module `src/provenance.ts`: `collectProvenance(repoPath, now)` → plain
  `Provenance` data. The clock is injected (`now`); git is queried with `execFileSync` (no shell)
  via two read-only `rev-parse` calls; ANY failure (non-git dir exit 128, missing git ENOENT)
  degrades to `head: null` — never a crash, never a write to the observed repo.
- `renderBoard` gains an OPTIONAL second parameter; without it the output is unchanged. Render
  stays dumb: it formats injected data and reads nothing.
- `StateModel`/parse are untouched; provenance is NOT part of the freeze surface.
- Hand-parsing `.git` files was rejected: packed-refs, worktrees, and gitfile indirection make it a
  correctness trap; the `git` binary is the reference implementation of its own semantics.

## Consequences

- Existing render/parse tests are unaffected; provenance is tested against REAL temp git repos
  (no mocks, per repo policy).
- If `git` is absent the footer silently lacks the HEAD segment (risk-registered in the feature's
  `arch.md`); acceptable because `generated` + `source` still stamp the board.
- Future provenance enrichment (dirty flag, the dashboard's own version) extends `Provenance`,
  never `StateModel`.
