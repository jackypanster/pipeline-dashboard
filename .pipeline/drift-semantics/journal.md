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

## seq=3 · 2026-07-11T07:33:40Z · task→impl · completed · by=claude-fable-5
done:   ONE card frozen — 01 drift predicate (membership over tail transition). Spec re-freeze: journal.test.ts +43 lines (new ADR 0008 describe, 6 its; old drift test byte-identical, its fixture redefined to cache=prd), 3 new fixture dirs (journal-cache-from = old drift content verbatim, journal-rejection, journal-tail-nonstage). Red = exactly ONE assertion (cache==from must not warn — the bug); 59/60 suite-wide, zero cross-file fallout. spec-rev=bc59f1d (supersedes f5e6a49 for journal.test.ts).
output: test/journal.test.ts, test/fixtures/journal-*, .pipeline/drift-semantics/tasks/01-drift-predicate.md
--- handoff ---
>>> NEXT
Run pipeline-impl.
repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none card=01
Your task: branch feat/drift-semantics off main; make `npm run build && npm test -- journal` green by swapping ONLY the drift predicate inside resolveStage (src/parse.ts:139-167) per the card + ADR 0008: members = [tail.from, tail.to].filter(isStage); warn ⇔ members non-empty ∧ cache ∉ members. Keep display-candidate selection, stageSource, and the warning message text EXACTLY unchanged. Then full-verify `npm run build && npm test` (60 tests) green. Open a PR to main. NEVER touch spec-paths (test/journal.test.ts + the four journal fixtures, spec-rev=bc59f1d) nor src/model.ts, src/journal.ts, src/frontmatter.ts, src/render.ts, src/cli.ts, src/provenance.ts.
Feature gotchas: expected product diff is a handful of lines in ONE function — anything more is scope creep; the 16 green journal tests are regression pins, if one turns red your change is wrong; after green, rendering THIS repo (cache=task, tail task→impl) must show no drift warning — a good live smoke check.
<<< END

## seq=4 · 2026-07-11T07:40:27Z · impl→review · completed · by=grok-4-5
done:   card 01 green — resolveStage drift predicate swapped to membership over {tail.from, tail.to} (ADR 0008); 17/17 journal + 60/60 full suite; live smoke this repo (cache=task, tail task→impl) has no drift warning; PR #7 opened (feat/drift-semantics → main). Product diff = 4 lines in src/parse.ts only.
output: src/parse.ts
--- handoff ---
>>> NEXT
Run pipeline-review.
repo=https://github.com/jackypanster/pipeline-dashboard branch=feat/drift-semantics pr=https://github.com/jackypanster/pipeline-dashboard/pull/7 card=01
Your task: review the diff/PR for card 01 (spec-rev=bc59f1d). Freeze gate: test/journal.test.ts + the four journal fixtures must be untouched. Product diff must be confined to src/parse.ts (ideally only the drift predicate inside resolveStage). Full-verify `npm run build && npm test` (60 tests) green. Only merge after explicit human confirmation.
Feature gotchas: display-candidate / stageSource / warning message text must be unchanged; expected product diff is a handful of lines — anything more is scope creep.
<<< END
