import type { Verdict } from "@/lib/taste";

export interface StampedVerdict {
  verdict: Verdict;
  /** Milliseconds since the epoch when the visitor last set this verdict. */
  updatedAt: number;
}

/** Verdicts with their timestamps, keyed by film slug. */
export type StampedVerdicts = Record<string, StampedVerdict>;

export interface MergeResult {
  /** The union of both sides; on a conflict the newer verdict wins, ties go to the account. */
  merged: StampedVerdicts;
  /** Local verdicts the account lacks or has an older copy of. */
  toUpload: StampedVerdicts;
}

export function mergeVerdicts(local: StampedVerdicts, remote: StampedVerdicts): MergeResult {
  const merged: StampedVerdicts = { ...remote };
  const toUpload: StampedVerdicts = {};
  for (const [slug, entry] of Object.entries(local)) {
    const theirs = remote[slug];
    if (theirs && theirs.updatedAt >= entry.updatedAt) continue;
    merged[slug] = entry;
    toUpload[slug] = entry;
  }
  return { merged, toUpload };
}

export interface VerdictDiff {
  upserts: StampedVerdicts;
  deletes: string[];
}

/** What changed locally since `previous`: entries that are new or newer, and slugs that disappeared. */
export function diffVerdicts(previous: StampedVerdicts, current: StampedVerdicts): VerdictDiff {
  const upserts: StampedVerdicts = {};
  for (const [slug, entry] of Object.entries(current)) {
    const before = previous[slug];
    if (!before || entry.updatedAt > before.updatedAt) upserts[slug] = entry;
  }
  const deletes = Object.keys(previous).filter((slug) => !(slug in current));
  return { upserts, deletes };
}
