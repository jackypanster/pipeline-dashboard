---
id: "02"
title: render(StateModel) -> board.html (dumb shell)
status: todo
attempts: 0
verify: npm test
spec-paths:
  - test/render.test.ts
impl-paths:
  - src/render.ts
spec-rev: pending
---

# Card 02 — render(StateModel) -> HTML string

## Outcome

`renderBoard(state: StateModel): string` in `src/render.ts` returns a self-contained HTML document
(inline CSS) showing the stage flow (highlighting `state.stage`) and all five lanes with cards.

## Scope (impl-paths only)

- `src/render.ts` — presentation only. Accepts a complete `StateModel`. HTML-escape all dynamic text.
  Render `warnings` prominently, the fixed `stageOrder` with current stage highlighted, all 5 lanes
  (including empty), each card's `id`/`title`/`attempts`/`specRev`, and visually emphasize
  `isBlocked` / `attempts >= 3`.

## Forbidden in render (architecture rule)

Reading files, inferring stage, discovering/filtering cards, regrouping lanes, mutating the model.

## Freeze note

This card's red test (`test/render.test.ts`) is **smoke-level** and gets frozen by pipeline-task when
this card becomes active (after card 01 merges). `spec-rev: pending` until then. The freeze gate does
NOT pin exact HTML visuals — visual correctness is judged by eye at pipeline-review.

## Verification

```bash
npm test
```
