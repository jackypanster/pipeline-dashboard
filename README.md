# pipeline-dashboard

Read-only state-machine dashboard for the [`jackypanster/pipeline`](https://github.com/jackypanster/pipeline)
skill-aggregation pipeline.

It reads a target repo's `.pipeline/` git+md state bus (`current.json` + `<feature>/journal.md` +
`<feature>/tasks/*.md` frontmatter) and renders it as a single static `board.html` — **no server,
no DB, no write actions**. The page shows the pipeline's state machines plus its run history:

1. **Feature stage flow** — `prd → arch → task → impl → review → done`. The authority is the
   `journal.md` tail (per the upstream contract); `current.json.stage` is a fallback cache used only
   when no journal exists, and a drift between them is surfaced as a warning.
2. **Card status lanes** — `todo / in-progress / review / done / blocked` (from card frontmatter,
   with `attempts` and `spec-rev`)
3. **Run journal timeline** — every stage transition with `seq`, `from→to`, status, the `by=<LLM/bot>`
   that ran it, and its handoff; plus a feature-level **blocked** banner when the journal *tail* routes
   the feature out of the forward flow (`failed`/`blocked`/`→hunt`). When blocked, any
   `reviews/integration-NN.md` incident report is surfaced as evidence. The tail — not the mere
   presence of a report — is the authority, so a feature that later recovers to `done` is correctly not
   shown blocked even though the append-only report still exists on disk.

## Architecture (thin shell over a testable core)

```
parse(<repo>/.pipeline/)  →  StateModel        # pure, deterministic — this is what the freeze tests pin
render(StateModel)        →  board.html        # thin presentation shell — reviewed by eye, not frozen
```

The freeze gate guards `parse → StateModel` (blocked cards, attempts≥3, multi-feature, missing/malformed
files, stage derivation) where there is a right answer. Visual rendering is a thin shell.

## Built by the pipeline (dogfood)

This repo is itself a **target of `jackypanster/pipeline`** — see `.pipeline/`. It is built stage by
stage (prd → arch → task → impl → review) via human-relayed agent handoffs, and observes its own
`.pipeline/` as the first live data source.

## Status

Bootstrapping. PRD pending (`pipeline-prd`).
