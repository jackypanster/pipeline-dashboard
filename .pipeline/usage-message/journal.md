# run journal — usage-message

## seq=1 · 2026-07-12T02:53:18Z · prd→arch · completed · by=claude-fable-5
done:   Scoped the silent-arg-failure fix: usage line on stderr for argument errors, exit code unchanged; valid paths byte-identical. Doubles as the orca-transport live drill (pi=impl via Orca, codex=review via one-key relay).
output: .pipeline/usage-message/PRD.md
--- handoff ---
>>> NEXT
Run pipeline-arch. repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none
Read PRD.md + src/cli.ts run(); pin where the usage print lives so every arg-error path shares one line.
<<< END

## seq=2 · 2026-07-12T02:53:40Z · arch→task · completed · by=claude-fable-5
done:   design fixed — one USAGE constant + usageError() on the three ARGUMENT-error sites; guard/catch paths untouched; exit codes unchanged; stderr only. PRD ⚠️#2 settled (keep exit 1).
output: .pipeline/usage-message/arch.md
--- handoff ---
>>> NEXT
Run pipeline-task. repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none
ONE card. Freeze tests/usage.spec.test.ts per arch's test surface (runtime-red: stderr is empty today). Card verify: npm run build && npm test -- usage.
<<< END
