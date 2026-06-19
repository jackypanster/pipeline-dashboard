import { JOURNAL_STATUSES, type JournalEntry, type JournalStatus } from "./model.js";

// Header line of one journal entry, per CONTRACT.md §Run journal:
//   ## seq=N · <ISO8601 UTC> · <from-stage>→<to-stage> · <completed|failed|blocked> · by=<tag>
// The field separator is " · " (U+00B7); the transition arrow is "→" (U+2192).
const HEADER = /^##\s+seq=(\d+)\s*·\s*(.+?)\s*·\s*(.+?)→(.+?)\s*·\s*(\S+)\s*·\s*by=(.+?)\s*$/;

/**
 * Pure parser (no fs): markdown journal body → entries in FILE (append) order.
 * Per CONTRACT.md the *physically last* entry is the authoritative tail, so we preserve
 * append order and never reorder — a non-monotonic `seq` is flagged with a warning instead
 * (it signals a hand-edit/corruption), leaving `.at(-1)` as the true tail.
 * Non-fatal: a malformed entry is skipped with a warning; the rest still parse.
 * fs reading is the caller's job (parse.ts owns I/O — frontmatter.ts/journal.ts stay pure).
 */
export function parseJournal(content: string, warnings: string[]): JournalEntry[] {
  const normalized = content.replace(/^﻿/, "");
  const lines = normalized.split(/\r?\n/);

  // Indices of every `## seq=` header; each entry spans header..next-header.
  const headerIdx: number[] = [];
  lines.forEach((line, index) => {
    if (/^##\s+seq=/.test(line)) {
      headerIdx.push(index);
    }
  });

  const entries: JournalEntry[] = [];
  for (let h = 0; h < headerIdx.length; h += 1) {
    const start = headerIdx[h] ?? 0;
    const end = h + 1 < headerIdx.length ? headerIdx[h + 1] ?? lines.length : lines.length;
    const entry = parseEntry(lines.slice(start, end), warnings);
    if (entry) {
      entries.push(entry);
    }
  }

  // Append order IS the authority; only warn if seq disagrees with it (do not reorder).
  for (let i = 1; i < entries.length; i += 1) {
    const prev = entries[i - 1];
    const curr = entries[i];
    if (prev && curr && curr.seq <= prev.seq) {
      warnings.push(
        `journal seq not monotonic in append order (seq=${prev.seq} then seq=${curr.seq}); ` +
          `using file order as the authoritative tail`,
      );
    }
  }

  return entries;
}

function parseEntry(block: string[], warnings: string[]): JournalEntry | null {
  const headerLine = block[0] ?? "";
  const header = HEADER.exec(headerLine);
  if (!header) {
    warnings.push(`malformed journal entry header: ${headerLine.trim()}`);
    return null;
  }

  const [, seqStr, ts, fromRaw, toRaw, statusRaw, byRaw] = header;
  const seq = Number(seqStr);
  const timestamp = (ts ?? "").trim();
  const from = (fromRaw ?? "").trim();
  const to = (toRaw ?? "").trim();
  const status = coerceStatus((statusRaw ?? "").trim(), seq, warnings);
  const by = (byRaw ?? "").trim() || "?";

  const done: string[] = [];
  const output: string[] = [];
  const handoffLines: string[] = [];
  let inHandoff = false;

  for (const line of block.slice(1)) {
    if (/^>>>\s*NEXT\s*$/.test(line)) {
      inHandoff = true;
      continue;
    }
    if (/^<<<\s*END\s*$/.test(line)) {
      inHandoff = false;
      continue;
    }
    if (inHandoff) {
      handoffLines.push(line);
      continue;
    }

    const doneMatch = /^done:\s*(.*)$/.exec(line);
    if (doneMatch) {
      done.push((doneMatch[1] ?? "").trim());
      continue;
    }
    const outputMatch = /^output:\s*(.*)$/.exec(line);
    if (outputMatch) {
      output.push(...splitPaths(outputMatch[1] ?? ""));
    }
  }

  const handoff = handoffLines.join("\n").trim();

  return {
    seq,
    timestamp,
    from,
    to,
    status,
    by,
    done: done.join(" ").trim(),
    output,
    handoff,
    nextCommand: nextCommandFrom(handoff),
  };
}

function coerceStatus(value: string, seq: number, warnings: string[]): JournalStatus {
  if ((JOURNAL_STATUSES as readonly string[]).includes(value)) {
    return value as JournalStatus;
  }
  warnings.push(`unknown journal status for seq=${seq}: ${value}`);
  return "unknown";
}

function splitPaths(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function nextCommandFrom(handoff: string): string | null {
  const match = /\bRun\s+(pipeline-[\w-]+)/i.exec(handoff);
  return match?.[1] ?? null;
}
