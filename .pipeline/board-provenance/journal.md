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
