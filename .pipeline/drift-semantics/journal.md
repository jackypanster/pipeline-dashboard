# run journal — drift-semantics

## seq=1 · 2026-07-11T07:04:39Z · prd→arch · completed · by=claude-fable-5
done:   PRD written and human-grilled — no-drift predicate becomes membership cache ∈ {tail.from, tail.to}, data-verified against the full real board-provenance trajectory (7 cache×tail pairs incl. the seq=5 rejection state that falsifies the strict cache==from rule); direction A (dashboard-only) human-confirmed over changing CONTRACT/shims; journal.test.ts re-freeze legality routed through this feature's own task stage.
output: .pipeline/drift-semantics/PRD.md
--- handoff ---
>>> NEXT
Run pipeline-arch. Read PRD.md, grill the architecture against the codebase.
repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none
Your task: pin the exact drift predicate inside resolveStage (src/parse.ts:139-167) — membership over valid-Stage members of {tail.from, tail.to} — WITHOUT changing the display-candidate selection; settle PRD ⚠️ rows 4-6 (journal-drift fixture value, corrupt-tail no-warning fallback order, warning message wording); decide how test/journal.test.ts drift cases are restructured for the task-stage re-freeze (the 7-row real-trajectory table in PRD.md should become fixture-backed cases).
Feature gotchas: test/journal.test.ts is journal-aware's frozen spec — it may ONLY change via this feature's own pipeline-task freeze commit (new spec-rev), impl never touches it; boards rendered from THIS feature's mid-flight state will show the very false warning being fixed (self-demonstrating, not a regression); displayed stage must stay tail.to-with-from-fallback (CONTRACT:260); provenance footer (shipped) untouched.
<<< END
