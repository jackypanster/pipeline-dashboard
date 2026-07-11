---
id: "01"
title: Provenance footer + executable bin
status: review
attempts: 0
spec-rev: 99ac7e1
verify: npm run build && npm test -- provenance
spec-paths: test/provenance.spec.test.ts
impl-paths: src/provenance.ts, src/render.ts, src/cli.ts, package.json
---
# Provenance footer + executable bin

New impure edge module `src/provenance.ts` — `collectProvenance(repoPath: string, now: Date)` →
`Provenance { generatedAt, source, head }`: `generatedAt` = seconds-precision UTC ISO (millis
truncated), `source` = `resolve(repoPath)`, `head` = `{ sha, branch | null } | null` via two
read-only `git rev-parse` calls (`--short HEAD`, `--abbrev-ref HEAD`) through `execFileSync`
(no shell, stderr suppressed); ANY failure → `head: null`; abbrev-ref literal `"HEAD"` →
`branch: null` (detached).

`renderBoard(state, provenance?)` gains an OPTIONAL 2nd param appending the footer
`generated <ts> · source <path> · HEAD <sha> (<branch>)` (` · ` is U+00B7); `head: null` omits the
HEAD segment; `branch: null` renders `(detached)`; no param → output unchanged (the 14 existing
render tests pin this).

`src/cli.ts` line 1 gains `#!/usr/bin/env node`; `buildBoard` collects provenance
(`new Date()` at the shell edge) and passes it down. The build must leave `dist/cli.js` directly
executable — shebang survives tsc (probed, arch.md), the exec bit is the build script's job
(`package.json` is in impl-paths).

Design: `.pipeline/board-provenance/arch.md` + ADR 0007. parse/model/journal/frontmatter are
OUT of impl-paths by design — any diff there is a review reject.

## Freeze coverage

Frozen: `collectProvenance` on real git / non-git / detached temp repos (no mocks); footer format,
degrade, and optionality; built-artifact executability (shebang line + direct exec of
`dist/cli.js`). NOT frozen: `npm link` end-to-end UX — review verifies by hand
(`npm link && pipeline-dashboard test/fixtures/happy --out /tmp/b.html`); byte-identical
no-param render is guarded by the EXISTING render tests via full-verify, not re-frozen here.
