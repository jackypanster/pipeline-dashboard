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

## seq=2 · 2026-07-11T07:10:25Z · arch→task · completed · by=claude-fable-5
done:   design fixed — drift predicate swap ONLY: members = [tail.from, tail.to].filter(isStage); warn ⇔ members non-empty ∧ cache ∉ members; display/candidate/stageSource/message untouched. PRD ⚠️ rows 4-6 settled (journal-drift→cache=prd; corrupt tail = no warn, code-verified today's fallback; message unchanged). Equivalence classes → fixtures mapped per ADR 0005: 3 new (journal-cache-from = old drift content verbatim, journal-rejection, journal-tail-nonstage), 1 modified (journal-drift), 3 assertion-only. Live false-positive baseline captured. ADR 0008 + CONTEXT.md drift definition landed.
output: .pipeline/drift-semantics/arch.md, .pipeline/dashboard/docs/adr/0008-stage-drift-is-membership-over-tail-transition.md, .pipeline/dashboard/CONTEXT.md
--- handoff ---
>>> NEXT
Run pipeline-task. Decompose into atomic cards, write a red test per card.
repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none
Your task: read PRD.md + arch.md (same dir). Likely ONE card — a single predicate swap + fixture/test re-freeze is one landable unit. This is a RE-FREEZE of journal-aware's spec surface: the freeze commit must contain the restructured test/journal.test.ts drift describe + the 3 new fixture dirs + the modified journal-drift fixture (per arch.md class table), and its sha becomes the new spec-rev. The red state = restructured tests FAIL against current parse.ts (journal-cache-from expects no drift but current code warns). Everything outside the drift describe must stay untouched.
Feature gotchas: verbatim pre-check the restructured spec (stub nothing — parse.ts exists; red must be ASSERTION-level, not resolution-level); journal-happy stays byte-identical; keep the malformed/blocked/parseJournal unit suites untouched; verify command should filter to journal tests; the board rendered mid-flight still shows the old false warning until impl lands.
<<< END
