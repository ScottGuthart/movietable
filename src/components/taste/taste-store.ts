"use client";

import { useSyncExternalStore } from "react";
import type { Verdict, Verdicts } from "@/lib/taste";

const STORAGE_KEY = "movietable.taste.v1";
const EMPTY: Verdicts = {};
const VERDICTS = new Set<string>(["like", "pass", "skip"]);

let current: Verdicts | null = null;
let persistent = true;
const listeners = new Set<() => void>();

function parseStored(raw: string): Verdicts {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !("verdicts" in parsed)) return {};
  const verdicts = (parsed as { verdicts: unknown }).verdicts;
  if (!verdicts || typeof verdicts !== "object") return {};
  return Object.fromEntries(Object.entries(verdicts).filter(([, verdict]) => typeof verdict === "string" && VERDICTS.has(verdict))) as Verdicts;
}

function load(): Verdicts {
  if (current) return current;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    persistent = false;
  }
  try {
    current = raw ? parseStored(raw) : {};
  } catch (error) {
    console.warn(`Ignoring unreadable saved ratings under ${STORAGE_KEY}.`, error);
    current = {};
  }
  return current;
}

function save(next: Verdicts): void {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ verdicts: next }));
    persistent = true;
  } catch {
    persistent = false;
  }
  for (const listener of listeners) listener();
}

export function setVerdict(slug: string, verdict: Verdict | null): void {
  const next = { ...load() };
  if (verdict === null) delete next[slug];
  else next[slug] = verdict;
  save(next);
}

export function clearVerdicts(): void {
  save({});
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
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

/** False once a write to localStorage has failed, so the UI can say ratings will not survive the session. */
export function useTastePersistence(): boolean {
  return useSyncExternalStore(subscribe, readPersistent, () => true);
}
