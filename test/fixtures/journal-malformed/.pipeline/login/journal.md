# run journal — login

## seq=1 · 2026-06-18T09:00:00Z · prd→arch · completed · by=claude-opus-4-8
done:   PRD landed.
output: .pipeline/login/PRD.md
--- handoff ---
>>> NEXT
Run pipeline-arch.
<<< END

## seq=oops · this header is garbage and must be skipped with a warning
done:   should not parse.

## seq=2 · 2026-06-18T10:30:00Z · arch→task · completed · by=gemini-2.5-pro
done:   froze red tests.
output: .pipeline/login/tasks/01-store.md
--- handoff ---
>>> NEXT
Run pipeline-task.
<<< END
