# PRD — pipeline-dashboard (feature: dashboard)

## Problem

`jackypanster/pipeline` drives multi-stage agent dev over a `.pipeline/` git+md state bus, relayed
by a human across cold bots. The human has **no at-a-glance view** of where a feature is — they must
`git pull` a target repo and read `current.json` + every `tasks/*.md` by hand. We want a **read-only**
page that renders the pipeline's state so a human (or agent) can triage in 5 seconds.

## Users

- **Primary**: the human operator relaying handoffs — wants "which stage, which cards, anything blocked?"
- **Secondary**: any agent/LLM that wants the pipeline state as a rendered artifact.

## Scope (Phase 1)

Render **one target repo's current feature** as a single static `board.html` showing the pipeline's
**two** state machines:

1. **Feature stage flow** — `prd → arch → task → impl → review → done`, highlighting the current stage.
   (**Superseded by ADR 0006:** the authority is now the `journal.md` tail; `current.json.stage` is only
   a fallback cache when no journal exists. The "do NOT re-derive from artifact *presence*" principle
   still holds — we read the journal's explicit log, not file existence.)
2. **Card status lanes** — `todo / in-progress / review / done / blocked`, each card showing `id`,
   `title`, `attempts` (red when `>= 3`), and `spec-rev` when present.

## Non-scope (explicit)

- ❌ No drag/edit/any write action. No buttons that mutate (merge/retry/re-queue). Read-only, always.
- ❌ No server, no DB, no WebSocket, no auth, no SPA framework.
- ❌ No multi-feature / historical view (deferred Phase 2).
- ❌ No PR/CI enrichment over a forge API (deferred Phase 2).
- ❌ Dashboard never writes into the observed repo's `.pipeline/`.

## Input contract (decided)

CLI takes a **local filesystem path** to a target repo checkout; it reads `<path>/.pipeline/`.
Zero network, zero credentials. (The operator `git pull`s the target repo first, then points the tool
at it.) Output: a static `board.html` (default to repo cwd; allow an `--out <file>` override). A
client-side `<meta http-equiv="refresh">` may be included so re-running the generator refreshes the view.

## Architecture intent (thin shell over testable core)

```
parse(<path>/.pipeline/)  →  StateModel     # PURE, deterministic — the FROZEN-TEST surface
render(StateModel)        →  HTML string     # thin presentation shell — eyeballed at review, NOT frozen
```

The freeze gate (`pipeline-task` red tests) pins `parse → StateModel` only, where there is a right
answer. Rendering correctness is visual and is reviewed by eye in `pipeline-review`. **Keep logic in
`parse`, keep `render` dumb** — this is the load-bearing design choice (a frontend whose value is visual
cannot be guarded by a test gate; so we concentrate the testable truth in parsing/projection).

## StateModel contract (what `parse` returns — the spec `pipeline-task` freezes)

```ts
type CardStatus = "todo" | "in-progress" | "review" | "done" | "blocked";
type Stage = "prd" | "arch" | "task" | "impl" | "review" | "done";

interface Card {
  id: string;          // e.g. "01" (from filename or frontmatter `id`)
  title: string;       // from frontmatter `title`, else first H1, else filename
  status: CardStatus;
  attempts: number;    // frontmatter `attempts`, default 0
  specRev: string | null;   // frontmatter `spec-rev` if present
  isBlocked: boolean;  // status === "blocked" OR attempts >= 3
}

interface StateModel {
  repo: string;        // current.json.repo
  branch: string;      // current.json.branch
  pr: string | null;   // current.json.pr (null when "none"/absent)
  feature: string;     // current.json.feature
  stage: Stage;        // resolved: journal.md tail (authority), else current.json.stage (fallback) — ADR 0006
  stageOrder: Stage[]; // ["prd","arch","task","impl","review","done"] — fixed
  cards: Card[];       // sorted by id ascending
  lanes: Record<CardStatus, Card[]>;  // cards grouped by status, all 5 keys always present
  warnings: string[];  // non-fatal data issues (see error handling)
  // --- journal-aware fields (added per ADR 0006; journal is optional) ---
  journal: JournalEntry[];                      // append-order entries; [] when no journal.md
  stageSource: "journal" | "current.json";      // which source `stage` was resolved from
  liveStatus: "completed" | "failed" | "blocked" | "unknown" | null; // tail status; null if no journal
  nextCommand: string | null;                   // tail handoff's next pipeline command
  by: string | null;                            // who ran the most recent stage; null if no journal
  featureBlocked: boolean;                       // feature-level block (tail failed/blocked or →hunt)
  integrationReports: string[];                  // reviews/integration-NN.md paths (evidence when blocked)
}

// JournalEntry: { seq, timestamp, from, to, status, by, done, output[], handoff, nextCommand }
// Tail = last entry in FILE (append) order — NOT max-seq; non-monotonic seq warns, never reorders.
```

## Error / edge handling (these become the freeze-test fixtures)

- **No `.pipeline/` or no `current.json`** → return a StateModel with `feature: ""`, empty lanes, and a
  `warnings` entry "no active feature"; never throw. (The dashboard's own repo is in this state until
  its first card exists — must render gracefully.)
- **Malformed `current.json`** (bad JSON) → `warnings` entry, treat as no active feature.
- **`pr: "none"` or absent** → `pr: null`.
- **Card missing frontmatter / bad status value** → card lands in a lane only if status is valid; invalid
  status → `warnings` entry + card omitted from lanes (still counted in `cards` with status coerced?
  decide in arch — default: omit from lanes, add warning).
- **`attempts >= 3`** → `isBlocked: true` even if status text isn't "blocked".
- **Multiple `<feature>/` dirs present** → Phase 1 reads ONLY `current.json.feature`'s dir; others ignored.

## Acceptance criteria (Phase 1 — definition of done)

1. `npm test` green: frozen tests over **synthetic fixtures** in `test/fixtures/` covering at least —
   happy path (mixed lanes), a `blocked` card, an `attempts>=3` card, multi-feature dir (only current
   read), missing `current.json`, malformed `current.json`.
2. Running the CLI against a fixture (and against this repo's own `.pipeline/`) emits a `board.html`
   that opens in a browser and visibly shows: the stage flow with current stage highlighted, and the
   five lanes with cards. (Visual check at review.)
3. Read-only: the tool never writes inside the target's `.pipeline/`.

## Key decisions (grilled)

1. **Input = local path arg**, not git URL clone (zero net/creds; operator pulls first).
2. **Phase 1 = current feature only** (matches "one feature in flight"); multi-feature is Phase 2.
3. **Freeze tests = synthetic fixtures** under `test/fixtures/`, not live repo snapshots (deterministic,
   portable, no enterprise-repo access dependency).
4. **`current.json.stage` is authority** for the stage flow; artifact presence does not override it.
   (**Superseded by ADR 0006** — the `journal.md` tail is the authority; `current.json.stage` is a
   fallback cache. Drift between them surfaces as a warning, journal wins.)
5. **Logic in `parse`, dumb `render`** — concentrate frozen truth in the deterministic core.

## Deferred to Phase 2 (independent, ships later)

- Multi-feature + historical board.
- PR/CI status enrichment via `gh` / `gitee-cli` API.
- Client-side auto-refresh against a generated `state.json`.
