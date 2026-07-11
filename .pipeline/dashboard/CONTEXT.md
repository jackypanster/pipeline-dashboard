# Context — pipeline-dashboard ubiquitous language

This glossary fixes the project language for future pipeline nodes. Use these terms consistently in
cards, tests, implementation, and review comments.

## `current.json`

The fast bootstrap pointer at `.pipeline/current.json`. It is a **cache**, not the run-state
authority (see Journal). It still authoritatively names the active `feature` (the single
in-flight pointer).

Fields used by the dashboard:

- `repo`: target repo URL for display/context.
- `branch`: target branch for display/context.
- `pr`: PR marker; `"none"` or absent becomes `null` in `StateModel`.
- `feature`: the only feature directory read (the active-feature authority).
- `stage`: a **fallback cache** for the feature stage — used only when no `journal.md` exists.
  When a journal exists its tail wins; a disagreement surfaces as a `stage drift` warning.

Do not infer the current feature by scanning artifacts. Do not infer the stage from artifact
*presence* — read the journal's explicit log (ADR 0006, superseding 0003).

## Feature

The active pipeline work item named by `current.json.feature`. Its metadata lives under
`.pipeline/<feature>/`.

Phase 1 renders one feature only. Other `.pipeline/<name>/` directories are ignored.

## Stage

The feature-level pipeline state machine:

```text
prd -> arch -> task -> impl -> review -> done
```

The **authority is the `journal.md` tail** (its `to-stage`, with `from-stage` fallback when the tail
routed to a non-forward target like `hunt`/`todo`). `current.json.stage` is only a fallback cache used
when no journal exists; on disagreement the journal wins and the parser emits a `stage drift` warning.
File presence never overrides either source.

## Journal (run-state authority)

The append-only run log at `.pipeline/<feature>/journal.md`, one entry per completed stage. Per the
upstream `CONTRACT.md`, its **physically-last entry (the tail) is the authoritative live position** —
not `current.json`. Each entry carries `seq · timestamp · from→to · status · by=<bot/LLM> · done ·
output · handoff`.

The parser preserves **file (append) order** — the tail is the last appended entry, never the
max-`seq` entry; a non-monotonic `seq` is flagged with a warning, not silently reordered. From the
tail it derives `stage`, `nextCommand`, `liveStatus`, and `by`. The journal is **optional**: malformed
entries are skipped with a warning, and a missing journal degrades to the `current.json` cache.

## Feature blocked

A feature-level (not card-level) block, derived from the journal tail only: tail `status` is
`failed`/`blocked`, or its transition is `→hunt`. A `reviews/integration-NN.md` incident report is
append-only evidence shown **when** the feature is blocked — its mere presence does **not** trigger a
block (a recovered feature whose tail reaches `done` is correctly not blocked despite the lingering
report).

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

## Provenance (footer)

The render-time stamp `generated <ISO-UTC> · source <abs path> · HEAD <short-sha> (<branch>)` at
the bottom of `board.html`, answering "when was this board generated, from which checkout state" —
a stale board must not be indistinguishable from a fresh one.

Provenance is **not** part of `StateModel` and never enters the freeze surface: it describes the
act of observing (wall clock + the observed repo's git HEAD), not `.pipeline/` content. It is
collected in the shell (`src/provenance.ts`; clock injected, read-only `git rev-parse` via
`execFileSync`) and passed to `renderBoard` as an optional argument — the renderer stays dumb
(ADR 0004, ADR 0007). A non-git or git-less environment degrades by omitting the HEAD segment;
detached HEAD renders `(detached)`.
