# run journal — board-provenance

## seq=1 · 2026-07-11T05:59:15Z · prd→arch · completed · by=claude-fable-5
done:   PRD written and human-grilled — scope = provenance footer (generated/source/HEAD) + cli shebang; drift off-by-one bug found, human routed it to a SEPARATE next feature; watch/refresh explicitly rejected.
output: .pipeline/board-provenance/PRD.md
--- handoff ---
>>> NEXT
Run pipeline-arch. Read PRD.md, grill the architecture against the codebase.
repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none
Your task: design the provenance plumbing — where the clock + git info enter (cli? render arg?) so parse→StateModel stays frozen and render stays deterministically testable; decide spawn-git vs read-.git (zero runtime deps); confirm tsc preserves the shebang from src/cli.ts into dist/cli.js.
Feature gotchas: do NOT touch resolveStage/drift semantics (separate feature, human-confirmed); the false "stage drift" warning you will see on mid-flight boards is that known bug, not your regression; render tests exist (render.test.ts, 14) — footer must be injectable, no Date.now() buried in render.
<<< END

## seq=2 · 2026-07-11T06:07:05Z · arch→task · completed · by=claude-fable-5
done:   design fixed — impure edge module provenance.ts (execFileSync git ×2, injected clock) → plain Provenance data → renderBoard OPTIONAL 2nd param; parse/StateModel frozen surface zero-touch; shebang survives tsc (probed); reference-behavior table all ✅ probed except git-absent (📖, degrade identical to probed non-git row); ADR 0007 + CONTEXT.md "Provenance" landed; every PRD ⚠️ row settled.
output: .pipeline/board-provenance/arch.md, .pipeline/dashboard/docs/adr/0007-provenance-collected-in-shell.md, .pipeline/dashboard/CONTEXT.md
--- handoff ---
>>> NEXT
Run pipeline-task. Decompose into atomic cards, write a red test per card.
repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none
Your task: read PRD.md + arch.md (same dir). Likely ONE card — provenance module + footer + shebang land as one unit (splitting shebang out is acceptable if you disagree; argue it in the card). Freeze the red test per arch's test-surface sketch: real temp git repos, no mocks; do NOT touch parse fixtures or resolveStage/drift semantics (separate feature). The reference-behavior gate is satisfied (table in arch.md) — you may freeze.
Feature gotchas: renderBoard 2nd param must stay OPTIONAL (14 existing render tests pass unchanged); footer format is human-frozen in PRD Success-1; timestamp = seconds-precision UTC ISO-8601; head=null omits the HEAD segment, detached renders "(detached)".
<<< END

## seq=3 · 2026-07-11T06:13:39Z · task→impl · completed · by=claude-fable-5
done:   ONE card frozen — 01 provenance footer + executable bin. Red spec test/provenance.spec.test.ts (8 tests: 3 collectProvenance on REAL temp git repos, 4 render footer, 1 built-cli direct-exec) — verbatim stub pre-check passed (3 green vs correct stub, 4 assertion-only fails, zero masked errors); red confirmed (unresolved import); 46 existing tests stay green. spec-rev=99ac7e1 (freeze commit).
output: test/provenance.spec.test.ts, .pipeline/board-provenance/tasks/01-provenance-footer.md
--- handoff ---
>>> NEXT
Run pipeline-impl.
repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none card=01
Your task: branch feat/board-provenance off main; make `npm run build && npm test -- provenance` green — create src/provenance.ts, extend renderBoard (OPTIONAL 2nd param), shebang src/cli.ts:1, wire buildBoard, ensure dist/cli.js keeps the exec bit (package.json build script is yours). Then full-verify `npm run build && npm test` must be green (existing 46 incl. 14 render tests pin the no-param output). Open a PR to main. NEVER touch test/provenance.spec.test.ts (frozen, spec-rev=99ac7e1) nor src/parse.ts, src/model.ts, src/journal.ts, src/frontmatter.ts.
Feature gotchas: footer separator is " · " U+00B7; timestamp truncates millis (toISOString → strip .NNN); abbrev-ref literal "HEAD" = detached → branch null; execFileSync no-shell with stderr suppressed; read-only toward the observed repo — never write into it. Freeze coverage note for review: npm-link UX is NOT frozen — verify by hand.
<<< END

## seq=4 · 2026-07-11T06:25:23Z · impl→review · completed · by=grok-4-5
done:   card 01 green — provenance.ts + renderBoard optional footer + cli shebang + chmod build; 8/8 provenance + 54/54 full suite; PR #6 opened (feat/board-provenance → main).
output: src/provenance.ts, src/render.ts, src/cli.ts, package.json
--- handoff ---
>>> NEXT
Run pipeline-review.
repo=https://github.com/jackypanster/pipeline-dashboard branch=feat/board-provenance pr=https://github.com/jackypanster/pipeline-dashboard/pull/6 card=01
Your task: review the diff/PR for card 01 (spec-rev=99ac7e1). Freeze gate: test/provenance.spec.test.ts must be untouched. Confirm parse/model/journal/frontmatter have zero diff. Full-verify `npm run build && npm test` green. Hand-verify npm-link UX (NOT frozen): `npm link && pipeline-dashboard test/fixtures/happy --out /tmp/b.html`. Only merge after explicit human confirmation.
Feature gotchas: footer separator U+00B7; millis truncated; detached→(detached); read-only toward observed repo.
<<< END

## seq=5 · 2026-07-11T06:32:21Z · review→impl · failed · by=codex-gpt-5
done:   review changes-requested — freeze/boundary gates and 54-test full verify passed, but the required npm-link UX silently exited 0 without creating /tmp/b.html because the CLI entrypoint guard is not symlink-safe; card 01 attempts=1, status=todo.
output: .pipeline/board-provenance/reviews/review-01.md, .pipeline/board-provenance/tasks/01-provenance-footer.md
--- handoff ---
>>> NEXT
Run pipeline-impl on a FRESH session (assume you know nothing — rebuild from the repo + CONTRACT.md).
repo=https://github.com/jackypanster/pipeline-dashboard branch=feat/board-provenance pr=https://github.com/jackypanster/pipeline-dashboard/pull/6 card=01
Model: capable-local OK (impl only) — operator assigns the bot; the pipeline can't verify the model.
First: git pull --rebase; load repo config (.env if present, per CONTRACT step 2).
Read for context (before acting):
  - AGENTS.md — repo-wide project conventions
  - .pipeline/board-provenance/PRD.md — what
  - .pipeline/board-provenance/arch.md — how / component boundaries / data flow
  - .pipeline/dashboard/CONTEXT.md — domain glossary + conventions
  - .pipeline/board-provenance/tasks/01-provenance-footer.md — card + required fix
  - .pipeline/board-provenance/reviews/review-01.md — rejection evidence
  - .pipeline/dashboard/docs/adr/0007-provenance-collected-in-shell.md — binding provenance decision
Your task (concrete, numbered):
  1. On feat/board-provenance, fix src/cli.ts's main-module guard so npm's bin symlink invokes run(); never touch test/provenance.spec.test.ts (spec-rev=99ac7e1).
  2. Run npm run build && npm test and require all 54 tests green.
  3. Run npm link && pipeline-dashboard test/fixtures/happy --out /tmp/b.html and assert /tmp/b.html exists and contains the provenance footer; clean up the temporary link.
  4. Push the updated PR branch and set card 01 back to review through pipeline-impl's normal handoff.
Feature gotchas (project-specific traps the next node MUST know):
  - Direct dist/cli.js execution already passes; the failure exists only through npm's symlinked bin path, where process.argv[1] and import.meta.url use different spellings of the same file.
  - Preserve the optional renderBoard provenance parameter, U+00B7 separator, seconds precision, detached label, and read-only observed-repo invariant.
  - parse/model/journal/frontmatter must retain zero product diff; the frozen provenance spec must remain untouched.
Done when: the exact npm-link hand check creates /tmp/b.html, full verification is green, and PR #6 is updated. On success: card 01 → review, then run pipeline-review. On failure: attempts++; >=3 ⇒ blocked ⇒ run pipeline-hunt.
<<< END

## seq=6 · 2026-07-11T06:43:00Z · impl→review · completed · by=grok-4-5
done:   review-01 fix — isMainModule() realpath-compares argv[1] vs import.meta.url so npm bin symlink invokes run(); npm-link hand check writes /tmp/b.html with provenance footer; 54/54 green; PR #6 updated (0927103).
output: src/cli.ts
--- handoff ---
>>> NEXT
Run pipeline-review.
repo=https://github.com/jackypanster/pipeline-dashboard branch=feat/board-provenance pr=https://github.com/jackypanster/pipeline-dashboard/pull/6 card=01
Your task: re-review PR #6 after the symlink-safe entrypoint fix. Freeze gate still applies (test/provenance.spec.test.ts untouched). Full-verify `npm run build && npm test` green. **Required hand check:** `npm link && pipeline-dashboard test/fixtures/happy --out /tmp/b.html` and assert the file exists with provenance footer; then clean up the link. Only merge after explicit human confirmation.
Feature gotchas: the failure was only via npm's symlinked bin path; direct dist/cli.js exec was always fine. Preserve realpath guard.
<<< END
