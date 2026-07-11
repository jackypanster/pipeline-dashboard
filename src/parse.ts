import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

import { firstHeading, parseFrontmatter } from "./frontmatter.js";
import { parseJournal } from "./journal.js";
import {
  CARD_STATUSES,
  STAGE_ORDER,
  type Card,
  type CardStatus,
  type JournalEntry,
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
  const cacheStage = parseStage(current.stage, warnings);
  const pr = parsePr(current.pr);

  if (!feature) {
    return emptyState(["no active feature: current.json.feature is missing or empty"]);
  }

  const cards: Card[] = [];
  let journal: JournalEntry[] = [];
  let integrationReports: string[] = [];
  const featureDir = join(pipelineDir, feature);
  const tasksDir = join(featureDir, "tasks");

  if (!existsSync(featureDir) || !safeIsDirectory(featureDir)) {
    warnings.push(`feature directory not found: ${feature}`);
  } else {
    if (!existsSync(tasksDir) || !safeIsDirectory(tasksDir)) {
      warnings.push(`tasks directory not found for feature: ${feature}`);
    } else {
      for (const fileName of sortedMarkdownFiles(tasksDir)) {
        const card = parseCardFile(join(tasksDir, fileName), fileName, warnings);
        if (card) {
          cards.push(card);
        }
      }
    }

    journal = readJournal(featureDir, warnings);
    integrationReports = findIntegrationReports(featureDir);
  }

  cards.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const { stage, stageSource } = resolveStage(journal, cacheStage, warnings);
  const tail = journal.at(-1) ?? null;

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
    journal,
    stageSource,
    liveStatus: tail ? tail.status : null,
    nextCommand: tail ? tail.nextCommand : null,
    by: tail ? tail.by : null,
    featureBlocked: computeFeatureBlocked(tail),
    integrationReports,
  };
}

function readJournal(featureDir: string, warnings: string[]): JournalEntry[] {
  const journalPath = join(featureDir, "journal.md");
  if (!existsSync(journalPath)) {
    warnings.push("no journal.md: stage and live status derived from current.json cache");
    return [];
  }

  let content: string;
  try {
    content = readFileSync(journalPath, "utf8");
  } catch (error) {
    warnings.push(`could not read journal.md: ${messageFrom(error)}`);
    return [];
  }

  return parseJournal(content, warnings);
}

function findIntegrationReports(featureDir: string): string[] {
  const reviewsDir = join(featureDir, "reviews");
  if (!existsSync(reviewsDir) || !safeIsDirectory(reviewsDir)) {
    return [];
  }

  return readdirSync(reviewsDir)
    .filter((fileName) => /^integration-.*\.md$/i.test(fileName))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((fileName) => join("reviews", fileName));
}

/**
 * CONTRACT: the journal tail is the live-state authority; current.json.stage is only a
 * fast cache. When they disagree the journal wins and we surface a drift warning. With no
 * journal we fall back to the cache (pre-journal features and the dashboard's own repo).
 */
function resolveStage(
  journal: JournalEntry[],
  cacheStage: Stage,
  warnings: string[],
): { stage: Stage; stageSource: "journal" | "current.json" } {
  const tail = journal.at(-1);
  if (!tail) {
    return { stage: cacheStage, stageSource: "current.json" };
  }

  let candidate: Stage;
  if (isStage(tail.to)) {
    candidate = tail.to;
  } else if (isStage(tail.from)) {
    // tail.to is a routing target (hunt/todo/…), not a forward stage; the feature sits
    // at the stage it bounced from — featureBlocked carries the "in hunt/retry" meaning.
    candidate = tail.from;
  } else {
    candidate = cacheStage;
  }

  // ADR 0008: drift ⇔ cache matches neither valid-Stage end of the tail transition.
  // Compliant cache is most-recently-completed (= tail.from) or rejection/terminal (= tail.to).
  const members = [tail.from, tail.to].filter(isStage);
  if (members.length > 0 && !members.includes(cacheStage)) {
    warnings.push(
      `stage drift: current.json=${cacheStage}, journal=${candidate} (journal tail wins)`,
    );
  }

  return { stage: candidate, stageSource: "journal" };
}

function computeFeatureBlocked(tail: JournalEntry | null): boolean {
  if (!tail) {
    return false;
  }
  return tail.status === "failed" || tail.status === "blocked" || tail.to === "hunt";
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
    journal: [],
    stageSource: "current.json",
    liveStatus: null,
    nextCommand: null,
    by: null,
    featureBlocked: false,
    integrationReports: [],
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
