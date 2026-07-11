# 0008 — Stage drift is membership over the tail transition, not equality with the display candidate

Status: accepted (2026-07-11, `drift-semantics` arch). Refines ADR 0006.

## Context

ADR 0006 made the journal tail the stage authority and had the parser warn on "disagreement" with
the `current.json.stage` cache. The original predicate (`cache !== display candidate`, where the
candidate is tail.to) silently assumed compliant shims write the cache as the tail's *to*-stage.
They don't: CONTRACT.md:115 defines the cache as the most recently COMPLETED stage (= tail.from),
and the first real multi-agent run (`board-provenance`, 2026-07-11) additionally produced
rejection (`review→impl · failed`, cache left at `impl` = to) and terminal (`review→done`,
cache=done = to) states. Result: every compliant mid-flight board rendered a false
`stage drift` warning — including this repo's own dogfood boards.

## Decision

Drift ⇔ the cache matches NEITHER valid-Stage end of the tail transition:

```ts
const members = [tail.from, tail.to].filter(isStage);
const drift = members.length > 0 && !members.includes(cacheStage);
```

- Verified against the full real trajectory (7 cache×tail pairs from git history): zero false
  positives, and a genuinely stale cache (≥1 full entry behind) is always outside the member set
  because both ends advance together.
- Display selection is deliberately untouched: the board still shows the tail's to-stage (live
  position, per CONTRACT:260) with from-fallback for routing targets. Drift detection and display
  answer different questions — "can I trust the cache" vs "where is the run".
- An empty member set (hand-corrupted tail) suppresses the drift warning: drift is undefined
  without a trustworthy tail, and the malformed/derivation warnings already cover that path.

## Consequences

- Compliant runs render warning-free at every stage boundary; a `stage drift` warning now reliably
  means a stale or hand-edited cache.
- A hypothetical shim writing a stage outside {from, to} still warns — correct by intent, since
  such a write is non-compliant with CONTRACT.md:115.
- `test/journal.test.ts` + the `journal-drift` fixture are re-frozen through the feature's own
  task stage (new `spec-rev`); the old fixture content (cache=arch, tail `arch→task`) is reborn as
  the no-drift fixture `journal-cache-from`, since it was a compliant state all along.
