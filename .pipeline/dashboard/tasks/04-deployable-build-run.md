---
id: "04"
title: deployability — build to a plain-node-runnable CLI
status: in-progress
attempts: 0
verify: npm test
spec-paths:
  - test/integration/cli-run.test.ts
impl-paths:
  - package.json
  - package-lock.json
  - tsconfig.json
  - AGENTS.md
spec-rev: d19f32b1e424fff82a66ffeaf482ad9eb687db35
---

# Card 04 — make the CLI runnable under plain node (build/run story)

## Why (the gap dogfood found)

After cards 01–03 the test suite is green but `node src/cli.ts` FAILS: the source uses `.js` import
specifiers (correct for tsc-emitted ESM) but there is **no build step**, and `@types/node` is absent
so `tsc` can't even type-check. The CLI only ran via esbuild/vitest. "Tests green ≠ deployable."

## Outcome

`npm run build` emits a runnable `dist/cli.js`, and `node dist/cli.js <target> --out <file>` writes a
`board.html` — verified by the frozen integration test (`test/integration/cli-run.test.ts`, spec-rev
d19f32b). `npm test` green (4 suites: parse + render + cli + integration).

## Scope (impl-paths only — never touch spec-paths or src/*)

- `package.json` — add `@types/node` (devDep); add `"build": "tsc"` (or equivalent emitting `dist/`);
  add a `"bin"` entry (e.g. `pipeline-dashboard` -> `dist/cli.js`) so `npx pipeline-dashboard <target>`
  works. Keep existing `test` script.
- `package-lock.json` — from `npm install` of `@types/node`.
- `tsconfig.json` — make `tsc` emit a runnable ESM build: add `"node"` to `types`; set
  `moduleResolution`/`module` to an emit-friendly combo (e.g. `nodenext`) so `import.meta.url`,
  `process`, and `node:*` resolve and `.js` specifiers emit correctly to `dist/`. Ensure `vitest`
  still runs (it uses esbuild, not tsc — unaffected).
- `AGENTS.md` — flip the Use / Deploy sections from PLANNED to real, documenting `npm run build` +
  `node dist/cli.js <target> [--out file]` (and the `bin`), and update the Build-status table
  (render/cli now done; add a "build/run" row).

## Constraints

- Do NOT modify product logic in `src/*.ts` (cards 01–03 are done & merged). This card is config/docs
  only. If the entry guard in `src/cli.ts` needs a change to run under node, STOP and route to
  `pipeline-task` — do not edit src under this card.
- Do NOT edit any frozen spec: `test/parse.test.ts`, `test/fixtures/`, `test/render.test.ts`,
  `test/cli.test.ts`, `test/integration/cli-run.test.ts`.
- `dist/` stays gitignored (build output, not committed).

## Verification (must exit 0)

```bash
npm test     # 4 suites incl test/integration/cli-run.test.ts (builds, then runs node dist/cli.js)
```

## Freeze note

`test/integration/cli-run.test.ts` is frozen at `spec-rev` above; do NOT edit it from impl. If the
contract is wrong, route back to `pipeline-task` to re-freeze.
