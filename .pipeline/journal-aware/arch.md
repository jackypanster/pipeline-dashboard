# Architecture — journal-aware dashboard (feature: journal-aware)

Extends the dashboard's `parse → StateModel → render` pipeline without changing its design law
(**logic in `parse`, dumb `render`**). All new derivation is deterministic and lives in the
freeze-tested core.

## Component changes

```text
src/
  model.ts     # + JournalEntry; + StateModel journal-aware fields (additive)
  journal.ts   # NEW — pure parser: journal.md text → JournalEntry[] (no fs)
  parse.ts     # + readJournal (fs), resolveStage, computeFeatureBlocked, findIntegrationReports
  render.ts    # + live banner, blocked banner, run-journal timeline (dumb)
```

### `model.ts` (additive)

`JournalEntry { seq, timestamp, from, to, status, by, done, output[], handoff, nextCommand }`.
`StateModel` gains `journal[]` (append/file order), `stageSource` (`journal|current.json`),
`liveStatus`, `nextCommand`, `by`, `featureBlocked`, `integrationReports[]`. Additive only — existing
field-level freeze tests stay green.

### `journal.ts` (pure, no fs — mirrors `frontmatter.ts`)

`parseJournal(content, warnings) → JournalEntry[]`:
- Split on `## seq=` headers; parse the header line `seq · ISO · from→to · status · by=` (separator
  ` · ` U+00B7, arrow U+2192).
- Extract `done:` / `output:` lines and the handoff body between `>>> NEXT` and `<<< END`; pull
  `Run pipeline-<x>` as `nextCommand`.
- **Preserve file (append) order.** A non-monotonic `seq` is flagged with a warning and never
  reordered — the physically-last entry is the authoritative tail. Malformed entry → warning + skip.

### `parse.ts` (owns fs + all rules)

- `readJournal(featureDir)` reads `journal.md` if present; absent → warning + `[]`.
- `resolveStage(journal, cacheStage)`: tail `to` if it is a `Stage`, else tail `from` if a `Stage`,
  else the cache; emit `stage drift` when the resolved stage ≠ cache. No journal ⇒ cache, source
  `current.json`.
- `computeFeatureBlocked(tail)`: tail `status ∈ {failed, blocked}` or `to === "hunt"`.
- `findIntegrationReports(featureDir)`: `reviews/integration-*.md` paths (evidence; not a trigger).

### `render.ts` (dumb shell)

Consumes only `StateModel`. Adds: a **live banner** (shown when `stageSource === "journal"`), a
**feature-blocked banner** (shown when `featureBlocked`, listing integration reports as evidence), and
a **run-journal timeline** (one item per entry; the live item is identified by **index** = physical
last, never by `seq`). No fs, no derivation, no mutation.

## Edge decisions (freeze-pinned)

- Journal optional; missing/malformed never throws (degrades to cache).
- Tail = last in file order; duplicate/non-monotonic `seq` warns, render marks live by index.
- Incident-report presence is evidence only; blocked is tail-driven (recovered tail ⇒ not blocked).
- `to`/`from` outside `STAGE_ORDER` (`hunt`/`todo`) are kept raw in the timeline; stage resolution
  falls back to `from`.

## Superseded

ADR 0003 (current.json.stage authority) → **ADR 0006** (journal tail authority). The "do not infer
from artifact *presence*" principle is preserved: we read the journal's explicit log, not file
existence.
