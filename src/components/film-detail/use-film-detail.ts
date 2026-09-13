"use client";

import { useEffect, useState } from "react";
import { toFilmDetail, type AwardRow, type FilmDetailData, type FilmDetailRow } from "@/lib/film-detail";
import { getSupabase } from "@/lib/supabase-browser";

export type FilmDetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; detail: FilmDetailData }
  | { status: "error"; message: string };

const DETAIL_SELECT =
  "title,year,summary,justwatch_url,movie_imdb(imdb_id,language,oscar_wins,oscar_nominations),movie_genres(genre_name)," +
  "movie_subgenres(subgenre_name),credits(role,billing,person_slug,people(name)),streaming_offers(monetization,price,quality,url,providers(name))";
const AWARDS_SELECT = "award,category,outcome,year,person_slug,people(name)";
/** PostgREST's code for a relation that does not exist yet; the awards table is planned, not shipped. */
const MISSING_TABLE = "PGRST205";

const cache = new Map<string, FilmDetailData>();

async function loadAwards(slug: string): Promise<AwardRow[]> {
  const { data, error } = await getSupabase().from("movie_awards").select(AWARDS_SELECT).eq("movie_slug", slug);
  if (error) {
    if (error.code === MISSING_TABLE) return [];
    throw new Error(`Loading awards failed: ${error.message}`);
  }
  return data as unknown as AwardRow[];
}

async function loadDetail(slug: string): Promise<FilmDetailData> {
  const cached = cache.get(slug);
  if (cached) return cached;
  const [film, awards] = await Promise.all([
    getSupabase().from("movies").select(DETAIL_SELECT).eq("slug", slug).single(),
    loadAwards(slug),
  ]);
  if (film.error) throw new Error(`Loading details failed: ${film.error.message}`);
  const detail = toFilmDetail(film.data as unknown as FilmDetailRow, awards);
  cache.set(slug, detail);
  return detail;
}

/** Fetches one film's detail once `slug` is set; results are kept for the page's lifetime. */
export function useFilmDetail(slug: string | null): { state: FilmDetailState; retry: () => void } {
  const [settled, setSettled] = useState<Exclude<FilmDetailState, { status: "loading" }>>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    loadDetail(slug).then(
      (detail) => {
        if (!cancelled) setSettled({ status: "ready", detail });
      },
      (error: unknown) => {
        if (!cancelled) setSettled({ status: "error", message: error instanceof Error ? error.message : "Loading details failed." });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  const retry = () => {
    setSettled({ status: "idle" });
    setAttempt((count) => count + 1);
  };
  const state: FilmDetailState = slug && settled.status === "idle" ? { status: "loading" } : settled;
  return { state, retry };
}
