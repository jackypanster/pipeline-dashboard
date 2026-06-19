# ADR 0006 — the journal tail is the run-state authority (supersedes 0003)

## Status

Accepted. **Supersedes [0003](0003-current-json-stage-authority.md).**

## Context

ADR 0003 declared `.pipeline/current.json.stage` the feature-stage authority and forbade
re-deriving stage from other artifacts. Since then the upstream pipeline contract
(`jackypanster/pipeline` `CONTRACT.md`) evolved: it added an append-only run journal
(`.pipeline/<feature>/journal.md`) and made it the source of truth. The contract now states
plainly:

> Tail is authoritative. The live position = the last entry's `to-stage` + its handoff `>>> NEXT`.
> `current.json.stage` is only a fast cache; on any disagreement the journal tail wins.

ADR 0003 is therefore backwards relative to the system the dashboard observes: it pins the
cache and ignores the truth. A `current.json` that lags the journal would make the board
display the wrong stage and call that correct.

## Decision

When `journal.md` exists, the dashboard derives live run state by folding over the journal
**tail**:

- `stage` = tail `to-stage` when it is a forward stage (`prd|arch|task|impl|review|done`);
  when `to-stage` is a routing target (`hunt`/`todo`/…), fall back to the tail `from-stage`,
  and let `featureBlocked` carry the "in hunt / retry" meaning.
- `nextCommand`, `liveStatus`, and `by` come from the tail entry.
- If the journal-derived stage disagrees with `current.json.stage`, **the journal wins** and the
  dashboard emits a `stage drift` warning naming both values.

`current.json` is retained only as a fallback: when **no** `journal.md` is present (a
pre-journal feature, or the dashboard's own bootstrap repo), the dashboard reads
`current.json.stage` as before and emits a `no journal` warning. Behaviour with no journal is
unchanged from ADR 0003 — so this is a strict superset, never a regression.

Feature-level blocking is detected independently of cards: a tail with status
`failed`/`blocked` or a `→hunt` transition flags `featureBlocked`, and `reviews/integration-NN.md`
incident reports are surfaced. This closes a real blind spot — every card can read green while
the feature is actually routed to hunt.

## Consequences

- The board tracks the same authority the contract defines; cache lag no longer silently
  shows a wrong stage.
- `parse → StateModel` gains journal parsing, drift resolution, and feature-block detection —
  all in the deterministic, freeze-tested core (`render` stays dumb). New fixtures:
  `journal-happy`, `journal-drift`, `journal-blocked`, `journal-integration-incident`,
  `no-journal`, `journal-malformed`.
- The journal is treated as **optional**: malformed entries are skipped with a warning, a
  missing journal degrades to the cache. The tool never throws on bad journal data.
- ADR 0003's "do not infer stage from artifact presence" principle is preserved in spirit:
  we still do not guess from file presence — we read the journal's explicit, authoritative log.
