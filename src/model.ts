export const STAGE_ORDER = ["prd", "arch", "task", "impl", "review", "done"] as const;
export type Stage = (typeof STAGE_ORDER)[number];

export const CARD_STATUSES = ["todo", "in-progress", "review", "done", "blocked"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export const JOURNAL_STATUSES = ["completed", "failed", "blocked", "unknown"] as const;
export type JournalStatus = (typeof JOURNAL_STATUSES)[number];

export interface Card {
  id: string;
  title: string;
  status: CardStatus;
  attempts: number;
  specRev: string | null;
  isBlocked: boolean;
}

/**
 * One append-only run-journal entry (`.pipeline/<feature>/journal.md`).
 * Per CONTRACT.md the tail of this list — not current.json — is the authoritative
 * live run position. Fields are kept raw (from/to may be non-Stage values like
 * `hunt`/`todo`); resolution to a renderable Stage happens in parse.
 */
export interface JournalEntry {
  seq: number;
  timestamp: string;        // raw ISO8601 string as found in the header
  from: string;             // from-stage (raw — may be outside STAGE_ORDER)
  to: string;               // to-stage (raw — may be done/hunt/todo)
  status: JournalStatus;    // completed | failed | blocked (unknown when unparseable)
  by: string;               // bot/LLM tag; "?" when unknown
  done: string;             // the `done:` line(s), joined
  output: string[];         // `output:` artifact paths
  handoff: string;          // verbatim body between >>> NEXT and <<< END (markers excluded)
  nextCommand: string | null; // pipeline-<x> parsed from the handoff, when present
}

export interface StateModel {
  repo: string;
  branch: string;
  pr: string | null;
  feature: string;
  stage: Stage;
  stageOrder: Stage[];
  cards: Card[];
  lanes: Record<CardStatus, Card[]>;
  warnings: string[];
  // --- journal-aware projection (CONTRACT: journal tail is the authority) ---
  journal: JournalEntry[];                       // append/file order (tail = last); [] when no journal.md
  stageSource: "journal" | "current.json";       // which source `stage` was resolved from
  liveStatus: JournalStatus | null;              // tail entry status; null when no journal
  nextCommand: string | null;                    // tail handoff's next pipeline command
  by: string | null;                             // who ran the most recent stage; null when no journal
  featureBlocked: boolean;                        // feature-level block (tail failed/blocked or →hunt)
  integrationReports: string[];                   // reviews/integration-NN.md paths found
}
