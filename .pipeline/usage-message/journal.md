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

## seq=3 · 2026-07-12T02:54:31Z · task→impl · completed · by=claude-fable-5
done:   ONE card frozen at spec-rev=c6a9041 — test/usage.spec.test.ts (2 assertion-red: no-args + unknown-flag usage line; 1 green pin: valid render stays silent). Runtime-red, no stubs needed; suite otherwise green.
output: test/usage.spec.test.ts, .pipeline/usage-message/tasks/01.md
--- handoff ---
>>> NEXT
Run pipeline-impl.
repo=https://github.com/jackypanster/pipeline-dashboard branch=main pr=none card=01
Your task: git pull --rebase; branch feat/usage-message off main; implement per the card (src/cli.ts ONLY); make `npm run build && npm test -- usage` green (3/3), then full `npm run build && npm test` green; push; open a PR to main; flip card 01 -> review on trunk; APPEND your journal entry AT THE FILE END of .pipeline/usage-message/journal.md (append == >> at the END; the physically-last entry is the authority; header format EXACTLY: ## seq=4 · <ISO-8601 UTC> · impl→review · completed · by=<your tag> — no spaces around the arrow) + commit metadata once + push trunk. The run is INCOMPLETE until the remote journal's physically-last entry is yours.
Feature gotchas: never touch test/usage.spec.test.ts (frozen, spec-rev=c6a9041) nor src/parse.ts, src/model.ts, src/journal.ts, src/frontmatter.ts, src/render.ts, src/provenance.ts; stderr only, stdout stays reserved; exit codes unchanged.
<<< END
