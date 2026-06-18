---
id: "03"
title: cli.ts — local path arg -> board.html
status: in-progress
attempts: 0
verify: npm test
spec-paths:
  - test/cli.test.ts
impl-paths:
  - src/cli.ts
spec-rev: bdf5b427c87c945b94a6fdc79f9d79ee5604e232
---

# Card 03 — CLI entrypoint (thin shell)

## Outcome

`src/cli.ts` wires `parsePipeline(<target>/.pipeline)` -> `renderBoard(state)` -> writes `board.html`.
`npm test` green (all three suites: parse + render + cli).

## API contract (the frozen test imports these from `../src/cli.js`, spec-rev bdf5b42)

- `export function buildBoard(targetRepoPath: string): string`
  Reads `<targetRepoPath>/.pipeline` via `parsePipeline`, returns `renderBoard(state)`. No file write.
- `export function run(args: string[]): number`
  `args` are the CLI args (e.g. `[targetPath, "--out", file]`). Required first arg = target repo path;
  optional `--out <file>` (default `board.html` in cwd). Calls `buildBoard`, writes HTML to the output
  path, returns an exit code.
  - Missing target path arg -> return non-zero (usage error).
  - Malformed/empty observed pipeline data is NON-fatal -> return 0 and still write a board (with
    warnings, via the parser's empty StateModel). Non-zero is ONLY for CLI usage / output-write errors.
  - **Read-only guarantee**: never creates/modifies anything inside `<target>/.pipeline/`. The only
    write is the output HTML at the resolved out path.

(A `process.argv`-based entry that calls `run(process.argv.slice(2))` and `process.exit(code)` may be
added for real CLI use, but the freeze test drives `run`/`buildBoard` directly.)

## Scope (impl-paths only)

- `src/cli.ts` — argv/path handling + output write only. No business rules (those live in `parse.ts`).
  Import `parsePipeline` from `./parse.js`, `renderBoard` from `./render.js`.

## Freeze note

`test/cli.test.ts` is frozen at `spec-rev` above; do NOT edit it from impl. Do NOT touch card 01/02
specs (`test/parse.test.ts`, `test/fixtures/`, `test/render.test.ts`) or `src/parse|model|frontmatter|render`.

## Verification

```bash
npm test
# manual: node -e "require('./src/cli.js')... " or an argv entry, against this repo's own .pipeline -> open board.html
```
