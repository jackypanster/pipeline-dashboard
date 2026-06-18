import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

// VALUE import of the not-yet-implemented CLI — freezes RED until card 03 impl creates src/cli.ts.
import { buildBoard, run } from "../src/cli.js";

const here = dirname(fileURLToPath(import.meta.url));
// Target repo checkout = the dir CONTAINING .pipeline. Reuse card 01's frozen fixtures (read-only).
const happyRepo = resolve(here, "fixtures", "happy");
const malformedRepo = resolve(here, "fixtures", "malformed-current");

const temps: string[] = [];
function tmpOut(): string {
  const dir = mkdtempSync(join(tmpdir(), "pdash-"));
  temps.push(dir);
  return join(dir, "board.html");
}
afterEach(() => {
  while (temps.length) rmSync(temps.pop()!, { recursive: true, force: true });
});

function listPipeline(repo: string): string[] {
  const root = join(repo, ".pipeline");
  const walk = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
    );
  return walk(root).sort();
}

describe("buildBoard — wires parse -> render end to end", () => {
  it("produces an HTML board from a target repo checkout path", () => {
    const html = buildBoard(happyRepo);
    expect(html.toLowerCase()).toContain("<html");
    expect(html).toContain("Implement store"); // card 01 title from the happy fixture
    expect(html).toContain('data-lane="todo"');
  });
});

describe("run — CLI wiring", () => {
  it("writes board.html to --out and exits 0", () => {
    const out = tmpOut();
    const code = run([happyRepo, "--out", out]);
    expect(code).toBe(0);
    expect(existsSync(out)).toBe(true);
    expect(readFileSync(out, "utf8").toLowerCase()).toContain("<html");
  });

  it("exits non-zero when the required target path arg is missing", () => {
    expect(run([])).not.toBe(0);
  });

  it("malformed pipeline data is NON-fatal: still exits 0 and writes a board", () => {
    const out = tmpOut();
    const code = run([malformedRepo, "--out", out]);
    expect(code).toBe(0);
    expect(existsSync(out)).toBe(true);
  });

  it("is read-only: running never writes inside the target's .pipeline/", () => {
    const before = listPipeline(happyRepo);
    run([happyRepo, "--out", tmpOut()]);
    expect(listPipeline(happyRepo)).toEqual(before);
  });
});
