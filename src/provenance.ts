import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Snapshot of the observation act — wall clock + observed checkout HEAD.
 * Not part of StateModel (ADR 0007): describes the render, not .pipeline/ content.
 */
export interface Provenance {
  /** ISO-8601 UTC, seconds precision (millis truncated). */
  generatedAt: string;
  /** Absolute path of the observed repo. */
  source: string;
  /** null when non-git, git unavailable, or any rev-parse failure. */
  head: { sha: string; branch: string | null } | null;
}

/**
 * Collect provenance for a board render. Read-only toward `repoPath` —
 * only `git rev-parse` (no fetch/pull/write).
 *
 * `now` is injected so tests stay deterministic.
 */
export function collectProvenance(repoPath: string, now: Date): Provenance {
  // toISOString is always UTC with millis; strip ".NNN" for seconds precision.
  const generatedAt = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const source = resolve(repoPath);

  let head: Provenance["head"] = null;
  try {
    const sha = execFileSync("git", ["-C", source, "rev-parse", "--short", "HEAD"], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    const abbrev = execFileSync("git", ["-C", source, "rev-parse", "--abbrev-ref", "HEAD"], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    // abbrev-ref returns the literal "HEAD" when detached.
    head = { sha, branch: abbrev === "HEAD" ? null : abbrev };
  } catch {
    // non-git dir (exit 128), missing git (ENOENT), or any other failure → degrade.
    head = null;
  }

  return { generatedAt, source, head };
}
