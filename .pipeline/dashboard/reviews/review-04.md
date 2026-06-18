# Review — card 04 (deployability / build-run), PR #4

**Verdict: APPROVED** — pending explicit human merge confirmation (merge gate is human-only).
On merge, the dashboard is actually deployable (plain-node CLI), closing the gap dogfood found.

## Deterministic gates

| Gate | Result |
|---|---|
| Freeze gate `git diff d19f32b 6d586ae -- test/integration/cli-run.test.ts` | **empty** ✓ |
| All 3 prior specs frozen (parse/render/cli + fixtures) | **empty** ✓ |
| No `src/*.ts` changes | ✓ |
| `dist/` not committed | ✓ |
| PR diff scope | only `AGENTS.md`, `package.json`, `package-lock.json`, `tsconfig.json` ✓ |
| `npm test` on PR head `6d586ae` | **30/30 green, 4 suites** (incl integration build+run) ✓ |

## Independent verification (not trusting the test)

- `npm run build` (tsc) → exits 0, emits `dist/cli.js`. ✓
- `node dist/cli.js test/fixtures/happy --out /tmp/pr4-board.html` → exit 0, output contains `<html`. ✓
  (Plain Node now runs the CLI — the exact thing that failed before this card.)
- `bin`: `pipeline-dashboard → dist/cli.js` ✓; scripts: `test`, `test:watch`, `build` ✓;
  `@types/node` added to devDeps ✓.

## Semantic review (config/docs only)

- `tsconfig.json`: `module`/`moduleResolution` → `NodeNext`, `types: ["node"]`, `rootDir: src`,
  `include: ["src"]`. tsc now type-checks + emits a runnable ESM build; tests excluded from emit
  (vitest runs them via esbuild, unaffected). Sound.
- `AGENTS.md`: Use/Deploy sections flipped from PLANNED to real (`npm run build` + `node dist/cli.js`
  + `npx pipeline-dashboard`); Build-status table updated (render/cli done + a build/run row). Accurate.
- No product logic touched — cards 01–03 intact.

## Findings (non-blocking)

- **NIT** — `@types/node` is `^25.x` while the runtime is Node 26; types lag the runtime by a major.
  Harmless for this code (only `node:fs`/`node:path`/`process`/`import.meta.url` used).
- **NIT** — AGENTS.md header still calls the repo "under construction (dogfood)"; with card 04 the
  dashboard feature is functionally complete. Cosmetic; optional later tidy.

## Merge gate

Awaiting explicit human confirmation. On confirm: squash-merge PR #4 → `main`, set card 04
`status: done`, advance `current.json.stage` to `done` (all 4 cards done — dashboard truly complete
and deployable).
