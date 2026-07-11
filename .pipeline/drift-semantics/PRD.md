# PRD — drift-semantics

> Feature: fix the stage-drift false positive — the no-drift predicate becomes set membership
> `cache ∈ {tail.from, tail.to}`. Produced by `pipeline-prd` 2026-07-11 (by=claude-fable-5).
> Audience: the COLD arch node.

## Problem

The dashboard flags **every CONTRACT-compliant mid-flight state** as `stage drift`:

- `resolveStage` (src/parse.ts:139-167) warns whenever `current.json.stage !== ` the
  journal-derived candidate (tail.to for forward stages), and `test/journal.test.ts:91` freezes the
  `journal-drift` fixture (`stage=arch`, tail `arch→task`) as MUST-warn.
- But CONTRACT.md:115 defines `current.json.stage` as the most recently COMPLETED stage — i.e.
  tail.from — so `stage=arch` + tail `arch→task` is exactly what a compliant arch stage writes.
- 📖 data-verified on the real `board-provenance` run (git history of `current.json` × journal
  entries, 2026-07-11): every mid-flight board render showed a false warning.

Discovered 2026-07-11 during the `board-provenance` 立项 consistency review; recorded in that PRD's
Non-scope; routed to this separate feature by the human.

## The evidence that fixed the predicate

Real (cache, tail) pairs from the `board-provenance` trajectory — the state space a correct rule
must accept without warning:

| cache | journal tail | relation |
|---|---|---|
| prd | `prd→arch` | cache == from |
| arch | `arch→task` | cache == from |
| task | `task→impl` | cache == from |
| impl | `impl→review` | cache == from |
| impl | `review→impl` (failed, rejection) | **cache == to** — reviewer left cache untouched |
| review | `review→review` (re-review) | from == to == cache |
| done | `review→done` | cache == to |

The rejection row (seq=5) proves the strict literal-CONTRACT rule `cache == tail.from` ALSO
false-positives. The only rule with zero false positives on all real states that still catches a
genuinely stale cache (≥1 full entry behind, e.g. `cache=prd` vs tail `arch→task`) is:

**no drift ⇔ `cacheStage ∈ {tail.from, tail.to}`** (membership over the valid-Stage members of the
pair); otherwise warn. ✅ human-confirmed (2026-07-11 grill, direction A chosen over changing
CONTRACT/shims upstream).

## Goal

The `stage drift` warning fires ONLY on a genuinely stale or corrupt cache; compliant runs render
warning-free at every stage boundary. Displayed stage semantics unchanged (journal tail stays the
authority).

## Success criteria

1. All seven real-trajectory pairs above render with NO drift warning.
2. A genuinely stale cache (`cache ∉ {tail.from, tail.to}`, e.g. `cache=prd`, tail `arch→task`)
   still warns, message format preserved: `stage drift: current.json=X, journal=Y (journal tail wins)`.
3. Displayed stage unchanged: tail.to when it is a forward Stage, tail.from fallback for routing
   targets (`hunt`/`todo`), cache fallback when no journal — pinned by existing tests that stay green.
4. `journal-happy` fixture (`stage=impl`, tail `task→impl`) stays no-drift (it already satisfies
   membership). `journal-drift` fixture is REDEFINED to a genuinely stale cache.
5. Full suite green; product diff confined to `src/parse.ts` (the drift predicate inside
   `resolveStage`); spec/fixture diff confined to `test/journal.test.ts` + `journal-drift` fixture;
   glossary wording updated in `.pipeline/dashboard/CONTEXT.md` (definition of "disagreement").

## Scope

- `src/parse.ts` — drift predicate only (candidate selection for DISPLAY is untouched).
- `test/journal.test.ts` + `test/fixtures/journal-drift/` — re-freeze via THIS feature's task stage.
- `.pipeline/dashboard/CONTEXT.md` — "Stage"/"current.json" sections: define drift as
  cache-outside-{from,to}.

**Freeze-gate legality note (for arch/task/review nodes):** `test/journal.test.ts` was frozen as
`journal-aware`'s spec. Editing it HERE is sanctioned ONLY through this feature's own
`pipeline-task` re-freeze (new freeze commit, new `spec-rev`); the impl node still never touches
spec-paths. This is the CONTRACT's intended route for spec evolution — not a gate violation.

## Non-scope

- CONTRACT.md / shim changes upstream (direction B rejected ✅ human-confirmed; a one-sentence
  CONTRACT wording clarification may later go through `pipeline-improve` against the pipeline repo —
  different repo, different gated path, not this feature).
- Any change to displayed-stage semantics, blocked derivation, or card lanes.
- The provenance footer (shipped feature; untouched).

## Decisions (provenance-tagged)

1. Direction A — dashboard-only fix. ✅ human-confirmed (2026-07-11 grill).
2. Predicate = membership `cache ∈ {tail.from, tail.to}`. ✅ human-confirmed + 📖 data-verified
   (seven-row table above; git history `2c6c072..e741942` × journal seq 1–8).
3. Displayed stage stays journal-derived exactly as today. 📖 code-verified (src/parse.ts:149-157;
   CONTRACT.md:260 "live position = tail's to-stage").
4. Redefined `journal-drift` fixture uses `cache=prd` vs tail `arch→task`. ⚠️ assumed — any
   out-of-membership value works; arbitrary concrete choice.
5. Corrupt tail (neither from nor to a valid Stage): NO drift warning — the malformed-entry warning
   already fires; drift is undefined without a trustworthy tail. ⚠️ assumed — arch must confirm
   against parse.ts fallback order.
6. Warning message text unchanged. ⚠️ assumed — arch may refine `journal=Y` (Y = display candidate)
   if membership makes it ambiguous.
