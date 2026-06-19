---
id: "03"
title: render — live banner, blocked banner, timeline
status: done
attempts: 1
spec-rev: f5e6a49
verify: npm test -- render
spec-paths: test/render.test.ts
impl-paths: src/render.ts
---
# render — live banner, blocked banner, timeline

Dumb-shell additions consuming `StateModel`: live banner (when `stageSource==="journal"`), feature
blocked banner (reports as evidence), run-journal timeline. attempts=1: review round 3 fixed the live
marker to be index-based (physical last) instead of `seq === lastSeq`, since duplicate `seq` is allowed;
added a duplicate-seq regression test.
