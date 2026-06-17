---
id: "03"
title: cli.ts — local path arg -> board.html
status: todo
attempts: 0
verify: npm test
spec-paths:
  - test/cli.test.ts
impl-paths:
  - src/cli.ts
spec-rev: pending
---

# Card 03 — CLI entrypoint (thin shell)

## Outcome

`src/cli.ts` parses a required local target-path arg + optional `--out <file>` (default `board.html`
in cwd), calls `parsePipeline(<target>/.pipeline)` then `renderBoard(state)`, writes the HTML to the
output path. Never writes inside the target's `.pipeline/`. Exits non-zero only on CLI usage / output
write errors — NOT on malformed observed pipeline data.

## Scope (impl-paths only)

- `src/cli.ts` — argv/path handling + output write; wires parse -> render -> file. No business rules.

## Freeze note

`test/cli.test.ts` is **smoke-level** (arg parsing, output path, read-only guarantee) and frozen by
pipeline-task when this card becomes active. `spec-rev: pending` until then.

## Verification

```bash
npm test
# manual: node (run cli) against test/fixtures/happy and this repo's own .pipeline, open board.html
```
