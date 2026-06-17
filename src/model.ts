export const STAGE_ORDER = ["prd", "arch", "task", "impl", "review", "done"] as const;
export type Stage = (typeof STAGE_ORDER)[number];

export const CARD_STATUSES = ["todo", "in-progress", "review", "done", "blocked"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export interface Card {
  id: string;
  title: string;
  status: CardStatus;
  attempts: number;
  specRev: string | null;
  isBlocked: boolean;
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
}
