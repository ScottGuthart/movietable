"use client";

import { useCallback, useMemo, useState } from "react";
import { setVerdict, useTastePersistence, useTasteVerdicts } from "@/components/taste/taste-store";
import { useTasteCatalogue, type CatalogueState } from "@/components/taste/use-taste-catalogue";
import type { ScoredMovie } from "@/lib/movies";
import {
  buildProfile,
  dealHand,
  explainMatch,
  HAND_SIZE,
  hasPositive,
  rankMovies,
  ratedCount,
  summarizeProfile,
  type MatchReason,
  type TasteFilm,
  UNKNOWN_PERSON,
  type Verdict,
  type Verdicts,
} from "@/lib/taste";

export interface HandFilm {
  slug: string;
  title: string;
  year: number;
  link: string;
  popularity: number | null;
  genres: string[];
  /** Director display names. */
  directors: string[];
  language: string | null;
  summary: string | null;
}

export interface Taste {
  verdicts: Verdicts;
  persistent: boolean;
  positive: boolean;
  rated: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** True once a liked film and the attribute catalogue are both present. */
  active: boolean;
  state: CatalogueState;
  retry: () => void;
  ranked: ScoredMovie[];
  summary: string[];
  hand: HandFilm[];
  handTotal: number;
  dealAnother: () => void;
  rate: (slug: string, verdict: Verdict | null) => void;
  explain: (slug: string) => MatchReason[];
  unavailableReason: (movie: ScoredMovie) => string | undefined;
}

function toHandFilm(movie: ScoredMovie, film: TasteFilm, people: string[]): HandFilm {
  return {
    slug: movie.slug,
    title: movie.title,
    year: movie.year,
    link: movie.link,
    popularity: movie.popularity,
    genres: film.genres,
    directors: film.directors.map((index) => people[index] ?? UNKNOWN_PERSON),
    language: film.language,
    summary: film.summary,
  };
}

/** Joins saved verdicts, the lazily loaded attribute catalogue, and the scored table into one taste model. */
export function useTaste(movies: ScoredMovie[]): Taste {
  const verdicts = useTasteVerdicts();
  const persistent = useTastePersistence();
  const [open, setOpen] = useState(false);
  const [dealOffset, setDealOffset] = useState(0);

  const rated = ratedCount(verdicts);
  const positive = hasPositive(verdicts);
  const { state, retry } = useTasteCatalogue(open || rated > 0);
  const catalogue = state.status === "ready" ? state.catalogue : null;

  const films = useMemo(() => new Map((catalogue?.films ?? []).map((film) => [film.slug, film])), [catalogue]);
  const profile = useMemo(() => (catalogue ? buildProfile(catalogue, verdicts) : null), [catalogue, verdicts]);
  const active = profile !== null && positive;
  const ranked = useMemo(() => rankMovies(movies, catalogue, verdicts), [movies, catalogue, verdicts]);
  const summary = useMemo(
    () => (active && profile && catalogue ? summarizeProfile(profile, catalogue.people) : []),
    [active, profile, catalogue],
  );

  const candidates = useMemo(() => {
    if (!catalogue) return [];
    return movies.flatMap((movie) => {
      const film = films.get(movie.slug);
      return !film || verdicts[movie.slug] ? [] : [toHandFilm(movie, film, catalogue.people)];
    });
  }, [movies, films, verdicts, catalogue]);
  const offset = dealOffset < candidates.length ? dealOffset : 0;
  const hand = useMemo(() => dealHand(candidates, offset), [candidates, offset]);
  const dealAnother = useCallback(
    () => setDealOffset((current) => (current + HAND_SIZE >= candidates.length ? 0 : current + HAND_SIZE)),
    [candidates.length],
  );

  const explain = useCallback(
    (slug: string): MatchReason[] => {
      const film = films.get(slug);
      return profile && film && catalogue ? explainMatch(profile, film, catalogue.people) : [];
    },
    [films, profile, catalogue],
  );
  const unavailableReason = useCallback(
    (movie: ScoredMovie): string | undefined => {
      if (!active) return undefined;
      if (!films.has(movie.slug)) return "No details for this film";
      if (movie.finalScore === null) return "No Final Score for this film";
      return undefined;
    },
    [active, films],
  );

  return {
    verdicts, persistent, positive, rated, open, setOpen, active, state, retry, ranked, summary,
    hand, handTotal: candidates.length, dealAnother, rate: setVerdict, explain, unavailableReason,
  };
}
