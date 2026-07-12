# run journal — usage-message

## seq=1 · 2026-07-12T02:53:18Z · prd→arch · completed · by=claude-fable-5
done:   Scoped the silent-arg-failure fix: usage line on stderr for argument errors, exit code unchanged; valid paths byte-identical. Doubles as the orca-transport live drill (pi=impl via Orca, codex=review via one-key relay).
output: .pipeline/usage-message/PRD.md
--- handoff ---
>>> NEXT
Run pipeline-arch. repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none
Read PRD.md + src/cli.ts run(); pin where the usage print lives so every arg-error path shares one line.
<<< END
