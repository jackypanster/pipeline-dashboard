# run journal — login

## seq=1 · 2026-06-18T09:00:00Z · prd→arch · completed · by=claude-opus-4-8
done:   PRD landed; problem + scope + acceptance criteria frozen.
output: .pipeline/login/PRD.md
--- handoff ---
>>> NEXT
Run pipeline-arch on a FRESH session.
repo=https://github.com/acme/widget branch=main pr=none
<<< END

## seq=2 · 2026-06-18T10:30:00Z · arch→task · completed · by=gemini-2.5-pro
done:   arch.md + CONTEXT.md + ADRs landed.
output: .pipeline/login/arch.md .pipeline/login/CONTEXT.md
--- handoff ---
>>> NEXT
Run pipeline-task.
repo=https://github.com/acme/widget branch=main pr=none
<<< END

## seq=3 · 2026-06-18T12:00:00Z · task→impl · completed · by=claude-opus-4-8
done:   froze red tests for all cards; spec-rev=abc1234.
output: .pipeline/login/tasks/01-store.md .pipeline/login/tasks/02-api.md
--- handoff ---
>>> NEXT
Run pipeline-impl.
repo=https://github.com/acme/widget branch=feat/login pr=none
- do: git pull --rebase, pick oldest todo card, make its red test green
- on green: open PR, status=review, run pipeline-review
<<< END
