---
id: "01"
title: Drift predicate — membership over the tail transition
status: todo
attempts: 0
spec-rev: bc59f1d
verify: npm run build && npm test -- journal
spec-paths: test/journal.test.ts, test/fixtures/journal-drift, test/fixtures/journal-cache-from, test/fixtures/journal-rejection, test/fixtures/journal-tail-nonstage
impl-paths: src/parse.ts
---
# Drift predicate — membership over the tail transition

Swap ONLY the drift predicate inside `resolveStage` (src/parse.ts:139-167), per arch.md + ADR 0008:

```ts
const members = [tail.from, tail.to].filter(isStage);
// warn ⇔ members.length > 0 && !members.includes(cacheStage)
```

Display-candidate selection (tail.to → tail.from → cache), `stageSource`, and the warning message
`stage drift: current.json=<cache>, journal=<candidate> (journal tail wins)` stay EXACTLY as they
are. Expected product diff: a handful of lines in one function, nothing else.

Red state at spec-rev bc59f1d: exactly one failing assertion — `journal-cache-from` (cache=arch,
tail `arch→task`, the compliant most-recently-completed state) must render WITHOUT a drift
warning; current code warns. The other 16 journal tests (incl. the redefined genuinely-stale
`journal-drift`, rejection/re-run/done/hunt/corrupt-tail pins) are green before AND after — they
are regression guards, do not "fix" them.

## Freeze coverage

Everything meaningful is frozen in spec-paths: the full membership state space (7 real-trajectory
classes + corrupt-tail boundary), the stale-warn case, display fallback, and featureBlocked
interplay. NOT frozen: nothing — this card has no by-hand review step; review's full-verify plus
the diff-confinement check (product diff = src/parse.ts only) covers it. This is a sanctioned
RE-FREEZE of journal-aware's spec surface via this feature's task stage (PRD §Scope legality note);
the new spec-rev supersedes f5e6a49 for test/journal.test.ts.
