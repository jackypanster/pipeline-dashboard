# arch — usage-message

One function, one constant, zero structural change. src/cli.ts `run()` today returns 1 from
four argument-error sites (no target, unknown arg, --out without value ×1, plus the
out-inside-.pipeline guard which is NOT an arg error and stays silent by design).

## Shape
```ts
const USAGE = "Usage: pipeline-dashboard <target-repo> [--out <board.html>]";
function usageError(): number { console.error(USAGE); return 1; }
// run(): the three ARGUMENT-error `return 1` sites become `return usageError()`.
// The isInsidePipelineDir guard and the catch path stay EXACTLY as they are.
```
- stderr via console.error (stdout reserved).
- Exit codes unchanged everywhere.
- Settled PRD ⚠️#2: keep exit 1 (no new code space).

## Test surface (task freezes)
tests/usage.spec.test.ts — spawn node dist/cli.js: (a) no args → exit 1 + stderr contains
"Usage: pipeline-dashboard"; (b) `<fixture> --bogus` → same; (c) happy render unchanged:
`<fixture> --out <tmp>` exit 0 + stderr does NOT contain "Usage:". impl-paths: src/cli.ts only.
