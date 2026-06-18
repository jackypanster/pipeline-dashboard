import { beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

// Card 04 (deployability) freeze: the project must build to a plain-node-runnable CLI.
// This is the gap the unit tests missed — `node src/cli.ts` fails today (no build, no @types/node).
// RED until impl adds @types/node + a `build` script that emits a runnable dist/cli.js.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", ".."); // test/integration -> repo root
const happyRepo = resolve(repoRoot, "test", "fixtures", "happy"); // card-01 fixture, read-only

function npm(args: string[]): void {
  execFileSync("npm", args, { cwd: repoRoot, stdio: "pipe" });
}

describe("deployability — builds to a plain-node-runnable CLI", () => {
  beforeAll(() => {
    // Must succeed: type-check + emit. Fails today (missing build script / @types/node).
    npm(["run", "build"]);
  }, 120_000);

  it("emits a runnable entry at dist/cli.js", () => {
    expect(existsSync(join(repoRoot, "dist", "cli.js"))).toBe(true);
  });

  it("`node dist/cli.js <target> --out <file>` generates a board.html", () => {
    const out = join(mkdtempSync(join(tmpdir(), "pdash-int-")), "board.html");
    const code = (() => {
      try {
        execFileSync("node", ["dist/cli.js", happyRepo, "--out", out], { cwd: repoRoot, stdio: "pipe" });
        return 0;
      } catch {
        return 1;
      }
    })();
    expect(code).toBe(0);
    expect(existsSync(out)).toBe(true);
    const html = readFileSync(out, "utf8").toLowerCase();
    expect(html).toContain("<html");
    expect(html).toContain('data-lane="todo"');
  });
});
