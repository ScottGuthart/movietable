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
  /** Popularity as a catalogue percentile, 0-100. Null when the film has no rating count. */
  popularityScore: number | null;
  finalScore: number | null;
  /** Taste match, 0–100. Null until the visitor likes a film; filled by `rankMovies` in taste.ts. */
  forYou: number | null;
}

export const DEFAULT_CRITIC_WEIGHT = 0.5;
/** Popularity stays out of the blend until the visitor asks for it, so Final Score is unchanged on arrival. */
export const DEFAULT_POPULARITY_WEIGHT = 0;
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

/**
 * Popularity as a percentile of the catalogue, 0-100.
 *
 * Rating counts run from a handful to six figures and are heavily skewed, so a
 * linear rescale would press nearly every film against zero. A percentile answers
 * what the count is actually read for - how widely seen is this, against everything
 * else here - and lands on the same scale as the scores.
 */
export function popularityPercentiles(movies: Pick<Movie, "popularity">[]): (number | null)[] {
  const counts = movies.map((movie) => finiteOrNull(movie.popularity));
  const ranked = counts.filter((count): count is number => count !== null).sort((a, b) => a - b);
  if (ranked.length === 0) return counts.map(() => null);
  const cut = (value: number, orEqual: boolean) => {
    let low = 0;
    let high = ranked.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (orEqual ? ranked[mid]! <= value : ranked[mid]! < value) low = mid + 1;
      else high = mid;
    }
    return low;
  };
  // Midrank, so films on the same count share one percentile.
  return counts.map((count) => (count === null ? null : Math.round(((cut(count, false) + cut(count, true)) / 2 / ranked.length) * 100)));
}

function checkWeight(weight: number, name: string): void {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new RangeError(name + " must be between 0 and 1.");
}

/** A weight of 0 or 1 takes that side alone, so a missing value on the unused side never voids the result. */
function weighted(low: number | null, high: number | null, weight: number): number | null {
  if (weight === 0) return low;
  if (weight === 1) return high;
  if (low === null || high === null) return null;
  return (1 - weight) * low + weight * high;
}

/**
 * The visitor-weighted blend, rounded down. Critic weight slides between the
 * audience and critic scores; popularity weight then mixes in how widely seen
 * the film is. At zero popularity weight this is the critic/audience blend alone.
 */
export function finalScore(
  movie: Pick<Movie, "users" | "critics"> & Partial<Pick<ScoredMovie, "popularityScore">>,
  criticWeight: number,
  popularityWeight: number = DEFAULT_POPULARITY_WEIGHT,
): number | null {
  checkWeight(criticWeight, "Critic weight");
  checkWeight(popularityWeight, "Popularity weight");
  const base = weighted(finiteOrNull(movie.users), finiteOrNull(movie.critics), criticWeight);
  const blended = weighted(base, finiteOrNull(movie.popularityScore ?? null), popularityWeight);
  return blended === null ? null : Math.floor(blended);
}

export function scoreMovies(movies: Movie[], criticWeight: number, popularityWeight: number = DEFAULT_POPULARITY_WEIGHT): ScoredMovie[] {
  const percentiles = popularityPercentiles(movies);
  return movies.map((movie, index) => {
    const popularityScore = percentiles[index] ?? null;
    return { ...movie, popularityScore, finalScore: finalScore({ ...movie, popularityScore }, criticWeight, popularityWeight), forYou: null };
  });
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
