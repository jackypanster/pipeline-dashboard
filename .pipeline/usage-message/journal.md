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

## seq=4 · 2026-07-12T02:58:51Z · impl→review · completed · by=pi
done:   Card 01 implemented on feat/usage-message (commit c0961d4) — USAGE const + usageError() routing the three argument-error return-1 sites in src/cli.ts (no target / unknown arg / --out missing value); guard and catch return-1 untouched; stderr only; exit codes unchanged; valid runs byte-identical. Card verify `npm run build && npm test -- usage` 3/3 green; full `npm run build && npm test` 7 files / 63 tests green. No forge token available — branch pushed, PR must be opened manually.
output: src/cli.ts (c0961d4 @ feat/usage-message)
--- handoff ---
>>> NEXT
Run pipeline-review. repo=https://github.com/jackypanster/pipeline-dashboard branch=main
Review the complete feature on feat/usage-message (base main). Card 01 is status=review, spec-rev c6a9041; this is the only card, so review runs once on the whole feature. Open the PR manually first (no forge token this run): https://github.com/jackypanster/pipeline-dashboard/pull/new/feat/usage-message . Freeze gate: spec-paths test/usage.spec.test.ts unchanged; only src/cli.ts touched on the branch; full suite already 63/63 green locally.
<<< END

## seq=5 · 2026-07-12T03:16:12Z · review→review · completed · by=codex-gpt-5
done:   review verdict approved at PR head c0961d4; freeze/product-path gates passed, 63/63 full verify green, direct CLI argument-error/valid-output contracts passed, and packaged-install bin smoke passed; awaiting explicit human merge confirmation.
output: .pipeline/usage-message/reviews/review-01.md
--- handoff ---
>>> NEXT
Resume pipeline-review only after the human explicitly confirms merging PR #8.
repo=https://github.com/jackypanster/pipeline-dashboard branch=feat/usage-message pr=https://github.com/jackypanster/pipeline-dashboard/pull/8 card=01
First: git pull --rebase; read AGENTS.md, .pipeline/usage-message/reviews/review-01.md, the card, and this journal tail.
Your task:
  1. Require explicit human confirmation to merge PR #8; without it, stop and ask.
  2. Re-read PR #8 and ensure its head is still c0961d4de7893bb9a49e872a88447f9b54b3908f, card 01 is review, and checks remain green. If the head changed, re-run all review gates.
  3. On confirmation, squash-merge PR #8 through GitHub and delete the merged feature branch; never perform a local non-PR merge.
  4. After merge, set card 01 status to done and .pipeline/current.json stage to done; set current.json.pr to the merged PR URL; append the final review→done journal entry, commit the metadata once, and push main.
Feature gotchas: preserve the untracked repository-root board.html; frozen test/usage.spec.test.ts stays untouched; `--help` is explicitly Non-scope; merge is incomplete until PR merge, card/current state, final journal entry, metadata commit, push, and remote branch deletion all succeed.
Done when: PR #8 is squash-merged only after explicit human confirmation and all terminal metadata is pushed.
<<< END
