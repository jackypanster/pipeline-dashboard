import { describe, expect, it } from "vitest";

// VALUE import of the not-yet-implemented renderer — freezes RED until card 02 impl creates
// src/render.ts. Type-only import is erased by esbuild and stays safe pre-impl.
import { renderBoard } from "../src/render.js";
import type { Card, CardStatus, StateModel } from "../src/model.js";

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
