# run journal — login

## seq=1 · 2026-06-18T12:00:00Z · impl→review · completed · by=local-qwen
done:   card 01 green; PR opened.
output: src/store.ts
--- handoff ---
>>> NEXT
Run pipeline-review.
<<< END

## seq=2 · 2026-06-18T13:00:00Z · review→impl · failed · by=codex-gpt-5
done:   review rejected — entrypoint guard not symlink-safe; card 01 back to todo. Cache stays at impl (the to-stage) — mirrors the real board-provenance seq=5 state.
output: .pipeline/login/reviews/review-01.md
--- handoff ---
>>> NEXT
Run pipeline-impl.
<<< END
