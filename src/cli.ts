#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parsePipeline } from "./parse.js";
import { collectProvenance } from "./provenance.js";
import { renderBoard } from "./render.js";

export function buildBoard(targetRepoPath: string): string {
  const state = parsePipeline(join(targetRepoPath, ".pipeline"));
  // Clock at the shell edge — inject so provenance stays a pure data object for render.
  const provenance = collectProvenance(targetRepoPath, new Date());
  return renderBoard(state, provenance);
}

export function run(args: string[]): number {
  const targetRepoPath = args[0];
  if (!targetRepoPath) {
    return 1;
  }

  let outPath = resolve("board.html");
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out") {
      const value = args[index + 1];
      if (!value) {
        return 1;
      }
      outPath = resolve(value);
      index += 1;
      continue;
    }

    return 1;
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = run(process.argv.slice(2));
}
