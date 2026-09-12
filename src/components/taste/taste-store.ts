"use client";

import { useSyncExternalStore } from "react";
import type { StampedVerdicts } from "@/lib/ratings-sync";
import { parseVerdict, type Verdict, type Verdicts } from "@/lib/taste";

const STORAGE_KEY = "movietable.taste.v1";
const EMPTY: Verdicts = {};

interface Stored {
  verdicts: Verdicts;
  /** Milliseconds since the epoch per slug; missing for verdicts saved before sync existed. */
  updatedAt: Record<string, number>;
}

let current: Stored | null = null;
let persistent = true;
const listeners = new Set<() => void>();

function parseStored(raw: string): Stored {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !("verdicts" in parsed)) return { verdicts: {}, updatedAt: {} };
  const { verdicts, updatedAt } = parsed as { verdicts: unknown; updatedAt?: unknown };
  if (!verdicts || typeof verdicts !== "object") return { verdicts: {}, updatedAt: {} };
  const kept: Verdicts = {};
  for (const [slug, value] of Object.entries(verdicts)) {
    const verdict = parseVerdict(value);
    if (verdict !== null) kept[slug] = verdict;
  }
  const stamps = updatedAt && typeof updatedAt === "object" ? (updatedAt as Record<string, unknown>) : {};
  return {
    verdicts: kept,
    updatedAt: Object.fromEntries(Object.keys(kept).map((slug) => [slug, typeof stamps[slug] === "number" ? (stamps[slug] as number) : 0])),
  };
}

function load(): Stored {
  if (current) return current;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    persistent = false;
  }
  try {
    current = raw ? parseStored(raw) : { verdicts: {}, updatedAt: {} };
  } catch (error) {
    console.warn(`Ignoring unreadable saved ratings under ${STORAGE_KEY}.`, error);
    current = { verdicts: {}, updatedAt: {} };
  }
  return current;
}

function loadVerdicts(): Verdicts {
  return load().verdicts;
}

function save(next: Stored): void {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    persistent = true;
  } catch {
    persistent = false;
  }
  for (const listener of listeners) listener();
}

export function setVerdict(slug: string, verdict: Verdict | null): void {
  const { verdicts, updatedAt } = load();
  const next: Stored = { verdicts: { ...verdicts }, updatedAt: { ...updatedAt } };
  if (verdict === null) {
    delete next.verdicts[slug];
    delete next.updatedAt[slug];
  } else {
    next.verdicts[slug] = verdict;
    next.updatedAt[slug] = Date.now();
  }
  save(next);
}

export function clearVerdicts(): void {
  save({ verdicts: {}, updatedAt: {} });
}

/** Verdicts with their timestamps, for syncing with an account. */
export function getStampedVerdicts(): StampedVerdicts {
  const { verdicts, updatedAt } = load();
  return Object.fromEntries(Object.entries(verdicts).map(([slug, verdict]) => [slug, { verdict, updatedAt: updatedAt[slug] ?? 0 }]));
}

/** Replaces every saved verdict, used after merging with an account's ratings. */
export function replaceVerdicts(stamped: StampedVerdicts): void {
  const next: Stored = { verdicts: {}, updatedAt: {} };
  for (const [slug, entry] of Object.entries(stamped)) {
    next.verdicts[slug] = entry.verdict;
    next.updatedAt[slug] = entry.updatedAt;
  }
  save(next);
}

export function subscribeToVerdicts(listener: () => void): () => void {
  return subscribe(listener);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    current = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readPersistent(): boolean {
  load();
  return persistent;
}

/** The visitor's saved verdicts; empty on the server and during hydration. */
export function useTasteVerdicts(): Verdicts {
  return useSyncExternalStore(subscribe, loadVerdicts, () => EMPTY);
}

/** False once a write to localStorage has failed, so the UI can say ratings will not survive the session. */
export function useTastePersistence(): boolean {
  return useSyncExternalStore(subscribe, readPersistent, () => true);
}
