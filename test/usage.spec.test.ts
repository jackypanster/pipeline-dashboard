import { execFile } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

// FROZEN SPEC — usage-message card 01. Argument errors must print the usage line to
// STDERR (stdout stays reserved); exit codes are unchanged; valid runs stay silent.

const run = promisify(execFile);
const CLI = resolve("dist/cli.js");
const FIXTURE = resolve("test/fixtures/happy");

async function cli(args: string[]): Promise<{ code: number; stderr: string }> {
  try {
    const r = await run("node", [CLI, ...args]);
    return { code: 0, stderr: r.stderr };
  } catch (error) {
    const e = error as { code?: number; stderr?: string };
    return { code: e.code ?? -1, stderr: e.stderr ?? "" };
  }
}

describe("cli usage message on argument errors", () => {
  it("no arguments: exit 1 + usage on stderr", async () => {
    const r = await cli([]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("Usage: pipeline-dashboard");
  });

  it("unknown flag: exit 1 + usage on stderr", async () => {
    const r = await cli([FIXTURE, "--bogus"]);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("Usage: pipeline-dashboard");
  });

  it("valid render: exit 0, NO usage noise on stderr", async () => {
    const out = join(mkdtempSync(join(tmpdir(), "usage-spec-")), "b.html");
    const r = await cli([FIXTURE, "--out", out]);
    expect(r.code).toBe(0);
    expect(r.stderr).not.toContain("Usage:");
  });
});
