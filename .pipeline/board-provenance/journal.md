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
