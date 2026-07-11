# arch — board-provenance

> Stage 2 output (pipeline-arch, 2026-07-11, by=claude-fable-5). Input: `PRD.md` (same dir).
> Every ⚠️ assumed PRD row is settled below; probes are reproducible shell commands.

## Shape (chosen)

```text
observed repo                              dashboard
┌───────────────┐  execFileSync git ×2   ┌─────────────────────────────┐
│ <target>/.git │◄───────────────────────│ src/provenance.ts (NEW)     │
└───────────────┘     read-only          │ collectProvenance(path,now) │
                                         └───────────┬─────────────────┘
                                                     │ Provenance (plain data)
                                                     ▼
  parse(.pipeline) ──► StateModel ──► renderBoard(state, provenance?) ──► board.html
  (FROZEN, zero changes)              (additive OPTIONAL 2nd param)
```

- **`src/provenance.ts` (new, ~40 lines) — the only impure new code.**

  ```ts
  interface Provenance {
    generatedAt: string;                                  // ISO-8601 UTC, seconds precision
    source: string;                                       // absolute path of the observed repo
    head: { sha: string; branch: string | null } | null;  // null = non-git / git unavailable
  }
  collectProvenance(repoPath: string, now: Date): Provenance
  ```

  `generatedAt` = `now.toISOString()` truncated to seconds. `source` = `resolve(repoPath)`.
  `head` via `execFileSync("git", ["-C", path, "rev-parse", …])` — `--short HEAD` then
  `--abbrev-ref HEAD`; any throw → `head: null`. `abbrev-ref` output `"HEAD"` (detached) →
  `branch: null`.

- **`renderBoard(state: StateModel, provenance?: Provenance)`** — footer appended only when the
  param is provided; absent → output byte-identical to today (the 14 existing render tests pass
  unchanged). Footer text: `generated <generatedAt> · source <source>` +
  (`head` ? ` · HEAD <sha> (<branch>)` : nothing); `branch: null` renders `(detached)`.

- **`src/cli.ts`** — line 1 gains `#!/usr/bin/env node` (probed to survive tsc, below);
  `buildBoard` collects provenance (`now = new Date()` at the shell edge) and passes it down.
  No flag changes.

- **`parse.ts` / `model.ts` / `journal.ts` / `frontmatter.ts` — ZERO changes** (freeze surface,
  ADR 0004/0005). Provenance never enters `StateModel`.

## Settled decisions (were ⚠️ in PRD)

| PRD row | Resolution | Evidence |
|---|---|---|
| #4 non-git degrade | `head: null` → footer omits the HEAD segment; **no `warnings[]` entry** — warnings belong to parse→StateModel (frozen; CONTEXT "Dumb render") and provenance must not cross into it | 📖 code-verified (parse.ts owns warnings) |
| #5 timestamp | UTC ISO-8601 **seconds** precision, e.g. `2026-07-11T05:59:15Z` | settled by design |
| detached HEAD (unlisted in PRD) | `--abbrev-ref HEAD` returns literal `HEAD` → render `HEAD <sha> (detached)` | ✅ probed |
| spawn git vs parse `.git` files | `execFileSync` (no shell) against the `git` binary; hand-parsing `.git` rejected — packed-refs, worktrees, gitfile indirection are correctness traps | ADR 0007 |

## Reference-behavior table (external contracts frozen tests can't fully exercise)

| Element | Reference semantics | Our handling | Tier |
|---|---|---|---|
| tsc shebang emission | `#!` at src line 1 is preserved as emitted line 1 (probed: repo tsc 5.7, `module=NodeNext` `target=ES2022`) | shebang lives at `src/cli.ts:1`; build emits executable `dist/cli.js` | ✅ probed |
| `git rev-parse --short HEAD` | prints short sha, exit 0 | `head.sha` | ✅ probed (`2c6c072`) |
| `git rev-parse --abbrev-ref HEAD` | branch name; literal `HEAD` when detached | `head.branch`; `"HEAD"` → `null` → `(detached)` | ✅ probed |
| non-git directory | exit 128, `fatal:` on stderr | try/catch → `head: null`, stderr suppressed | ✅ probed |
| `git` binary absent from PATH | `execFileSync` throws `ENOENT` | same try/catch → `head: null` | 📖 doc-cited (node child_process; not probed — can't unlink git here) |

Risk register: only the git-absent row is unprobed; its failure mode is identical to the probed
non-git row (degrade, never crash, never write).

## Test surface sketch (for pipeline-task to freeze)

- **render**: footer present with provenance / absent without / `(detached)` / `head: null` degrade
  (extends `render.test.ts`).
- **provenance**: REAL temp git repos (`git init` + commit in a tmpdir — no mocks, repo policy):
  sha+branch on normal repo; `head: null` on non-git tmpdir; `branch: null` on detached.
- **bin executability**: after `npm run build`, `head -1 dist/cli.js` is the shebang AND executing
  `dist/cli.js` directly (not via `node`) against a fixture exits 0 (extends
  `test/integration/cli-run.test.ts`).

The freeze gate itself stays parse→StateModel (ADR 0004): none of the above touches parse fixtures.

## Non-goals guard

`resolveStage`/drift semantics untouched — separate feature (PRD Non-scope, human-confirmed). The
false `stage drift` warning visible on mid-flight boards is that pre-existing bug, not a regression
of this feature.
