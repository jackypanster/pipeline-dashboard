import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { parsePipeline } from "../src/parse.js";
import { collectProvenance } from "../src/provenance.js";
import { renderBoard } from "../src/render.js";

// FROZEN SPEC — board-provenance card 01 (see .pipeline/board-provenance/arch.md, ADR 0007).
// Footer format is human-frozen in PRD Success-1:
//   generated <ISO-8601 UTC seconds> · source <abs path> · HEAD <short-sha> (<branch>)
// Real temp git repos, no mocks (repo policy). Separator is " · " (U+00B7).

const NOW = new Date("2026-07-11T06:07:05.123Z");
const NOW_ISO = "2026-07-11T06:07:05Z"; // seconds precision — millis truncated

const tmpDirs: string[] = [];
function tmp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tmpDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
}

function gitRepo(): string {
  const repo = tmp("prov-git-");
  git(repo, "init", "-q", "-b", "main");
  git(repo, "-c", "user.email=spec@test", "-c", "user.name=spec", "commit", "-q", "--allow-empty", "-m", "x");
  return repo;
}

describe("collectProvenance", () => {
  it("collects generatedAt/source/head from a real git repo", () => {
    const repo = gitRepo();
    const p = collectProvenance(repo, NOW);
    expect(p.generatedAt).toBe(NOW_ISO);
    expect(p.source).toBe(resolve(repo));
    expect(p.head).toEqual({ sha: git(repo, "rev-parse", "--short", "HEAD"), branch: "main" });
  });

  it("degrades to head=null on a non-git directory", () => {
    const p = collectProvenance(tmp("prov-plain-"), NOW);
    expect(p.head).toBeNull();
    expect(p.generatedAt).toBe(NOW_ISO);
  });

  it("reports branch=null on a detached HEAD", () => {
    const repo = gitRepo();
    git(repo, "checkout", "-q", "--detach");
    const p = collectProvenance(repo, NOW);
    expect(p.head?.sha).toBe(git(repo, "rev-parse", "--short", "HEAD"));
    expect(p.head?.branch).toBeNull();
  });
});

describe("renderBoard provenance footer", () => {
  const state = parsePipeline(resolve("test/fixtures/happy/.pipeline"));

  it("renders the full footer line", () => {
    const html = renderBoard(state, {
      generatedAt: NOW_ISO,
      source: "/obs/repo",
      head: { sha: "abc1234", branch: "main" },
    });
    expect(html).toContain(`generated ${NOW_ISO} · source /obs/repo · HEAD abc1234 (main)`);
  });

  it("omits the HEAD segment when head is null", () => {
    const html = renderBoard(state, { generatedAt: NOW_ISO, source: "/obs/repo", head: null });
    expect(html).toContain(`generated ${NOW_ISO} · source /obs/repo`);
    expect(html).not.toContain("· HEAD ");
  });

  it("renders (detached) when branch is null", () => {
    const html = renderBoard(state, {
      generatedAt: NOW_ISO,
      source: "/obs/repo",
      head: { sha: "abc1234", branch: null },
    });
    expect(html).toContain("HEAD abc1234 (detached)");
  });

  it("renders no footer when provenance is not provided", () => {
    expect(renderBoard(state)).not.toContain("generated ");
  });
});

describe("built cli", () => {
  it("dist/cli.js starts with the node shebang and is directly executable", () => {
    const cli = resolve("dist/cli.js");
    expect(readFileSync(cli, "utf8").split("\n")[0]).toBe("#!/usr/bin/env node");
    const out = join(tmp("prov-cli-"), "board.html");
    execFileSync(cli, [resolve("test/fixtures/happy"), "--out", out], { stdio: "ignore" });
    expect(readFileSync(out, "utf8")).toContain(`· source ${resolve("test/fixtures/happy")}`);
  });
});
