import type { Card, CardStatus, JournalEntry, StateModel } from "./model.js";
import type { Provenance } from "./provenance.js";

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

function renderLiveBanner(state: StateModel): string {
  if (state.stageSource !== "journal") {
    return "";
  }

  const status = state.liveStatus ?? "unknown";
  const next = state.nextCommand
    ? `<span class="live__next">next: <code>${escapeHtml(state.nextCommand)}</code></span>`
    : `<span class="live__next live__next--end">no next command</span>`;
  const by = state.by ? `<span class="live__by">by ${escapeHtml(state.by)}</span>` : "";

  return `<section class="live live--${escapeHtml(status)}" aria-label="Live run status">
    <span class="live__label">live</span>
    <span class="live__status">${escapeHtml(status)}</span>
    ${next}
    ${by}
    <span class="live__source">stage from journal</span>
  </section>`;
}

function renderBlockedBanner(state: StateModel): string {
  if (!state.featureBlocked) {
    return "";
  }

  const reports = state.integrationReports.length > 0
    ? `<ul class="blocked-banner__reports">${state.integrationReports
        .map((path) => `<li><code>${escapeHtml(path)}</code></li>`)
        .join("")}</ul>`
    : "";

  return `<section class="blocked-banner" role="alert">
    <h2>Feature blocked</h2>
    <p>The latest journal entry routes this feature out of the forward flow (failed / blocked / →hunt).
    Cards may still look green — the feature is not done.</p>
    ${reports}
  </section>`;
}

function renderJournalEntry(entry: JournalEntry, isLive: boolean): string {
  const liveClass = isLive ? " entry--live" : "";
  const output = entry.output.length > 0
    ? `<p class="entry__output"><span>output</span> ${entry.output
        .map((path) => `<code>${escapeHtml(path)}</code>`)
        .join(" ")}</p>`
    : "";
  const done = entry.done
    ? `<p class="entry__done">${escapeHtml(entry.done)}</p>`
    : "";
  const handoff = entry.handoff
    ? `<details class="entry__handoff"><summary>handoff</summary><pre>${escapeHtml(entry.handoff)}</pre></details>`
    : "";

  return `<li class="entry entry--${escapeHtml(entry.status)}${liveClass}" data-seq="${escapeHtml(entry.seq)}">
    <div class="entry__topline">
      <span class="entry__seq">seq ${escapeHtml(entry.seq)}</span>
      <span class="entry__transition"><code>${escapeHtml(entry.from)}</code> → <code>${escapeHtml(entry.to)}</code></span>
      <span class="entry__status">${escapeHtml(entry.status)}</span>
      <span class="entry__by">by ${escapeHtml(entry.by)}</span>
      <span class="entry__time">${escapeHtml(entry.timestamp)}</span>
    </div>
    ${done}
    ${output}
    ${handoff}
  </li>`;
}

function renderTimeline(state: StateModel): string {
  if (state.journal.length === 0) {
    return "";
  }

  // The live entry is the physically-last (append order), identified by index — NOT by max
  // seq: the parser allows non-monotonic/duplicate seq, so seq is not a unique live key.
  const lastIndex = state.journal.length - 1;
  const entries = state.journal
    .map((entry, index) => renderJournalEntry(entry, index === lastIndex))
    .join("\n");

  return `<section class="timeline" aria-label="Run journal">
    <h2>Run journal</h2>
    <ol class="timeline__list">${entries}</ol>
  </section>`;
}

/**
 * Format the human-frozen provenance footer line (PRD Success-1).
 * Separator is " · " (U+00B7). head:null omits the HEAD segment;
 * branch:null renders "(detached)".
 */
function formatProvenanceLine(provenance: Provenance): string {
  let line = `generated ${provenance.generatedAt} · source ${provenance.source}`;
  if (provenance.head) {
    const branchLabel = provenance.head.branch ?? "detached";
    line += ` · HEAD ${provenance.head.sha} (${branchLabel})`;
  }
  return line;
}

function renderProvenanceFooter(provenance: Provenance | undefined): string {
  if (!provenance) {
    return "";
  }
  return `<footer class="provenance">${escapeHtml(formatProvenanceLine(provenance))}</footer>`;
}

export function renderBoard(state: StateModel, provenance?: Provenance): string {
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
  const provenanceFooter = renderProvenanceFooter(provenance);

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
    .live { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin: 1rem 0; padding: .7rem 1rem; border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 12px; background: var(--panel); }
    .live__label { text-transform: uppercase; letter-spacing: .08em; font-size: .7rem; color: var(--muted); }
    .live__status { font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
    .live--failed, .live--blocked { border-left-color: var(--blocked); }
    .live--failed .live__status, .live--blocked .live__status { color: var(--blocked); }
    .live__next, .live__by, .live__source { color: var(--muted); font-size: .9rem; }
    .live__source { margin-left: auto; font-size: .75rem; }
    .blocked-banner { border: 1px solid var(--blocked); border-radius: 16px; background: var(--blocked-bg); color: var(--text); padding: 1rem 1.25rem; margin: 1rem 0; box-shadow: 0 10px 30px rgb(180 35 24 / 12%); }
    .blocked-banner h2 { color: var(--blocked); margin: 0 0 .4rem; }
    .blocked-banner p { margin: 0; color: var(--muted); }
    .blocked-banner__reports { margin: .6rem 0 0; }
    .timeline { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 10px 30px rgb(15 23 42 / 8%); margin: 1rem 0; padding: 1rem 1.25rem; }
    .timeline h2 { margin: 0 0 .75rem; font-size: 1rem; text-transform: uppercase; letter-spacing: .04em; }
    .timeline__list { list-style: none; margin: 0; padding: 0; display: grid; gap: .6rem; }
    .entry { border: 1px solid var(--line); border-left: 3px solid var(--line); border-radius: 12px; padding: .7rem .85rem; background: var(--bg); }
    .entry--live { border-left-color: var(--accent); }
    .entry--failed, .entry--blocked { border-left-color: var(--blocked); }
    .entry__topline { display: flex; flex-wrap: wrap; align-items: baseline; gap: .75rem; color: var(--muted); font-size: .85rem; }
    .entry__seq { font-weight: 700; color: var(--text); }
    .entry__status { text-transform: uppercase; letter-spacing: .03em; }
    .entry--failed .entry__status, .entry--blocked .entry__status { color: var(--blocked); font-weight: 700; }
    .entry__time { margin-left: auto; }
    .entry__done { margin: .5rem 0 0; }
    .entry__output { margin: .35rem 0 0; color: var(--muted); font-size: .9rem; }
    .entry__handoff { margin-top: .5rem; }
    .entry__handoff summary { cursor: pointer; color: var(--accent); font-size: .85rem; }
    .entry__handoff pre { margin: .5rem 0 0; padding: .7rem; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow-x: auto; font-size: .82rem; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
    .provenance { margin-top: 1.5rem; padding-top: .75rem; border-top: 1px solid var(--line); color: var(--muted); font-size: .8rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; word-break: break-all; }
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
    ${renderLiveBanner(state)}
    ${renderBlockedBanner(state)}
    ${warnings}
    <nav class="stage-flow" aria-label="Feature stage flow">
      <ol>${stages}</ol>
    </nav>
    <section class="lanes" aria-label="Card status lanes">
      ${lanes}
    </section>
    ${renderTimeline(state)}
    ${provenanceFooter}
  </main>
</body>
</html>`;
}
