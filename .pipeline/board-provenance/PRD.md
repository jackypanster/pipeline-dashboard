# PRD — board-provenance

> Feature: provenance footer on `board.html` + executable bin (shebang).
> Produced by `pipeline-prd` 2026-07-11 (by=claude-fable-5). Audience: the COLD arch node.

## Problem

1. `board.html` is a one-shot static snapshot with no indication of WHEN it was generated or FROM
   WHAT source state. A stale board is indistinguishable from a fresh one — the board never lies,
   but it expires invisibly. (✅ human-confirmed pain, 2026-07-11 consistency review.)
2. `package.json` declares `bin: pipeline-dashboard → dist/cli.js`, but `src/cli.ts:1` (and thus
   `dist/cli.js:1`) lacks a `#!/usr/bin/env node` shebang, so the linked bin is executed as a
   SHELL script — each ESM `import {…}` line invokes ImageMagick's `import`, exit 2. The declared
   bin has never worked. (📖 code-verified: `src/cli.ts:1`; live repro 2026-07-11 via `npm link` +
   direct invocation.)

## Goal

Every rendered board self-identifies its generation moment and source state; the declared bin is
directly executable.

## Success criteria

1. `board.html` renders a provenance footer:
   `generated <ISO-8601 UTC> · source <observed repo path> · HEAD <short-sha> (<branch>)`
2. Non-git observed repo (or `git` unavailable): the HEAD segment is omitted; `generated` +
   `source` still render; the render never crashes on this path.
3. `head -1 dist/cli.js` is `#!/usr/bin/env node`; after `npm link`,
   `pipeline-dashboard <repo> --out <tmp>` exits 0 and writes the board.
4. Existing suite stays green (46/46 as of 799d7a6) + new tests covering footer presence and the
   non-git degrade.
5. Read-only invariant preserved: observing never writes into the target repo (git queries are
   read-only; no fetch/pull).

## Scope

- Provenance footer in the render layer + the plumbing that feeds it (clock + git info must be
  injectable so tests stay deterministic — mechanism is an arch decision).
- Shebang in `src/cli.ts` (must survive `tsc` into `dist/cli.js` — verify, don't assume).
- Tests for both.

## Non-scope

- Watch mode / auto-refresh / server / auto `git pull` — rejected 2026-07-11 (✅ human-confirmed):
  pipeline state only changes at stage-boundary commits; upstream DESIGN.md deliberately has no
  scheduler; this tool stays no-server / no-DB / read-only.
- **Drift-rule off-by-one fix — SEPARATE feature (✅ human-confirmed 2026-07-11, next 立项).**
  Finding, recorded here so it is not lost: CONTRACT.md:115 defines `current.json.stage` as the
  most recently COMPLETED stage (= journal tail's *from*), but the dashboard pins no-drift as
  `stage == tail.to` (`journal.test.ts:91`, `journal-drift` fixture) — so every CONTRACT-compliant
  mid-flight state renders a false "stage drift" warning. Boards rendered from THIS feature's own
  mid-flight state will show that false warning — live evidence, not a regression.
- Dirty-worktree indicator in the footer (⚠️ assumed out for v1 — revisit only if boards get
  shared beyond the operator's machine).

## Decisions (provenance-tagged)

1. Footer format exactly as Success-1. ✅ human-confirmed (2026-07-11 plan approval).
2. Shebang fix in scope. ✅ human-confirmed (grill Q2).
3. Drift fix out of scope → separate feature. ✅ human-confirmed (grill Q1).
4. Non-git degrade = omit the HEAD segment silently (no `warnings[]` entry). ⚠️ assumed — arch may
   promote it to a warning if cheap.
5. Timestamp = UTC ISO-8601, seconds precision. ⚠️ assumed.
6. Git info read read-only from the OBSERVED repo at generation time; **zero new runtime deps**
   (package.json has none today — 📖 code-verified). Spawn `git` vs read `.git` files = arch
   decision.
7. Footer lives in render; `parse → StateModel` freeze surface untouched. 📖 code-verified
   constraint (README: "the freeze gate guards parse → StateModel; render is a thin shell").
