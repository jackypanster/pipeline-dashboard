---
id: "02"
title: render(StateModel) -> board.html (dumb shell)
status: review
attempts: 0
verify: npm test
spec-paths:
  - test/render.test.ts
impl-paths:
  - src/render.ts
spec-rev: d8baf41fab58d3353c46150532e0f5e96831882f
---

# Card 02 — render(StateModel) -> HTML string

## Outcome

`renderBoard(state: StateModel): string` in `src/render.ts` returns a self-contained HTML document
(inline CSS, no external assets) showing the stage flow (highlighting `state.stage`) and all five
lanes with cards. `npm test` green (both parse + render suites).

## Scope (impl-paths only — never touch spec-paths or other src)

- `src/render.ts` — presentation only. Accepts a complete `StateModel`. Imports types from
  `./model.js`. Must NOT read files, infer stage, discover/filter cards, regroup lanes, or mutate
  the model. HTML-escape ALL dynamic text (titles, warnings, repo/branch/feature, ids).

## Render contract — stable hooks the frozen test asserts (spec-rev d8baf41)

These machine-readable attributes are the freeze contract. Visual styling/labels/CSS are free; emit
these hooks regardless of how it looks:

- One element per status lane carrying `data-lane="<status>"` for ALL five statuses
  (`todo`, `in-progress`, `review`, `done`, `blocked`) — even when the lane is empty.
- One element per stage carrying `data-stage="<stage>"` for ALL six `stageOrder` entries.
- The current stage marked once via `data-current-stage="<state.stage>"` (single attribute somewhere;
  the visual highlight itself is reviewed by eye, not frozen).
- Each card with `isBlocked === true` carries `data-blocked="true"`.
- Each card exposes `data-attempts="<n>"` (the card's `attempts`).
- A card's `title` and (when non-null) `specRev` text appear in the output.
- `warnings[]` text is rendered (prominently).

The test pins **presence of these hooks + escaping**, NOT exact markup/visuals. Visual quality
(layout, colors, blocked emphasis styling) is judged by eye at `pipeline-review`.

## Verification (must exit 0)

```bash
npm test
# manual at review: build a board.html from a fixture and open it — does it read well?
```

## Freeze note

`test/render.test.ts` is frozen at `spec-rev` above. Do NOT edit it from impl; if the contract is
wrong, route back to `pipeline-task` to re-freeze. Do NOT touch card 01's spec (`test/parse.test.ts`,
`test/fixtures/`) or `src/parse.ts|model.ts|frontmatter.ts`.
