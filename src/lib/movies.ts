export interface RawMovie {
  /** Metacritic film slug; derived from `link` when absent. */
  slug?: string;
  title: string;
  year: number;
  users_rated?: number | null;
  userscore?: number | null;
  metascore?: number | null;
  link: string;
  /** Original language from IMDb/Wikidata, when matched. */
  language?: string | null;
  /** Cleaned Wikidata subgenres, most common first. */
  subgenres?: string[];
  oscar_wins?: number | null;
  oscar_nominations?: number | null;
}

export interface Person {
  /** Metacritic person slug, the path segment of metacritic.com/person/<slug>/. */
  slug: string;
  name: string;
}

/** Facts every film carries inline so the table can search, group, filter, and mark availability without a fetch. */
export interface FilmSignals {
  /** Billing order. */
  directors: Person[];
  writers: Person[];
  genres: string[];
  /** JustWatch provider ids carrying a subscription (flatrate) offer in the US. */
  streamOn: number[];
  /** True when a free or ad-supported offer exists. */
  free: boolean;
}

export interface Movie {
  slug: string;
  title: string;
  year: number;
  popularity: number | null;
  users: number | null;
  critics: number | null;
  link: string;
  language: string | null;
  subgenres: string[];
  /** Academy Award counts from Wikidata; null when the film has no IMDb match. Indicative, not complete. */
  oscarWins: number | null;
  oscarNominations: number | null;
  /** Absent when the catalogue had no credits or offers for the film. */
  signals?: FilmSignals;
}

export interface ScoredMovie extends Movie {
  finalScore: number | null;
  /** Taste match, 0–100. Null until the visitor likes a film; filled by `rankMovies` in taste.ts. */
  forYou: number | null;
}

export const DEFAULT_CRITIC_WEIGHT = 0.5;
export const numberFormat = new Intl.NumberFormat("en-US");

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** The trailing path segment of a Metacritic link, e.g. `the-godfather`. */
export function slugFromLink(link: string): string {
  return link.replace(/\/+$/, "").split("/").pop() ?? "";
}

export function normalizeMovie(raw: RawMovie): Movie {
  return {
    slug: raw.slug ?? slugFromLink(raw.link),
    title: raw.title,
    year: raw.year,
    popularity: finiteOrNull(raw.users_rated),
    users: finiteOrNull(raw.userscore),
    critics: finiteOrNull(raw.metascore),
    link: raw.link,
    language: raw.language ?? null,
    subgenres: raw.subgenres ?? [],
    oscarWins: finiteOrNull(raw.oscar_wins),
    oscarNominations: finiteOrNull(raw.oscar_nominations),
  };
}

export function finalScore(movie: Pick<Movie, "users" | "critics">, criticWeight: number): number | null {
  if (!Number.isFinite(criticWeight) || criticWeight < 0 || criticWeight > 1) {
    throw new RangeError("Critic weight must be between 0 and 1.");
  }
  const users = finiteOrNull(movie.users);
  const critics = finiteOrNull(movie.critics);
  if (criticWeight === 0) return users === null ? null : Math.floor(users);
  if (criticWeight === 1) return critics === null ? null : Math.floor(critics);
  if (users === null || critics === null) return null;
  return Math.floor((1 - criticWeight) * users + criticWeight * critics);
}

export function scoreMovies(movies: Movie[], criticWeight: number): ScoredMovie[] {
  return movies.map((movie) => ({ ...movie, finalScore: finalScore(movie, criticWeight), forYou: null }));
}

export function getMovieBounds(movies: Movie[]) {
  return {
    earliestYear: Math.min(...movies.map((movie) => movie.year)),
    latestYear: Math.max(...movies.map((movie) => movie.year)),
  };
}

export function matchesSearch(movie: ScoredMovie, search: string): boolean {
  const term = search.trim().toLocaleLowerCase("en-US");
  if (!term) return true;
  const people = [...(movie.signals?.directors ?? []), ...(movie.signals?.writers ?? [])].map((person) => person.name);
  return [movie.title, movie.year, movie.popularity, movie.users, movie.critics, movie.finalScore, movie.forYou, ...people]
    .some((value) => value !== null && String(value).toLocaleLowerCase("en-US").includes(term));
}
