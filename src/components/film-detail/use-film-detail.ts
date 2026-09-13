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
const AWARDS_SELECT = "award_name,result,year,person_name,person_slug";

const cache = new Map<string, FilmDetailData>();
let genreNames: Promise<string[]> | null = null;

/** The catalogue's Metacritic genre vocabulary, fetched once so subgenres never repeat a genre. */
function loadGenreNames(): Promise<string[]> {
  genreNames ??= (async () => {
    const { data, error } = await getSupabase().from("genres").select("name");
    if (error) throw new Error(`Loading genres failed: ${error.message}`);
    return (data as { name: string }[]).map((row) => row.name);
  })();
  return genreNames;
}

/** Awards detail one section of the note, so a failure there reports itself and leaves the rest standing. */
async function loadAwards(slug: string): Promise<AwardRow[]> {
  const { data, error } = await getSupabase().from("movie_awards").select(AWARDS_SELECT).eq("movie_slug", slug);
  if (error) {
    console.warn(`Loading awards for ${slug} failed: ${error.message}`);
    return [];
  }
  return data as unknown as AwardRow[];
}

async function loadDetail(slug: string): Promise<FilmDetailData> {
  const cached = cache.get(slug);
  if (cached) return cached;
  const [film, awards, genres] = await Promise.all([
    getSupabase().from("movies").select(DETAIL_SELECT).eq("slug", slug).single(),
    loadAwards(slug),
    loadGenreNames(),
  ]);
  if (film.error) throw new Error(`Loading details failed: ${film.error.message}`);
  const detail = toFilmDetail(film.data as unknown as FilmDetailRow, awards, genres);
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
