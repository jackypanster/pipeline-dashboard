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
