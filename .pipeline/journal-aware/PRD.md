# PRD — journal-aware dashboard (feature: journal-aware)

## Problem

The upstream `jackypanster/pipeline` contract evolved: `journal.md`'s append-only **tail** is now the
run-state authority, and `current.json.stage` is only a fast cache ("on disagreement the journal tail
wins"). The dashboard was built against the older rule — it rendered the cache and even codified the
cache as authority (ADR 0003). It also rendered none of the journal, so the operator could not see the
single richest artifact: who ran each stage, what transitioned, what failed, and what runs next.

## Users

- **Primary**: the human operator relaying handoffs — wants "where is it, who touched it, what's next,
  is anything blocked?" at a glance.
- **Secondary**: any cold agent/LLM resuming a run from the rendered state.

## Scope

1. **Stage authority = journal tail.** Derive the feature stage from the journal tail; fall back to
   `current.json.stage` only when no journal exists; surface a `stage drift` warning on disagreement.
2. **Run-journal timeline.** Render each entry: `seq`, `from→to`, status, `by=<bot/LLM>`, `done`,
   `output`, and the handoff (collapsed). The physically-last entry is marked live.
3. **Feature-level blocked.** A banner when the tail is `failed`/`blocked` or routed `→hunt`; surface
   `reviews/integration-NN.md` incident reports as evidence **when blocked** (presence alone never
   triggers a block — reports are append-only and survive recovery).
4. **Live banner.** Tail status + next command + who ran it.

## Non-scope

- ❌ No write actions; read-only always (unchanged).
- ❌ No multi-feature/historical board; still one feature by `current.json.feature`.
- ❌ No forge/PR/CI enrichment.
- ❌ Journal is **optional** — a missing/malformed journal degrades to the cache, never throws.

## Key decisions

1. **Journal tail is the authority** (ADR 0006, superseding 0003); `current.json.stage` is a fallback
   cache.
2. **Additive `StateModel`** — new fields only, so existing field-level freeze tests (card 01) are
   unaffected; no re-freeze.
3. **Tail = physically-last entry in file/append order**, not max-`seq`; non-monotonic `seq` warns,
   never reorders.
4. **Feature-blocked is driven by the tail only**, not by incident-report file presence.
5. **Logic in `parse`, dumb `render`** — unchanged design law; all new derivation lives in `parse`.

## Acceptance criteria

1. `npm test` green, including journal fixtures (happy/drift/blocked/integration-incident/
   incident-recovered/no-journal/malformed).
2. Rendering a journal repo shows the live banner + timeline; a `→hunt`/`failed` tail shows the blocked
   banner; a recovered tail with a lingering report does **not**.
3. A repo with no journal renders exactly as before (regression-safe) with a "no journal" warning.

## Most fragile assumption

This assumes real runs reliably emit `journal.md`. They may not (this very feature was built directly,
without the relayed shim). Mitigation: the journal is optional — absence degrades to the `current.json`
cache and today's behavior, so the tool is never worse than before.
