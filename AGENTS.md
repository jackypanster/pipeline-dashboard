# AGENTS.md — entry point for LLM/agents

> Audience: an LLM or coding agent that wants to **deploy, use, or contribute to** this repo.
> Read this first, then `.pipeline/dashboard/PRD.md` + `arch.md` for depth. Human-readable too, but
> optimized for machine consumption: facts over prose, command blocks are the source of truth.

## What this is

`pipeline-dashboard` is a **read-only** static-site generator. It reads a target repo's `.pipeline/`
git+md state bus (the state produced by [`jackypanster/pipeline`](https://github.com/jackypanster/pipeline))
and renders it as a single `board.html` showing two state machines:

1. **Feature stage flow** — `prd → arch → task → impl → review → done` (from the `journal.md` tail,
   falling back to `current.json.stage` when no journal exists).
2. **Card status lanes** — `todo / in-progress / review / done / blocked` (from card frontmatter,
   with `attempts` and `spec-rev`).
3. **Run journal timeline** — every stage transition (`seq`, `from→to`, status, `by=<LLM/bot>`,
   handoff) from `journal.md`. A feature-level **blocked** banner appears when the journal *tail*
   routes the feature out of the forward flow (`failed`/`blocked`/`→hunt`); **when blocked**, any
   `reviews/integration-NN.md` incident report is surfaced as evidence. (The tail is the authority,
   not file presence — an incident report is append-only and survives recovery, so a feature that
   later reaches `done` is correctly *not* shown blocked even though the report still exists.)

No server, no database, no write actions. It never writes into the observed `.pipeline/`.

## Build status (read before assuming it runs)

This repo is **under construction, built by the pipeline itself** (dogfood). Current capability:

| Component | File | State |
|---|---|---|
| StateModel types | `src/model.ts` | ✅ done |
| `parse(.pipeline/) → StateModel` (all business logic) | `src/parse.ts`, `src/frontmatter.ts` | ✅ done, frozen tests green |
| `render(StateModel) → HTML` | `src/render.ts` | ✅ done |
| CLI `board.html` generation | `src/cli.ts` | ✅ done |
| Build/run as plain Node ESM CLI | `package.json`, `tsconfig.json` | ✅ done (`npm run build`, `node dist/cli.js`) |

**Consequence: `board.html` generation is available after building.** Install deps, run the test suite,
then build and invoke the emitted CLI with plain Node.

## Quick start (works today)

```bash
git clone https://github.com/jackypanster/pipeline-dashboard
cd pipeline-dashboard
npm install        # Node >= 22 (developed on Node 26); npm
npm test           # runs parser/render/CLI/integration suites (must be green)
npm run build      # emits dist/cli.js for plain Node
```

## Use

```bash
# Point it at a LOCAL checkout of any repo that the pipeline operates on.
# It reads <target>/.pipeline/ and writes a static board.html. Read-only: it never
# modifies the target.
npm run build
node dist/cli.js /path/to/target-repo            # writes ./board.html
node dist/cli.js /path/to/target-repo --out /tmp/board.html
npx pipeline-dashboard /path/to/target-repo --out /tmp/board.html
open board.html                                 # or xdg-open / a browser
```

Input is a **local filesystem path** to a target repo checkout (not a git URL — `git pull` the target
yourself first). Phase 1 renders only the feature named by `<target>/.pipeline/current.json`.

## Deploy

It is a generator, not a service — "deploy" = produce `board.html` and serve/open it. No daemon, no DB.

- **On demand**: run `npm run build`, run `node dist/cli.js <target> [--out file]`, open the file.
- **As a package binary**: the `pipeline-dashboard` bin maps to `dist/cli.js` after build/install.
- **Always-fresh**: have a cron (or the pipeline's reviewer cron) re-run the generator after each
  `git pull` of the target, and serve the output dir with any static file server (e.g. caddy/nginx).
- Rollback is trivial: the only artifact written is the output HTML; delete it.

## Architecture (for contributing agents)

```
src/model.ts      # Stage/CardStatus/Card/StateModel + STAGE_ORDER/CARD_STATUSES (no fs/render/cli)
src/parse.ts      # read-only fs projection: .pipeline/ -> StateModel — ALL business rules live here
src/frontmatter.ts# minimal scalar frontmatter helper (no fs)
src/render.ts     # (card 02) StateModel -> HTML string; dumb shell, no fs / no business rules
src/cli.ts        # (card 03) argv + output write; wires parse -> render -> board.html
```

Design law: **logic in `parse`, dumb `render`.** `render`/`cli` must not read files, infer state,
discover/filter cards, or regroup lanes. Full contract: `.pipeline/dashboard/PRD.md`, boundaries +
edge rules: `.pipeline/dashboard/arch.md`, glossary: `.pipeline/dashboard/CONTEXT.md`, binding
decisions: `.pipeline/dashboard/docs/adr/*`.

## How this repo is built (it is a pipeline target)

`.pipeline/` here is the **state bus**, not config: `current.json` (pointer) + `dashboard/tasks/NN.md`
(cards) + `dashboard/reviews/*`. The protocol that drives it (the `pipeline-*` shim, freeze gate,
handoff format) is **`CONTRACT.md` in `jackypanster/pipeline`** — read it there before acting as any
stage. To contribute, run the pipeline stages (prd/arch/task/impl/review); do **not** hand-edit work
out of band.

## Guardrails for agents (hard rules)

- **Read-only at runtime**: the tool must never write inside an observed repo's `.pipeline/`.
- **Never edit frozen spec-paths** of a card you are implementing (e.g. card 01's `test/parse.test.ts`
  + `test/fixtures/`). If a spec looks wrong, route back to `pipeline-task` to re-freeze — never patch
  the frozen test from impl.
- **Only `pipeline-review` merges, and only after explicit human confirmation.** Never auto-merge.
- **Stay in your stage's write-set** (see `CONTRACT.md`). Metadata (`.pipeline/**`) goes to trunk;
  reviewed code goes on a `feat/<feature>` branch via PR.
- **The `journal.md` tail is the run-state authority** (per the contract); `current.json.stage` is a
  fast cache used only as a fallback when no journal exists. On disagreement the journal wins and the
  board warns. Do not infer stage from artifact *presence* — read the journal's explicit log. (See
  ADR 0006, superseding 0003.)
