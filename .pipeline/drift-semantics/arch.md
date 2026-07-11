# arch — drift-semantics

> Stage 2 output (pipeline-arch, 2026-07-11, by=claude-fable-5). Input: `PRD.md` (same dir).
> Live false-positive baseline captured pre-fix: rendering THIS repo (cache=prd, tail `prd→arch`)
> emits `stage drift: current.json=prd, journal=arch (journal tail wins)` — after the fix that
> exact state must render clean.

## Shape (chosen)

The entire product diff is ONE predicate swap inside `resolveStage` (src/parse.ts:139-167).
Display-candidate selection, `stageSource`, and the warning message format are UNTOUCHED:

```ts
// BEFORE: drift ⇔ candidate !== cacheStage          (false-positives every stage boundary)
// AFTER : drift ⇔ members.length > 0 && !members.includes(cacheStage)
const members = [tail.from, tail.to].filter(isStage); // valid-Stage ends of the tail transition
```

- Warn only when the cache matches NEITHER valid-Stage end — a genuinely stale (≥1 full entry
  behind) or hand-corrupted cache.
- `members` empty (corrupt/hand-edited tail like `x→y`): NO drift warning — drift is undefined
  without a trustworthy tail; display already falls back to the cache (parse.ts:157, unchanged).
- Message stays `stage drift: current.json=<cache>, journal=<candidate> (journal tail wins)` —
  `<candidate>` is always a member when the warning fires, so the text remains truthful.

## Settled decisions (were ⚠️ in PRD)

| PRD row | Resolution | Evidence |
|---|---|---|
| #4 journal-drift fixture value | `current.json.stage: "prd"` vs tail `arch→task` (display assertion `stage=task` unchanged) | mirrors the live baseline above; 📖 board-provenance git-history rows |
| #5 corrupt tail | members empty → no drift warning; display falls back to cache; `stageSource` stays `"journal"` (tail exists) | 📖 code-verified parse.ts:149-158 — this IS today's behavior, predicate preserves it; pinned by new micro-fixture |
| #6 warning message | unchanged format | 📖 code-verified — candidate ∈ members whenever warning fires |

## Equivalence classes → fixtures (ADR 0005: static synthetic fixtures, names map to behavior)

The PRD's 7-row real-trajectory table + 2 boundary classes collapse to:

| class | fixture | action |
|---|---|---|
| cache==from, forward tail (THE false-positive class) | `journal-cache-from` (NEW — content = old `journal-drift` files verbatim: cache=arch, tail `arch→task`) | assert NO drift, display `stage=task` |
| cache==to, forward tail | `journal-happy` (cache=impl, tail `task→impl`) | existing no-drift assertion already pins it |
| cache==to, rejection tail | `journal-rejection` (NEW: cache=impl, tail `review→impl · failed`) | assert NO drift + `featureBlocked=true` + display `stage=impl` |
| from==to==cache, re-run tail | `journal-blocked` (cache=impl, tail `impl→impl · failed`) | ADD no-drift assertion |
| cache==to, terminal done | `journal-incident-recovered` (cache=done, tail `review→done`) | ADD no-drift assertion |
| cache==from, routing to non-Stage (`→hunt`) | `journal-integration-incident` (cache=review, tail `review→hunt`) | ADD no-drift assertion |
| genuinely stale → MUST WARN | `journal-drift` (MODIFIED: stage arch→prd; journal untouched) | keeps asserting warn + display `stage=task` |
| corrupt tail (no valid-Stage end) → no warn | `journal-tail-nonstage` (NEW micro: cache=arch, tail `x→y · completed`) | assert no drift, display falls back to `arch`, `stageSource="journal"` |

Net: 3 new fixture dirs, 1 modified, 3 assertion-only additions. `journal-happy` and all non-drift
suites stay byte-identical.

## Reference-behavior table (the external contract here is the SHIM ecosystem's real write behavior)

| Element | Reference semantics | Our handling | Tier |
|---|---|---|---|
| forward stage completion | shim writes cache = just-completed stage = tail.from (CONTRACT.md:115) | member via `from` | ✅ probed (board-provenance rows seq 1–4, git history `2c6c072..85fddfd`) |
| review rejection | reviewer appends `review→impl · failed`, leaves cache at `impl` = tail.to | member via `to` | ✅ probed (seq=5, no current.json change in that commit) |
| merge/terminal | reviewer writes cache=done with tail `review→done` | member via `to` | ✅ probed (seq=8, `e741942`) |
| hypothetical shim writing a stage OUTSIDE {from,to} | out of contract | warns (accepted residual) | ⚠️ unverified — risk register: such a shim is non-compliant by definition; warning is then correct-by-intent |

## Test surface sketch (for pipeline-task to freeze)

Restructure the drift `describe` in `test/journal.test.ts` (this feature's task stage re-freezes it —
new freeze commit, new `spec-rev`; legality note in PRD §Scope): one `it` per class row above,
fixture-backed per ADR 0005. Everything outside the drift describe (parseJournal unit tests, happy,
blocked, malformed suites) must remain untouched — reviewer checks the test diff is confined to
drift semantics + the new assertions.

## Non-goals guard

Display semantics (tail.to → from fallback → cache), blocked derivation, lanes, provenance footer:
zero diff. `src/parse.ts` outside the predicate lines: zero diff. CONTRACT/shims upstream: zero diff
(direction B rejected; optional one-sentence CONTRACT clarification goes through `pipeline-improve`
later, different repo).
