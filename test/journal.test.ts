import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { parsePipeline } from "../src/parse.js";
import { parseJournal } from "../src/journal.js";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (name: string): string => resolve(here, "fixtures", name, ".pipeline");

describe("parseJournal — pure parser", () => {
  it("parses header fields, done/output, handoff and nextCommand", () => {
    const warnings: string[] = [];
    const entries = parseJournal(
      [
        "## seq=1 · 2026-06-18T09:00:00Z · prd→arch · completed · by=claude-opus-4-8",
        "done:   PRD landed.",
        "output: a/PRD.md b/notes.md",
        "--- handoff ---",
        ">>> NEXT",
        "Run pipeline-arch.",
        "<<< END",
      ].join("\n"),
      warnings,
    );

    expect(warnings).toEqual([]);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      seq: 1,
      timestamp: "2026-06-18T09:00:00Z",
      from: "prd",
      to: "arch",
      status: "completed",
      by: "claude-opus-4-8",
      output: ["a/PRD.md", "b/notes.md"],
      nextCommand: "pipeline-arch",
    });
    expect(entries[0].handoff).toContain("Run pipeline-arch.");
  });

  it("preserves append (file) order as the authoritative tail; warns on non-monotonic seq", () => {
    const warnings: string[] = [];
    const entries = parseJournal(
      [
        "## seq=2 · t · a→b · completed · by=x",
        "## seq=1 · t · c→d · completed · by=y",
      ].join("\n"),
      warnings,
    );
    // file order is kept (NOT reordered to [1,2]); the physically-last entry is the tail
    expect(entries.map((e) => e.seq)).toEqual([2, 1]);
    expect(entries.at(-1)?.from).toBe("c");
    expect(warnings.some((w) => /seq not monotonic/i.test(w))).toBe(true);
  });

  it("keeps monotonic logs in order with no warning", () => {
    const warnings: string[] = [];
    const entries = parseJournal(
      [
        "## seq=1 · t · a→b · completed · by=x",
        "## seq=2 · t · b→c · completed · by=y",
      ].join("\n"),
      warnings,
    );
    expect(entries.map((e) => e.seq)).toEqual([1, 2]);
    expect(warnings).toEqual([]);
  });

  it("coerces an unknown status to 'unknown' with a warning", () => {
    const warnings: string[] = [];
    const entries = parseJournal("## seq=1 · t · a→b · donezo · by=x", warnings);
    expect(entries[0].status).toBe("unknown");
    expect(warnings.some((w) => /unknown journal status/i.test(w))).toBe(true);
  });
});

describe("parsePipeline — journal tail is the stage authority", () => {
  it("happy: derives stage/nextCommand/by from the journal tail (no drift)", () => {
    const s = parsePipeline(fx("journal-happy"));
    expect(s.journal).toHaveLength(3);
    expect(s.stage).toBe("impl");
    expect(s.stageSource).toBe("journal");
    expect(s.liveStatus).toBe("completed");
    expect(s.nextCommand).toBe("pipeline-impl");
    expect(s.by).toBe("claude-opus-4-8");
    expect(s.featureBlocked).toBe(false);
    expect(s.warnings.some((w) => /drift/i.test(w))).toBe(false);
  });

  it("drift: journal tail wins over a stale current.json.stage and warns", () => {
    const s = parsePipeline(fx("journal-drift"));
    expect(s.stage).toBe("task"); // journal tail arch→task, not current.json's "arch"
    expect(s.stageSource).toBe("journal");
    expect(s.warnings.some((w) => /stage drift/i.test(w))).toBe(true);
  });
});

describe("parsePipeline — feature-level blocked", () => {
  it("flags featureBlocked on a failed tail even when no card is blocked", () => {
    const s = parsePipeline(fx("journal-blocked"));
    expect(s.featureBlocked).toBe(true);
    expect(s.liveStatus).toBe("failed");
    expect(s.lanes.blocked).toEqual([]); // no card-level block
  });

  it("flags featureBlocked on a review→hunt integration incident with green cards", () => {
    const s = parsePipeline(fx("journal-integration-incident"));
    expect(s.featureBlocked).toBe(true);
    expect(s.stage).toBe("review"); // to=hunt is not a Stage → falls back to tail.from
    expect(s.integrationReports).toEqual(["reviews/integration-01.md"]);
    expect(s.lanes.blocked).toEqual([]);
  });

  it("does NOT flag blocked when a recovered tail follows a lingering incident report", () => {
    // The incident report is append-only and survives recovery; the journal tail is the
    // authority, not file presence. tail=review→done completed ⇒ not blocked.
    const s = parsePipeline(fx("journal-incident-recovered"));
    expect(s.featureBlocked).toBe(false);
    expect(s.stage).toBe("done");
    expect(s.integrationReports).toEqual(["reviews/integration-01.md"]); // still parsed/available
  });
});

describe("parsePipeline — journal optional / malformed (non-fatal)", () => {
  it("no journal: falls back to current.json cache and warns", () => {
    const s = parsePipeline(fx("no-journal"));
    expect(s.journal).toEqual([]);
    expect(s.stage).toBe("task");
    expect(s.stageSource).toBe("current.json");
    expect(s.liveStatus).toBeNull();
    expect(s.nextCommand).toBeNull();
    expect(s.featureBlocked).toBe(false);
    expect(s.warnings.some((w) => /no journal/i.test(w))).toBe(true);
  });

  it("malformed entry is skipped with a warning; valid entries still parse", () => {
    const s = parsePipeline(fx("journal-malformed"));
    expect(s.journal.map((e) => e.seq)).toEqual([1, 2]);
    expect(s.stage).toBe("task"); // tail seq=2 arch→task
    expect(s.warnings.some((w) => /malformed journal entry/i.test(w))).toBe(true);
  });
});
