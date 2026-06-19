import { describe, expect, it } from "vitest";

// VALUE import of the not-yet-implemented renderer — freezes RED until card 02 impl creates
// src/render.ts. Type-only import is erased by esbuild and stays safe pre-impl.
import { renderBoard } from "../src/render.js";
import type { Card, CardStatus, JournalEntry, StateModel } from "../src/model.js";

const CARD_STATUSES: CardStatus[] = ["todo", "in-progress", "review", "done", "blocked"];
const STAGE_ORDER = ["prd", "arch", "task", "impl", "review", "done"] as const;

function card(partial: Partial<Card> & Pick<Card, "id" | "status">): Card {
  return {
    title: `Card ${partial.id}`,
    attempts: 0,
    specRev: null,
    isBlocked: partial.status === "blocked",
    ...partial,
  };
}

// A representative model: every lane exercised, a blocked-by-attempts card in a non-blocked lane,
// a specRev, an XSS-y title, and a warning.
function sampleModel(): StateModel {
  const cards: Card[] = [
    card({ id: "01", title: "Parse core", status: "done", specRev: "65f28e4" }),
    card({ id: "02", title: "<script>alert('x')</script>", status: "in-progress", attempts: 3, isBlocked: true }),
    card({ id: "03", title: "Render", status: "todo" }),
    card({ id: "04", title: "Stuck", status: "blocked", attempts: 5, isBlocked: true }),
  ];
  return {
    repo: "https://github.com/acme/widget",
    branch: "feat/login",
    pr: null,
    feature: "login",
    stage: "impl",
    stageOrder: [...STAGE_ORDER],
    cards,
    lanes: {
      todo: [cards[2]!],
      "in-progress": [cards[1]!],
      review: [],
      done: [cards[0]!],
      blocked: [cards[3]!],
    },
    warnings: ["sample warning: heads up"],
    journal: [],
    stageSource: "current.json",
    liveStatus: null,
    nextCommand: null,
    by: null,
    featureBlocked: false,
    integrationReports: [],
  };
}

function entry(partial: Partial<JournalEntry> & Pick<JournalEntry, "seq">): JournalEntry {
  return {
    timestamp: "2026-06-18T09:00:00Z",
    from: "task",
    to: "impl",
    status: "completed",
    by: "claude-opus-4-8",
    done: "did the thing",
    output: [".pipeline/login/tasks/01.md"],
    handoff: "Run pipeline-impl.",
    nextCommand: "pipeline-impl",
    ...partial,
  };
}

// A journal-aware model: stage resolved from the journal tail, a live banner, a timeline.
function journalModel(): StateModel {
  const base = sampleModel();
  return {
    ...base,
    stageSource: "journal",
    liveStatus: "completed",
    nextCommand: "pipeline-review",
    by: "gemini-2.5-pro",
    journal: [
      entry({ seq: 1, from: "prd", to: "arch" }),
      entry({ seq: 2, from: "arch", to: "task", by: "gemini-2.5-pro", nextCommand: "pipeline-review" }),
    ],
  };
}

describe("renderBoard — document shape", () => {
  it("returns a non-empty self-contained HTML document", () => {
    const html = renderBoard(sampleModel());
    expect(typeof html).toBe("string");
    expect(html.length).toBeGreaterThan(0);
    expect(html.toLowerCase()).toContain("<html");
  });
});

describe("renderBoard — stable data hooks (contract, not visuals)", () => {
  it("emits a data-lane for ALL five status lanes, even the empty one (review)", () => {
    const html = renderBoard(sampleModel());
    for (const status of CARD_STATUSES) {
      expect(html).toContain(`data-lane="${status}"`);
    }
  });

  it("emits a data-stage for ALL six stages and marks the current stage", () => {
    const html = renderBoard(sampleModel());
    for (const stage of STAGE_ORDER) {
      expect(html).toContain(`data-stage="${stage}"`);
    }
    // current stage named once via a stable hook (visual highlight is reviewed by eye)
    expect(html).toContain(`data-current-stage="impl"`);
  });

  it("marks blocked cards with a stable hook", () => {
    expect(renderBoard(sampleModel())).toContain(`data-blocked="true"`);
  });

  it("exposes attempts via a stable hook", () => {
    expect(renderBoard(sampleModel())).toContain(`data-attempts="5"`);
  });
});

describe("renderBoard — card content", () => {
  it("shows a card's title text", () => {
    expect(renderBoard(sampleModel())).toContain("Parse core");
  });

  it("shows specRev when present", () => {
    expect(renderBoard(sampleModel())).toContain("65f28e4");
  });

  it("renders warnings text", () => {
    expect(renderBoard(sampleModel())).toContain("sample warning: heads up");
  });
});

describe("renderBoard — escaping", () => {
  it("HTML-escapes dynamic text (no raw injected markup)", () => {
    const html = renderBoard(sampleModel());
    expect(html).not.toContain("<script>alert('x')</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("renderBoard — journal-aware sections", () => {
  it("omits the timeline and live banner when there is no journal", () => {
    const html = renderBoard(sampleModel());
    expect(html).not.toContain('class="timeline"');
    expect(html).not.toContain('aria-label="Live run status"');
  });

  it("renders a timeline with one item per journal entry when journal present", () => {
    const html = renderBoard(journalModel());
    expect(html).toContain('aria-label="Run journal"');
    expect(html).toContain('data-seq="1"');
    expect(html).toContain('data-seq="2"');
  });

  it("renders a live banner showing the tail's next command and runner", () => {
    const html = renderBoard(journalModel());
    expect(html).toContain('aria-label="Live run status"');
    expect(html).toContain("pipeline-review");
    expect(html).toContain("gemini-2.5-pro");
  });

  it("marks only the physically-last entry live even when seq is duplicated", () => {
    // parser allows non-monotonic/duplicate seq (append order is the authority); the live
    // marker must follow index, not seq, or duplicates would all be flagged live.
    const model: StateModel = {
      ...sampleModel(),
      stageSource: "journal",
      liveStatus: "completed",
      journal: [
        entry({ seq: 1, from: "a", to: "b" }),
        entry({ seq: 1, from: "c", to: "d" }),
      ],
    };
    const html = renderBoard(model);
    // count the class-attribute usage only (the trailing quote excludes the CSS `.entry--live` rule)
    const liveCount = (html.match(/entry--live"/g) ?? []).length;
    expect(liveCount).toBe(1);
  });

  it("renders a blocked banner with integration report paths when featureBlocked", () => {
    const blocked: StateModel = {
      ...journalModel(),
      featureBlocked: true,
      integrationReports: ["reviews/integration-01.md"],
    };
    const html = renderBoard(blocked);
    expect(html).toContain('class="blocked-banner"');
    expect(html).toContain("reviews/integration-01.md");
  });
});
