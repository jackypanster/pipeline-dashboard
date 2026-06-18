import type { Card, CardStatus, StateModel } from "./model.js";

const LANE_ORDER: CardStatus[] = ["todo", "in-progress", "review", "done", "blocked"];

function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCard(card: Card): string {
  const blockedHook = card.isBlocked ? ' data-blocked="true"' : "";
  const blockedClass = card.isBlocked || card.attempts >= 3 ? " card--blocked" : "";
  const specRev = card.specRev
    ? `<p class="card__meta"><span>spec-rev</span> <code>${escapeHtml(card.specRev)}</code></p>`
    : "";

  return `<article class="card${blockedClass}" data-card-id="${escapeHtml(card.id)}" data-attempts="${escapeHtml(card.attempts)}"${blockedHook}>
    <div class="card__topline">
      <span class="card__id">#${escapeHtml(card.id)}</span>
      <span class="card__status">${escapeHtml(card.status)}</span>
    </div>
    <h3>${escapeHtml(card.title)}</h3>
    <p class="card__meta"><span>attempts</span> <strong>${escapeHtml(card.attempts)}</strong></p>
    ${specRev}
  </article>`;
}

function renderLane(status: CardStatus, cards: Card[]): string {
  const body = cards.length > 0
    ? cards.map(renderCard).join("\n")
    : `<p class="lane__empty">No cards in ${escapeHtml(status)}.</p>`;

  return `<section class="lane" data-lane="${escapeHtml(status)}">
    <header class="lane__header">
      <h2>${escapeHtml(status)}</h2>
      <span class="lane__count">${escapeHtml(cards.length)}</span>
    </header>
    <div class="lane__cards">
      ${body}
    </div>
  </section>`;
}

export function renderBoard(state: StateModel): string {
  const warnings = state.warnings.length > 0
    ? `<section class="warnings" aria-label="Warnings">
        <h2>Warnings</h2>
        <ul>${state.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>
      </section>`
    : "";

  const stages = state.stageOrder.map((stage) => {
    const currentHook = stage === state.stage ? ` data-current-stage="${escapeHtml(state.stage)}"` : "";
    const currentClass = stage === state.stage ? " stage--current" : "";
    return `<li class="stage${currentClass}" data-stage="${escapeHtml(stage)}"${currentHook}>${escapeHtml(stage)}</li>`;
  }).join("\n");

  const lanes = LANE_ORDER.map((status) => renderLane(status, state.lanes[status] ?? [])).join("\n");
  const pr = state.pr ?? "none";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pipeline Dashboard — ${escapeHtml(state.feature || "no feature")}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f6f7fb;
      --panel: #ffffff;
      --text: #172033;
      --muted: #667085;
      --line: #d0d5dd;
      --accent: #2563eb;
      --warn: #b45309;
      --blocked: #b42318;
      --blocked-bg: #fff1f3;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b1020;
        --panel: #111827;
        --text: #f8fafc;
        --muted: #a5b4c8;
        --line: #2d3748;
        --accent: #60a5fa;
        --warn: #fbbf24;
        --blocked: #f87171;
        --blocked-bg: #2a1114;
      }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); }
    main { padding: 2rem; }
    .hero, .warnings, .lane, .stage-flow { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 10px 30px rgb(15 23 42 / 8%); }
    .hero { padding: 1.5rem; margin-bottom: 1rem; }
    .hero h1 { margin: 0 0 .75rem; }
    .metadata { display: flex; flex-wrap: wrap; gap: .75rem; color: var(--muted); }
    .metadata span { border: 1px solid var(--line); border-radius: 999px; padding: .35rem .7rem; }
    .warnings { border-color: var(--warn); padding: 1rem 1.25rem; margin: 1rem 0; }
    .warnings h2 { color: var(--warn); margin-top: 0; }
    .stage-flow { margin: 1rem 0; padding: 1rem; }
    .stage-flow ol { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; padding: 0; margin: 0; }
    .stage { border: 1px solid var(--line); border-radius: 999px; padding: .45rem .8rem; color: var(--muted); }
    .stage--current { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--text); font-weight: 700; }
    .lanes { display: grid; grid-template-columns: repeat(5, minmax(220px, 1fr)); gap: 1rem; align-items: start; overflow-x: auto; padding-bottom: .5rem; }
    .lane { min-width: 220px; padding: 1rem; }
    .lane__header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: .75rem; }
    .lane h2 { margin: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: .04em; }
    .lane__count { background: var(--bg); border: 1px solid var(--line); border-radius: 999px; padding: .15rem .55rem; color: var(--muted); }
    .lane__cards { display: grid; gap: .75rem; }
    .lane__empty { color: var(--muted); border: 1px dashed var(--line); border-radius: 12px; padding: .85rem; margin: 0; }
    .card { border: 1px solid var(--line); border-radius: 14px; padding: .9rem; background: var(--bg); }
    .card--blocked { border-color: var(--blocked); background: var(--blocked-bg); }
    .card__topline { display: flex; justify-content: space-between; gap: 1rem; color: var(--muted); font-size: .85rem; }
    .card h3 { margin: .45rem 0 .7rem; font-size: 1rem; line-height: 1.35; }
    .card__meta { margin: .35rem 0 0; color: var(--muted); font-size: .9rem; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>Pipeline Dashboard</h1>
      <div class="metadata">
        <span>repo: ${escapeHtml(state.repo)}</span>
        <span>branch: ${escapeHtml(state.branch)}</span>
        <span>feature: ${escapeHtml(state.feature)}</span>
        <span>stage: ${escapeHtml(state.stage)}</span>
        <span>pr: ${escapeHtml(pr)}</span>
      </div>
    </section>
    ${warnings}
    <nav class="stage-flow" aria-label="Feature stage flow">
      <ol>${stages}</ol>
    </nav>
    <section class="lanes" aria-label="Card status lanes">
      ${lanes}
    </section>
  </main>
</body>
</html>`;
}
