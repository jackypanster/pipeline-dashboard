# Review 01 — card 01 usage line on argument errors

Verdict: approved, awaiting explicit human merge confirmation.

## Review surface

- PR: `jackypanster/pipeline-dashboard#8`.
- PR head: `c0961d4de7893bb9a49e872a88447f9b54b3908f`.
- Scope: quick and on target — `src/cli.ts` only, 10 additions and 3 deletions.
- Findings: none.

## Gates

- Freeze gate passed from `c6a9041` to the PR head: `test/usage.spec.test.ts` was untouched.
- Product-path gate passed: the PR changes only `src/cli.ts`; the `.pipeline` write guard and catch
  path are byte-identical.
- Full verification passed in an isolated detached worktree:
  `npm run build && npm test` — 7 files, 63 tests passed, including the frozen usage spec 3/3.
- Direct CLI runtime passed for no args, unknown arg, and `--out` without a value: each exited 1,
  wrote the exact usage line to stderr, and wrote zero stdout bytes. A valid render exited 0 with
  zero stdout/stderr bytes and produced the board.
- Packaged install smoke passed: the tarball contained the executable `dist/cli.js`, a fresh local
  install exposed `pipeline-dashboard`, and invoking that bin with no args exited 1 with zero stdout
  and the exact usage line on stderr.
- GitHub: PR is open and mergeable; CodeRabbit status is successful.

The Gemini suggestion to treat `--help` as an argument error is outside this feature: the PRD
explicitly lists `--help` under Non-scope. No merge was performed; human confirmation remains
mandatory.
