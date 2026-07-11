# Review 01 — card 01 provenance footer + executable bin

Verdict: changes requested.

## Gates

- PR head reviewed: `e690e75daf19355168c021d9fc2997729dc31dc6`.
- Freeze gate passed: `git diff 99ac7e1 e690e75 -- test/provenance.spec.test.ts` was empty.
- Boundary gate passed: `src/parse.ts`, `src/model.ts`, `src/journal.ts`, and
  `src/frontmatter.ts` had zero diff from `99ac7e1` to the PR head.
- Full verification passed in an isolated detached worktree: `npm run build && npm test` — 6 files,
  54 tests passed.
- npm-link UX failed: `npm link && pipeline-dashboard test/fixtures/happy --out /tmp/b.html`
  returned exit 0 but did not create `/tmp/b.html`.

## Finding

- High — `src/cli.ts:59`: npm installs the bin as a symlink
  (`/opt/homebrew/bin/pipeline-dashboard` → the package's `dist/cli.js`). Node preserves that symlink
  spelling in `process.argv[1]` while `fileURLToPath(import.meta.url)` identifies the real module path,
  so the exact-string entrypoint guard is false. `run()` never executes, producing a silent exit-0
  no-op. Make the guard symlink-safe and repeat the exact npm-link hand check, including asserting the
  output file exists.

No other semantic findings. No dependency or lockfile changes. The temporary npm link and detached
review worktree were removed after verification.
