# Context — pipeline-dashboard ubiquitous language

This glossary fixes the project language for future pipeline nodes. Use these terms consistently in
cards, tests, implementation, and review comments.

## `current.json`

The authoritative pointer at `.pipeline/current.json`.

Fields used by Phase 1:

- `repo`: target repo URL for display/context.
- `branch`: target branch for display/context.
- `pr`: PR marker; `"none"` or absent becomes `null` in `StateModel`.
- `feature`: the only feature directory read by Phase 1.
- `stage`: the feature-stage authority.

Do not infer the current feature or stage by scanning artifacts.

## Feature

The active pipeline work item named by `current.json.feature`. Its metadata lives under
`.pipeline/<feature>/`.

Phase 1 renders one feature only. Other `.pipeline/<name>/` directories are ignored.

## Stage

The feature-level pipeline state machine:

```text
prd -> arch -> task -> impl -> review -> done
```

`current.json.stage` names the most recently completed stage and is the display authority for the
stage flow. File presence does not override it.

## Status

The card-level lane state:

```text
todo / in-progress / review / done / blocked
```

Status belongs to a task card, not to the whole feature.

## Stage vs status

There are **two independent state machines**:

1. `stage` describes where the whole feature is in the pipeline.
2. `status` describes where one task card sits on the board.

Never infer `stage` from card statuses. Never infer card `status` from feature `stage`.

## Card

A task markdown file under `.pipeline/<feature>/tasks/*.md`, projected into the PRD's `Card` shape:

- `id`
- `title`
- `status`
- `attempts`
- `specRev`
- `isBlocked`

The parser owns projection from markdown/frontmatter to `Card`. Rendering only displays cards.

## Lane

A visual/status column for cards. There are always five lanes:

```text
todo / in-progress / review / done / blocked
```

`StateModel.lanes` always contains all five keys, even when a lane is empty.

## Attempts

A card frontmatter number recording how many times a card has failed or been rejected.

- Missing attempts defaults to `0`.
- `attempts >= 3` means `isBlocked: true`.
- The card may remain in its textual status lane, but render must visually emphasize the blocked risk.

## `spec-rev`

Optional card frontmatter pointing to the frozen spec revision committed by `pipeline-task`.

In `StateModel`, it is exposed as `specRev: string | null`.

## StateModel

The complete read model returned by parsing `.pipeline/`. It is the frozen parser contract and the only
input to rendering.

The PRD owns the shape. Architecture owns boundaries and edge-case decisions around how observed files
become this shape.

## Freeze gate

The pipeline invariant that implementation must not mutate frozen spec paths. For this project, the
freeze-test surface should pin parser behavior:

```text
parse .pipeline fixture -> StateModel
```

The freeze gate should not pin exact HTML visuals.

## Thin shell

The design principle that the CLI and renderer stay shallow wrappers around the testable parser core.
The shell coordinates inputs/outputs but does not hide business logic.

## Dumb render

Rendering is a pure presentation mapping from `StateModel` to HTML string.

A dumb renderer does not:

- read files,
- infer stage,
- filter cards,
- group lanes,
- validate statuses,
- mutate the model.

## No active feature

A graceful empty-state condition used when `.pipeline/` or `current.json` is missing, malformed, or
cannot identify an active feature.

The parser returns a valid empty `StateModel` with a warning such as `"no active feature"`; the renderer
still emits a usable `board.html`.

This repo currently has no task card yet, so empty lanes are a normal bootstrap state.
