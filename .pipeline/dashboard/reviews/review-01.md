# Review — card 01 (parse -> StateModel), PR #1

**Verdict: APPROVED** — pending explicit human merge confirmation (merge gate is human-only).

## Deterministic gates

| Gate | Result |
|---|---|
| Freeze gate `git diff 65f28e4 b2533cf -- test/parse.test.ts test/fixtures/` | **empty** ✓ (spec untouched) |
| `npm test` on PR head `b2533cf` | **14/14 green** ✓ |
| PR diff scope | only `src/model.ts` (+26), `src/parse.ts` (+218), `src/frontmatter.ts` (+65) ✓ |
| `spec-paths ∩ impl-paths = ∅` | ✓ (spec under `test/`, impl under `src/`) |

## Semantic review

All card-01 rules correctly implemented:

- `current.json` read; `pr:"none"`/empty/non-string → `null` (`parsePr`).
- `current.json.stage` is the authority; invalid/missing stage → warn + fall back to `prd`. No stage
  inference from artifacts.
- Reads only `.pipeline/<feature>/tasks/*.md`; other feature dirs ignored.
- Title fallback chain: frontmatter `title` → first H1 → filename.
- `attempts` defaults to 0; non-integer/negative → warn + 0 (`parseAttempts` is robust).
- `isBlocked = status === "blocked" || attempts >= 3`, lane grouping stays by textual status.
- Invalid status → warn + omit from both `cards` and `lanes`.
- `lanes` always has all five keys incl. `"in-progress"`; `stageOrder` is the fixed six.
- Missing/malformed/empty `.pipeline` is non-fatal → valid empty `StateModel` + warnings.

## ADR compliance

0001 TS+vitest ✓ · 0002 local-path input (`parsePipeline(<dir>/.pipeline)`) ✓ · 0003 stage authority ✓ ·
0004 logic-in-parse / dumb-render ✓ (no rendering in this card) · 0005 synthetic fixtures ✓.

## Findings (non-blocking)

- **ADVISORY** — `frontmatter.ts` is a deliberately minimal scalar-only parser (no YAML lists / nesting).
  It correctly extracts the StateModel fields it needs (`id`/`title`/`status`/`attempts`/`spec-rev`) and
  safely skips list lines (`spec-paths`, `impl-paths`) because the dashboard parser never consumes them.
  Note for the future: if a StateModel field ever needs a YAML list/nested value, this parser must be
  extended (it would silently produce `""`).
- **NIT** — `sortedMarkdownFiles` sorts filenames and `parsePipeline` re-sorts `cards` by id; redundant
  but harmless (both numeric-aware).

Neither finding blocks merge. The advisory is a bounded, documented limitation, not a defect.

## Merge gate

Awaiting explicit human confirmation. On confirm: squash-merge PR #1 → `main`, set card 01
`status: done` on trunk, then hand off to `pipeline-impl` for card 02.
