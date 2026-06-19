---
id: "02"
title: parse — journal tail as stage authority + feature-blocked
status: done
attempts: 1
spec-rev: f5e6a49
verify: npm test -- parse journal
spec-paths: test/journal.test.ts, test/fixtures/journal-drift, test/fixtures/journal-blocked, test/fixtures/journal-integration-incident, test/fixtures/journal-incident-recovered
impl-paths: src/parse.ts
---
# parse — journal tail as stage authority + feature-blocked

Wire the journal into `parsePipeline`: `resolveStage` (tail authority + `stage drift` warning, cache
fallback when no journal), `computeFeatureBlocked` (tail `failed`/`blocked`/`→hunt`),
`findIntegrationReports`. attempts=1: review round 1 corrected the tail to physical-last (not max-seq)
and clarified that incident-report presence is evidence, not a blocked trigger.
