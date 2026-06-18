import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

import { firstHeading, parseFrontmatter } from "./frontmatter.js";
import {
  CARD_STATUSES,
  STAGE_ORDER,
  type Card,
  type CardStatus,
  type Stage,
  type StateModel,
} from "./model.js";

interface CurrentJson {
  repo?: unknown;
  branch?: unknown;
  pr?: unknown;
  feature?: unknown;
  stage?: unknown;
}

export function parsePipeline(pipelineDir: string): StateModel {
  const warnings: string[] = [];

  if (!existsSync(pipelineDir) || !safeIsDirectory(pipelineDir)) {
    return emptyState(["no active feature: .pipeline directory not found"]);
  }

  const currentPath = join(pipelineDir, "current.json");
  if (!existsSync(currentPath)) {
    return emptyState(["no active feature: current.json not found"]);
  }

  let current: CurrentJson;
  try {
    current = JSON.parse(readFileSync(currentPath, "utf8")) as CurrentJson;
  } catch (error) {
    return emptyState([
      `no active feature: malformed current.json (${messageFrom(error)})`,
    ]);
  }

  const repo = stringValue(current.repo);
  const branch = stringValue(current.branch);
  const feature = stringValue(current.feature);
  const stage = parseStage(current.stage, warnings);
  const pr = parsePr(current.pr);

  if (!feature) {
    return emptyState(["no active feature: current.json.feature is missing or empty"]);
  }

  const cards: Card[] = [];
  const featureDir = join(pipelineDir, feature);
  const tasksDir = join(featureDir, "tasks");

  if (!existsSync(featureDir) || !safeIsDirectory(featureDir)) {
    warnings.push(`feature directory not found: ${feature}`);
  } else if (!existsSync(tasksDir) || !safeIsDirectory(tasksDir)) {
    warnings.push(`tasks directory not found for feature: ${feature}`);
  } else {
    for (const fileName of sortedMarkdownFiles(tasksDir)) {
      const card = parseCardFile(join(tasksDir, fileName), fileName, warnings);
      if (card) {
        cards.push(card);
      }
    }
  }

  cards.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return {
    repo,
    branch,
    pr,
    feature,
    stage,
    stageOrder: [...STAGE_ORDER],
    cards,
    lanes: groupLanes(cards),
    warnings,
  };
}

function parseCardFile(path: string, fileName: string, warnings: string[]): Card | null {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch (error) {
    warnings.push(`could not read card ${fileName}: ${messageFrom(error)}`);
    return null;
  }

  const parsed = parseFrontmatter(content);
  const id = parsed.data.id || idFromFilename(fileName);
  const title = parsed.data.title || firstHeading(parsed.body) || titleFromFilename(fileName);
  const status = parsed.data.status;

  if (!isCardStatus(status)) {
    warnings.push(`invalid status for card ${id}: ${status || "<missing>"}`);
    return null;
  }

  const attempts = parseAttempts(parsed.data.attempts, fileName, warnings);
  const specRev = parsed.data["spec-rev"] || null;

  return {
    id,
    title,
    status,
    attempts,
    specRev,
    isBlocked: status === "blocked" || attempts >= 3,
  };
}

function emptyState(warnings: string[] = []): StateModel {
  return {
    repo: "",
    branch: "",
    pr: null,
    feature: "",
    stage: "prd",
    stageOrder: [...STAGE_ORDER],
    cards: [],
    lanes: emptyLanes(),
    warnings,
  };
}

function groupLanes(cards: Card[]): Record<CardStatus, Card[]> {
  const lanes = emptyLanes();
  for (const card of cards) {
    lanes[card.status].push(card);
  }

  return lanes;
}

function emptyLanes(): Record<CardStatus, Card[]> {
  return {
    todo: [],
    "in-progress": [],
    review: [],
    done: [],
    blocked: [],
  };
}

function sortedMarkdownFiles(tasksDir: string): string[] {
  return readdirSync(tasksDir)
    .filter((fileName) => extname(fileName).toLowerCase() === ".md")
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function parseStage(value: unknown, warnings: string[]): Stage {
  if (typeof value === "string" && isStage(value)) {
    return value;
  }

  warnings.push(`invalid stage in current.json: ${String(value ?? "<missing>")}`);
  return "prd";
}

function parsePr(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "" || value === "none") {
    return null;
  }

  return value;
}

function parseAttempts(value: string | undefined, fileName: string, warnings: string[]): number {
  if (value === undefined || value === "") {
    return 0;
  }

  const attempts = Number(value);
  if (!Number.isFinite(attempts) || !Number.isInteger(attempts) || attempts < 0) {
    warnings.push(`invalid attempts for card ${fileName}: ${value}`);
    return 0;
  }

  return attempts;
}

function idFromFilename(fileName: string): string {
  const base = basename(fileName, extname(fileName));
  return base.split("-", 1)[0] || base;
}

function titleFromFilename(fileName: string): string {
  return basename(fileName, extname(fileName));
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isStage(value: string): value is Stage {
  return (STAGE_ORDER as readonly string[]).includes(value);
}

function isCardStatus(value: string | undefined): value is CardStatus {
  return value !== undefined && (CARD_STATUSES as readonly string[]).includes(value);
}

function safeIsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
