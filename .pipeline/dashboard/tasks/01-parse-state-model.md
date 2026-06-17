---
id: "01"
title: parse(.pipeline/) -> StateModel (the frozen core)
status: in-progress
attempts: 0
verify: npm test
spec-paths:
  - test/parse.test.ts
  - test/fixtures/
impl-paths:
  - src/model.ts
  - src/parse.ts
  - src/frontmatter.ts
spec-rev: 65f28e4de6f6804b3da4932ce2eb20752985b6ad
---

# Card 01 — parse(.pipeline/) -> StateModel

## Outcome

`npm test` is green. `parsePipeline(<dir>/.pipeline)` in `src/parse.ts` returns a `StateModel`
(types in `src/model.ts`) satisfying the frozen `test/parse.test.ts` over `test/fixtures/`.

## Scope (impl-paths only — never touch spec-paths)

- `src/model.ts` — export `Stage`, `CardStatus`, `Card`, `StateModel` exactly as the PRD specifies,
  plus `STAGE_ORDER = ["prd","arch","task","impl","review","done"]` and
  `CARD_STATUSES = ["todo","in-progress","review","done","blocked"]`. No fs/render/cli imports.
- `src/parse.ts` — `parsePipeline(pipelineDir: string): StateModel`. Read-only fs projection. All
  business rules live here (see Rules). Never throws on ordinary malformed data — emit `warnings`.
- `src/frontmatter.ts` — optional pure helper to parse task-card frontmatter (no fs).

## Rules (all asserted by the frozen test; do not re-derive shape)

1. Read `<pipelineDir>/current.json`; normalize `pr:"none"`/absent to `null`.
2. `current.json.stage` is the stage authority (do NOT infer stage from artifacts).
3. Read only `.pipeline/<current.json.feature>/tasks/*.md`; ignore other feature dirs.
4. Card fields from frontmatter; `title` fallback: frontmatter `title` -> first H1 -> filename.
5. `attempts` defaults to `0`. `specRev` is frontmatter `spec-rev` else `null`.
6. `isBlocked = status === "blocked" || attempts >= 3`.
7. Invalid `status` value -> add a warning and OMIT the card from both `cards` and `lanes`.
8. `cards` sorted by `id` ascending; `lanes` always has all 5 keys; group by valid status.
9. Missing `.pipeline`/`current.json`, malformed JSON, or missing feature dir -> non-fatal:
   return a valid (possibly empty) `StateModel` + `warnings` (empty/no-current/malformed include a
   "no active feature" style warning; missing feature dir keeps repo/branch/stage metadata).

## Verification (must exit 0)

```bash
npm test
```

## Notes

This is the only card whose freeze test has real teeth (deterministic right/wrong). Keep ALL logic
here so cards 02/03 stay dumb. The test is already frozen at `spec-rev` above — do not edit it; if the
spec is wrong, route back to pipeline-task to re-freeze, never edit it from impl.
