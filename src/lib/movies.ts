export interface RawMovie {
  title: string;
  year: number;
  users_rated?: number | null;
  userscore?: number | null;
  metascore?: number | null;
  link: string;
}

export interface Movie {
  title: string;
  year: number;
  popularity: number | null;
  users: number | null;
  critics: number | null;
  link: string;
}

export interface ScoredMovie extends Movie {
  finalScore: number | null;
}

export const DEFAULT_CRITIC_WEIGHT = 0.5;
export const numberFormat = new Intl.NumberFormat("en-US");

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeMovie(raw: RawMovie): Movie {
  return {
    title: raw.title,
    year: raw.year,
    popularity: finiteOrNull(raw.users_rated),
    users: finiteOrNull(raw.userscore),
    critics: finiteOrNull(raw.metascore),
    link: raw.link,
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
  return movies.map((movie) => ({ ...movie, finalScore: finalScore(movie, criticWeight) }));
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
  return [movie.title, movie.year, movie.popularity, movie.users, movie.critics, movie.finalScore]
    .some((value) => value !== null && String(value).toLocaleLowerCase("en-US").includes(term));
}
