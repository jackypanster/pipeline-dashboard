# Review 02 — card 01 provenance footer + executable bin

Verdict: approved, awaiting explicit human merge confirmation.

## Review surface

- PR: `jackypanster/pipeline-dashboard#6`.
- PR head: `092710398361480291075758d8a4ea9216c6c89d`.
- Scope: quick, on target; the retry delta only makes the CLI entrypoint guard symlink-safe.
- Findings: none.

## Gates

- Freeze gate passed: `git diff 99ac7e1 0927103 -- test/provenance.spec.test.ts` was empty.
- Boundary gate passed: `src/parse.ts`, `src/model.ts`, `src/journal.ts`, and
  `src/frontmatter.ts` had zero diff from `99ac7e1` to the PR head.
- `spec-paths ∩ impl-paths` is empty.
- Full verification passed in an isolated detached worktree:
  `npm run build && npm test` — 6 files, 54 tests passed.
- Installed-runtime hand check passed:
  `npm link && pipeline-dashboard test/fixtures/happy --out /tmp/b.html` exited 0 and created a
  10,206-byte board containing
  `generated 2026-07-11T06:45:28Z · source …/test/fixtures/happy · HEAD 0927103 (detached)`.
- Built CLI begins with `#!/usr/bin/env node` and mode `-rwxr-xr-x`.
- Temporary npm link and detached worktree were removed; `/tmp/b.html` was retained as the requested
  hand-check artifact.

## Review-01 resolution

`src/cli.ts` now resolves both `process.argv[1]` and `fileURLToPath(import.meta.url)` through
`realpathSync` before comparison. This preserves import-without-execution behavior while allowing npm's
symlinked bin path to invoke `run()`.

No merge performed. Human confirmation remains mandatory.
