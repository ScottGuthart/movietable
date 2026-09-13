"use client";

import { useCallback, useEffect, useState } from "react";
import type { FilmDetail } from "@/lib/catalogue";

export type FilmDetailState =
  | { status: "loading" }
  | { status: "ready"; detail: FilmDetail }
  | { status: "error"; message: string };

const cache = new Map<string, FilmDetail>();
const inflight = new Map<string, Promise<FilmDetail>>();

async function request(slug: string): Promise<FilmDetail> {
  const response = await fetch(`/api/film/${encodeURIComponent(slug)}`);
  if (!response.ok) throw new Error(`Film details failed to load (${response.status}). Try again in a moment.`);
  const detail = (await response.json()) as FilmDetail;
  cache.set(slug, detail);
  return detail;
}

function load(slug: string): Promise<FilmDetail> {
  const cached = cache.get(slug);
  if (cached) return Promise.resolve(cached);
  let pending = inflight.get(slug);
  if (!pending) {
    pending = request(slug).finally(() => inflight.delete(slug));
    inflight.set(slug, pending);
  }
  return pending;
}

interface Settled {
  slug: string;
  attempt: number;
  state: Exclude<FilmDetailState, { status: "loading" }>;
}

/** Loads one film's detail once per session, sharing the request across every open row for that slug. */
export function useFilmDetail(slug: string): { state: FilmDetailState; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    let cancelled = false;
    load(slug).then(
      (detail) => { if (!cancelled) setSettled({ slug, attempt, state: { status: "ready", detail } }); },
      (error: unknown) => {
        if (!cancelled) setSettled({ slug, attempt, state: { status: "error", message: error instanceof Error ? error.message : "Film details failed to load." } });
      },
    );
    return () => { cancelled = true; };
  }, [slug, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  const cached = cache.get(slug);
  const state: FilmDetailState =
    settled && settled.slug === slug && settled.attempt === attempt ? settled.state
    : cached ? { status: "ready", detail: cached }
    : { status: "loading" };
  return { state, retry };
}
