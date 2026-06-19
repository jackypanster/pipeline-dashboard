---
id: "04"
title: docs realign — ADR 0006 + CONTEXT/PRD/arch/AGENTS/README
status: done
attempts: 1
verify: npm test
spec-paths:
impl-paths: .pipeline/dashboard/docs/adr/0006-journal-tail-is-stage-authority.md, .pipeline/dashboard/docs/adr/0003-current-json-stage-authority.md, .pipeline/dashboard/CONTEXT.md, .pipeline/dashboard/PRD.md, .pipeline/dashboard/arch.md, AGENTS.md, README.md, .gitignore
---
# docs realign — ADR 0006 + live docs

Author ADR 0006 (supersede 0003); realign every live doc agents are told to read so none points back
to the old `current.json.stage` authority. attempts=1: review rounds 1–2 caught remaining stale
authority text in PRD/arch and then in CONTEXT.md (a doc AGENTS mandates reading), plus the
`StateModel.journal` "seq ascending" comment. Also ignore `.codegraph/`.
