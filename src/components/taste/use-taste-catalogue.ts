"use client";

import { useCallback, useEffect, useState } from "react";
import type { TasteCatalogue } from "@/lib/taste";

export type CatalogueState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; catalogue: TasteCatalogue }
  | { status: "error"; message: string };

type Settled = Exclude<CatalogueState, { status: "loading" }>;

let loaded: TasteCatalogue | null = null;
let inflight: Promise<TasteCatalogue> | null = null;

async function requestCatalogue(): Promise<TasteCatalogue> {
  const response = await fetch("/api/taste-data");
  if (!response.ok) throw new Error(`Film details failed to load (${response.status}). Try again in a moment.`);
  loaded = (await response.json()) as TasteCatalogue;
  return loaded;
}

function loadCatalogue(): Promise<TasteCatalogue> {
  if (loaded) return Promise.resolve(loaded);
  inflight ??= requestCatalogue().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Fetches film attributes once `enabled`, sharing one request across every caller. */
export function useTasteCatalogue(enabled: boolean): { state: CatalogueState; retry: () => void } {
  const [settled, setSettled] = useState<Settled>(() => (loaded ? { status: "ready", catalogue: loaded } : { status: "idle" }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadCatalogue().then(
      (catalogue) => {
        if (!cancelled) setSettled({ status: "ready", catalogue });
      },
      (error: unknown) => {
        if (!cancelled) setSettled({ status: "error", message: error instanceof Error ? error.message : "Film details failed to load." });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    setSettled({ status: "idle" });
    setAttempt((count) => count + 1);
  }, []);

  const state: CatalogueState = settled.status === "idle" && enabled ? { status: "loading" } : settled;
  return { state, retry };
}
