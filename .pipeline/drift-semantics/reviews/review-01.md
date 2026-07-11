# Review 01 — card 01 drift predicate

Verdict: approved, awaiting explicit human merge confirmation.

## Review surface

- PR: `jackypanster/pipeline-dashboard#7`.
- PR head: `a39e4ba2efcea002e5b1993f3b6227f868432f59`.
- Scope: quick and on target — `src/parse.ts` only, 4 additions and 1 deletion.
- Findings: none.

## Gates

- Freeze gate passed from `bc59f1d` to the PR head: `test/journal.test.ts` and all four frozen
  fixture paths were untouched.
- Protected source boundary passed: `src/model.ts`, `src/journal.ts`, `src/frontmatter.ts`,
  `src/render.ts`, `src/cli.ts`, and `src/provenance.ts` had zero diff.
- `spec-paths ∩ impl-paths` is empty.
- Candidate selection, `stageSource`, feature-blocked derivation, and warning text are unchanged.
- Full verification passed in an isolated detached worktree:
  `npm run build && npm test` — 6 files, 60 tests passed, including all 17 journal tests.
- GitHub: PR open and mergeable; CodeRabbit successful.

The implementation matches ADR 0008: drift warns only when at least one valid Stage transition member
exists and the cache matches neither `tail.from` nor `tail.to`.

No merge performed. Human confirmation remains mandatory.
