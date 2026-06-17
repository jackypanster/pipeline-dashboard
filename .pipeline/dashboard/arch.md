# Architecture — pipeline-dashboard (feature: dashboard)

## Purpose

`pipeline-dashboard` is a read-only static dashboard generator for a target repo's `.pipeline/`
state bus. It renders one target checkout's current feature into a single `board.html` so a human
operator or cold agent can see pipeline state quickly without hand-reading metadata files.

The architecture formalizes the PRD's already-frozen `StateModel` contract. It does **not** redesign
that shape.

## Design constraints

- Input is a **local filesystem path** to a target repo checkout.
- The tool reads only `<target>/.pipeline/` and never writes into the observed `.pipeline/`.
- Phase 1 renders only the current feature named by `.pipeline/current.json`.
- The feature stage flow comes from `current.json.stage`; artifact presence is not a stage authority.
- Business logic belongs in parsing/projection. Rendering stays intentionally dumb.
- The freeze gate pins `parse -> StateModel` behavior only; visual rendering is reviewed by eye.
- Missing or malformed pipeline state is non-fatal and must still render an empty/warning board.

## Component boundaries

```text
src/
  model.ts          # Stage/CardStatus/Card/StateModel types and fixed constants
  parse.ts          # read-only filesystem projection: .pipeline/ -> StateModel
  frontmatter.ts    # small parser helper for task-card frontmatter, if needed
  render.ts         # StateModel -> HTML string; no filesystem or business rules
  cli.ts            # argv/path handling and output-file write
```

### `model.ts`

Owns the shared contract that task-stage freeze tests compare against.

- Exports `Stage`, `CardStatus`, `Card`, and `StateModel` exactly as specified by the PRD.
- Exports fixed constants:
  - `STAGE_ORDER = ["prd", "arch", "task", "impl", "review", "done"]`
  - `CARD_STATUSES = ["todo", "in-progress", "review", "done", "blocked"]`
- Does not import filesystem, rendering, or CLI code.

### `parse.ts`

Owns all business rules and warning generation.

Responsibilities:

- Read `<target>/.pipeline/current.json`.
- Normalize `pr: "none"` or missing `pr` to `null`.
- Treat `current.json.stage` as the feature-stage authority.
- Read only `.pipeline/<current.json.feature>/tasks/*.md`; ignore other feature directories.
- Extract card fields from frontmatter / fallback title sources.
- Validate status values against `CardStatus`.
- Default `attempts` to `0`.
- Compute `isBlocked` as `status === "blocked" || attempts >= 3`.
- Sort cards by `id` ascending.
- Group cards into all five lane keys.
- Return warnings instead of throwing for ordinary malformed pipeline data.

The top-level parser is read-only and deterministic for a given filesystem snapshot. Lower-level
helpers may be pure string parsers, but `parsePipeline(...)` itself performs read-only I/O.

### `render.ts`

Owns presentation only.

Responsibilities:

- Accept a complete `StateModel`.
- Escape all dynamic text for HTML.
- Render warnings prominently.
- Render the fixed stage flow and highlight `state.stage`.
- Render all five lanes, including empty lanes.
- Render card `id`, `title`, `attempts`, and `specRev` when present.
- Visually emphasize blocked cards and cards with `attempts >= 3`.

Forbidden in render:

- Reading files.
- Inferring stage from artifacts.
- Discovering or filtering cards.
- Grouping cards into lanes.
- Mutating the `StateModel`.

### `cli.ts`

Owns the thin shell around the testable core.

Responsibilities:

- Parse the required local target path argument.
- Parse optional `--out <file>`; default output is `board.html` in the current working directory.
- Call `parsePipeline(<target>/.pipeline)`.
- Call `renderBoard(state)`.
- Write the HTML string to the output path.
- Exit non-zero only for CLI usage/output-write failures, not for malformed observed pipeline data.

The CLI must never write inside the target repo's `.pipeline/` directory.

## Data flow

```text
local target path argument
  -> <target>/.pipeline/
  -> parsePipeline(...)
  -> StateModel
  -> renderBoard(...)
  -> HTML string
  -> board.html
```

Only the configured output HTML path is written. The observed `.pipeline/` tree is read-only input.

## StateModel contract clarifications

The PRD owns the `StateModel` shape. Architecture fixes the following edge decisions so `pipeline-task`
can freeze them with red tests:

- `stageOrder` is always the fixed six-stage array.
- `lanes` always contains all five card status keys, even when empty.
- `cards` contains only valid `Card` objects with valid `CardStatus` values.
- Invalid-status task files produce a warning and are omitted from both `cards` and `lanes`.
- Missing card frontmatter is non-fatal; `title` falls back to first H1, then filename.
- Missing `attempts` defaults to `0`.
- `attempts >= 3` sets `isBlocked: true` even if the card's lane status is not `blocked`.
- Multiple feature directories may exist, but only `current.json.feature` is read in Phase 1.

## Empty and malformed state handling

The dashboard is a triage surface, so malformed observed data should degrade to warnings plus a valid
empty board whenever possible.

For missing `.pipeline/`, missing `current.json`, malformed `current.json`, or an empty/invalid active
feature pointer, return a valid `StateModel`:

```ts
{
  repo: "",
  branch: "",
  pr: null,
  feature: "",
  stage: "prd",
  stageOrder: ["prd", "arch", "task", "impl", "review", "done"],
  cards: [],
  lanes: {
    todo: [],
    "in-progress": [],
    review: [],
    done: [],
    blocked: [],
  },
  warnings: ["no active feature"]
}
```

If `current.json` is valid but the current feature directory or `tasks/` directory is absent, preserve
repo metadata and authoritative `stage`, return empty lanes/cards, and add a warning. This repo's own
`.pipeline/` currently has no card yet, so this is a first-class Phase 1 case, not an exceptional path.

If `current.json.stage` is unknown, add a warning and fall back to `"prd"` for renderability; do not
try to infer stage from artifact presence.

## Freeze-test surface

`pipeline-task` should freeze parser behavior with deterministic synthetic fixtures:

```text
fixture .pipeline/ tree -> parsePipeline(...) -> StateModel
```

The freeze gate should not pin exact HTML output. Renderer tests may be smoke-level, but visual
correctness is reviewed in `pipeline-review` by opening the generated `board.html`.

Minimum parser fixture set:

- Happy path with mixed lanes.
- Explicit `blocked` card.
- Non-blocked status with `attempts >= 3`.
- `pr: "none"` normalization.
- Missing `.pipeline/` or missing `current.json`.
- Malformed `current.json`.
- Missing current feature directory or empty/missing `tasks/` directory.
- Invalid card status warning + omission.
- Multiple feature directories where only `current.json.feature` is read.

## Deferred Phase 2 seams

The Phase 1 boundaries intentionally leave room for later features without changing the parser/render
contract:

- Multi-feature and historical views can add a new model/projection instead of changing current-feature
  semantics.
- PR/CI enrichment can add an optional enrichment layer after parsing, not network calls inside parse.
- Client-side refresh can consume generated artifacts, but Phase 1 remains static HTML generation.
