import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// VALUE import of the not-yet-implemented core — this is the freeze: it fails RED until
// pipeline-impl creates src/parse.ts. (Type-only imports below are erased by esbuild and
// stay safe pre-impl.)
import { parsePipeline } from "../src/parse.js";
import type { StateModel } from "../src/model.js";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name: string): string =>
  resolve(here, "fixtures", name, ".pipeline");

const ALL_LANES = ["todo", "in-progress", "review", "done", "blocked"] as const;
const STAGE_ORDER = ["prd", "arch", "task", "impl", "review", "done"] as const;

function card(model: StateModel, id: string) {
  return model.cards.find((c) => c.id === id);
}

describe("parsePipeline — shape invariants", () => {
  it("always returns all five lane keys and the fixed stage order", () => {
    const m = parsePipeline(fx("happy"));
    expect(Object.keys(m.lanes).sort()).toEqual([...ALL_LANES].sort());
    expect(m.stageOrder).toEqual([...STAGE_ORDER]);
    expect(Array.isArray(m.warnings)).toBe(true);
  });
});

describe("parsePipeline — happy path", () => {
  const m = () => parsePipeline(fx("happy"));

  it("projects current.json metadata and normalizes pr:'none' to null", () => {
    const s = m();
    expect(s.repo).toBe("https://github.com/acme/widget");
    expect(s.branch).toBe("feat/login");
    expect(s.feature).toBe("login");
    expect(s.stage).toBe("impl");
    expect(s.pr).toBeNull();
  });

  it("discovers all cards, sorted by id ascending", () => {
    const s = m();
    expect(s.cards.map((c) => c.id)).toEqual(["01", "02", "03", "04", "05"]);
  });

  it("groups each card into the lane matching its status", () => {
    const s = m();
    expect(s.lanes.done.map((c) => c.id)).toEqual(["01"]);
    expect(s.lanes["in-progress"].map((c) => c.id)).toEqual(["02"]);
    expect(s.lanes.review.map((c) => c.id)).toEqual(["03"]);
    expect(s.lanes.todo.map((c) => c.id)).toEqual(["04"]);
    expect(s.lanes.blocked.map((c) => c.id)).toEqual(["05"]);
  });

  it("reads title, attempts (default 0), and specRev (null when absent)", () => {
    const s = m();
    expect(card(s, "01")).toMatchObject({
      title: "Implement store",
      attempts: 0,
      specRev: "abc1234",
      isBlocked: false,
    });
    expect(card(s, "04")).toMatchObject({ attempts: 0, specRev: null });
    expect(card(s, "02")?.attempts).toBe(1);
  });

  it("flags a blocked-status card as isBlocked", () => {
    expect(card(m(), "05")?.isBlocked).toBe(true);
  });
});

describe("parsePipeline — attempts >= 3 forces isBlocked", () => {
  it("flags isBlocked even when the status lane is not 'blocked'", () => {
    const s = parsePipeline(fx("attempts3"));
    const c = card(s, "01");
    expect(c?.attempts).toBe(3);
    expect(c?.isBlocked).toBe(true);
    // stays in its own status lane (grouping is by status, isBlocked is a flag)
    expect(s.lanes["in-progress"].map((x) => x.id)).toEqual(["01"]);
  });

  it("preserves a real pr url", () => {
    expect(parsePipeline(fx("attempts3")).pr).toBe("https://x/pr/1");
  });
});

describe("parsePipeline — invalid card status", () => {
  it("warns and omits the invalid card from cards and lanes", () => {
    const s = parsePipeline(fx("invalid-status"));
    expect(s.cards.map((c) => c.id)).toEqual(["01"]);
    expect(ALL_LANES.some((l) => s.lanes[l].some((c) => c.id === "02"))).toBe(false);
    expect(s.warnings.length).toBeGreaterThan(0);
  });
});

describe("parsePipeline — multi-feature isolation", () => {
  it("reads only current.json.feature's dir and ignores other features", () => {
    const s = parsePipeline(fx("multi-feature"));
    expect(s.feature).toBe("alpha");
    expect(s.cards.map((c) => c.id)).toEqual(["01"]);
    expect(s.cards.map((c) => c.title)).toEqual(["Alpha work"]);
  });
});

describe("parsePipeline — empty / malformed states are non-fatal", () => {
  it("missing .pipeline path → empty model with 'no active feature' warning", () => {
    const s = parsePipeline(resolve(here, "fixtures", "does-not-exist", ".pipeline"));
    expect(s.feature).toBe("");
    expect(s.cards).toEqual([]);
    ALL_LANES.forEach((l) => expect(s.lanes[l]).toEqual([]));
    expect(s.warnings.some((w) => /no active feature/i.test(w))).toBe(true);
  });

  it("missing current.json → empty model with warning", () => {
    const s = parsePipeline(fx("no-current"));
    expect(s.feature).toBe("");
    expect(s.warnings.length).toBeGreaterThan(0);
  });

  it("malformed current.json → empty model with warning, never throws", () => {
    expect(() => parsePipeline(fx("malformed-current"))).not.toThrow();
    const s = parsePipeline(fx("malformed-current"));
    expect(s.cards).toEqual([]);
    expect(s.warnings.length).toBeGreaterThan(0);
  });

  it("valid current.json but missing feature dir → keep metadata, empty lanes, warn", () => {
    const s = parsePipeline(fx("missing-feature-dir"));
    expect(s.feature).toBe("ghost");
    expect(s.stage).toBe("arch");
    expect(s.repo).toBe("https://github.com/acme/w");
    expect(s.cards).toEqual([]);
    expect(s.warnings.length).toBeGreaterThan(0);
  });
});
