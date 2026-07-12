# PRD — usage-message

`pipeline-dashboard` with bad/missing arguments exits 1 with ZERO output (📖 src/cli.ts run()
returns 1 silently on every arg error) — a first-run user gets no clue. Print a usage line to
stderr for ARGUMENT errors. Chosen 2026-07-12 as the orca-transport live-drill feature
(✅ human-approved plan P3); also a real first-run UX gap.

## Behaviour
- Missing target repo, unknown flag, or `--out` without a value → stderr line:
  `Usage: pipeline-dashboard <target-repo> [--out <board.html>]`, exit code unchanged (1).
- Valid invocations: byte-identical behavior (stdout stays empty; board written as today).
- Out-inside-.pipeline guard and render failures: unchanged (out of scope).

## Success criteria
1. `node dist/cli.js` (no args) → exit 1 + stderr contains `Usage: pipeline-dashboard`.
2. `node dist/cli.js <repo> --bogus` → same.
3. Existing suite stays green (67 tests incl. frozen parse/provenance specs).

## Non-scope
--help flag, colored output, argument parsing rewrite.

## Decisions
1. stderr not stdout (stdout is reserved; scripts may parse it) — 📖 code-verified convention.
2. Exit code stays 1 (no 2-for-usage split; keep the existing contract) — ⚠️ assumed minimal.
3. One card (single observable behavior) — ✅ human-approved drill scope.
