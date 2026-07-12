#!/usr/bin/env node
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parsePipeline } from "./parse.js";
import { collectProvenance } from "./provenance.js";
import { renderBoard } from "./render.js";

const USAGE = "Usage: pipeline-dashboard <target-repo> [--out <board.html>]";

export function buildBoard(targetRepoPath: string): string {
  const state = parsePipeline(join(targetRepoPath, ".pipeline"));
  // Clock at the shell edge — inject so provenance stays a pure data object for render.
  const provenance = collectProvenance(targetRepoPath, new Date());
  return renderBoard(state, provenance);
}

function usageError(): number {
  console.error(USAGE);
  return 1;
}

export function run(args: string[]): number {
  const targetRepoPath = args[0];
  if (!targetRepoPath) {
    return usageError();
  }

  let outPath = resolve("board.html");
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out") {
      const value = args[index + 1];
      if (!value) {
        return usageError();
      }
      outPath = resolve(value);
      index += 1;
      continue;
    }

    return usageError();
  }

  if (isInsidePipelineDir(targetRepoPath, outPath)) {
    return 1;
  }

  try {
    const html = buildBoard(targetRepoPath);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, "utf8");
    return 0;
  } catch {
    return 1;
  }
}

function isInsidePipelineDir(targetRepoPath: string, outPath: string): boolean {
  const pipelineDir = resolve(targetRepoPath, ".pipeline");
  const relativeOut = relative(pipelineDir, outPath);
  return relativeOut === "" || (!relativeOut.startsWith("..") && !relativeOut.startsWith("/"));
}

/**
 * True when this module is the process entrypoint.
 * Resolve both sides through realpath so npm's bin symlink
 * (`…/bin/pipeline-dashboard` → `dist/cli.js`) still matches import.meta.url.
 */
function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  process.exitCode = run(process.argv.slice(2));
}
