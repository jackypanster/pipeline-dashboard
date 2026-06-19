---
id: "01"
title: Journal parser + StateModel fields
status: done
attempts: 0
spec-rev: f5e6a49
verify: npm test -- journal
spec-paths: test/journal.test.ts, test/fixtures/journal-*, test/fixtures/no-journal
impl-paths: src/journal.ts, src/model.ts
---
# Journal parser + StateModel fields

Pure `parseJournal(content, warnings)` in `src/journal.ts` (no fs): split on `## seq=`, parse the
header, `done`/`output`/handoff, `nextCommand`. Preserve file/append order; warn on non-monotonic
`seq`; skip malformed entries. Add `JournalEntry` + the additive `StateModel` journal fields.
