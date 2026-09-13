import type { RawMovie } from "@/lib/movies";
import type { TasteCatalogue, TasteFilm } from "@/lib/taste";

/** A row of the Supabase `movies` table as PostgREST returns it; the slug is the key. */
export interface MovieRow {
  slug: string;
  title: string;
  year: number | null;
  metascore: number | null;
  userscore: number | null;
  users_rated: number | null;
  link: string;
}

export interface CreditRow {
  role: "director" | "writer" | "cast";
  billing: number;
  person_slug: string;
  people: { name: string };
}

/** A `movies` row with its genres and credits embedded by PostgREST. */
export interface TasteRow {
  slug: string;
  year: number | null;
  summary: string | null;
  movie_genres: { genre_name: string }[];
  credits: CreditRow[];
}

const PAGE_SIZE = 1000;
/** Nested credits make taste rows heavy; smaller pages keep each response under Next's 2 MB fetch-cache limit. */
const TASTE_PAGE_SIZE = 300;
const CAST_LIMIT = 8;
const REVALIDATE_SECONDS = 86400;

const MOVIE_SELECT = "slug,title,year,metascore,userscore,users_rated,link";
const TASTE_SELECT = "slug,year,summary,movie_genres(genre_name),credits(role,billing,person_slug,people(name))";

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_ATTEMPTS = 4;
const DEFAULT_BASE_DELAY_MS = 1000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches with doubling waits on 5xx responses and network errors, the failures a
 * build sees while the self-hosted Supabase restarts. Client errors return at once.
 */
export type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

export async function fetchWithRetry(
  fetchImpl: FetchLike,
  url: string | URL,
  init: RequestInit,
  { attempts = DEFAULT_ATTEMPTS, baseDelayMs = DEFAULT_BASE_DELAY_MS, sleep = wait }: RetryOptions = {},
): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    const last = attempt >= attempts - 1;
    if (attempt > 0) await sleep(baseDelayMs * 2 ** (attempt - 1));
    try {
      const response = await fetchImpl(url, init);
      if (response.status < 500 || last) return response;
    } catch (error) {
      if (last) throw error;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env before running or building MovieTable.`);
  }
  return value;
}

/** Walks a table in ascending key order until a page comes back short. */
export async function pageAll<T>(
  fetchPage: (afterKey: string, limit: number) => Promise<T[]>,
  keyOf: (row: T) => string,
  limit = PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  let afterKey = "";
  for (;;) {
    const page = await fetchPage(afterKey, limit);
    rows.push(...page);
    const last = page.at(-1);
    if (page.length < limit || !last) return rows;
    afterKey = keyOf(last);
  }
}

async function fetchRows<T>(select: string, afterSlug: string, limit: number): Promise<T[]> {
  const key = requireEnv("SUPABASE_ANON_KEY");
  const url = new URL(`${requireEnv("SUPABASE_URL")}/rest/v1/movies`);
  url.searchParams.set("select", select);
  url.searchParams.set("slug", `gt.${afterSlug}`);
  url.searchParams.set("order", "slug");
  url.searchParams.set("limit", String(limit));
  const response = await fetchWithRetry(fetch, url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    const body = (await response.text()).replace(/\s+/g, " ").slice(0, 200);
    throw new Error(
      `Supabase at ${url.host} returned ${response.status} ${response.statusText} for the movies table` +
        `${body ? ` (${body})` : ""}. Check SUPABASE_URL and that the anon role can read the catalogue.`,
    );
  }
  return (await response.json()) as T[];
}

export function toRawMovies(rows: MovieRow[]): { movies: RawMovie[]; dropped: number } {
  const movies: RawMovie[] = [];
  for (const row of rows) {
    if (row.year === null) continue;
    movies.push({
      slug: row.slug,
      title: row.title,
      year: row.year,
      metascore: row.metascore,
      userscore: row.userscore,
      users_rated: row.users_rated,
      link: row.link,
    });
  }
  return { movies, dropped: rows.length - movies.length };
}

const SUMMARY_LIMIT = 160;
const SENTENCE_FLOOR = 0.4;

/** Trims a summary for a card: whole sentences when one fits comfortably, otherwise a word cut with an ellipsis. */
export function truncateSummary(text: string | null, limit = SUMMARY_LIMIT): string | null {
  if (text === null) return null;
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  const head = trimmed.slice(0, limit);
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentenceEnd >= limit * SENTENCE_FLOOR) return head.slice(0, sentenceEnd + 1);
  const wordEnd = head.lastIndexOf(" ");
  const cut = head.slice(0, wordEnd > 0 ? wordEnd : limit - 1).replace(/[,;:]$/, "");
  return `${cut}…`;
}

interface RetainedCredits {
  row: TasteRow;
  directors: CreditRow[];
  writers: CreditRow[];
  cast: CreditRow[];
}

function retainCredits(row: TasteRow): RetainedCredits {
  const byRole: Record<CreditRow["role"], CreditRow[]> = { director: [], writer: [], cast: [] };
  for (const credit of [...row.credits].sort((a, b) => a.billing - b.billing)) byRole[credit.role].push(credit);
  return { row, directors: byRole.director, writers: byRole.writer, cast: byRole.cast.slice(0, CAST_LIMIT) };
}

/** Builds the browser payload: films reference people by index into one sorted name list. */
export function toTasteCatalogue(rows: TasteRow[]): TasteCatalogue {
  const retained = rows.map(retainCredits);
  const names = new Map<string, string>();
  for (const { directors, writers, cast } of retained) {
    for (const credit of [...directors, ...writers, ...cast]) names.set(credit.person_slug, credit.people.name);
  }
  const slugs = [...names.keys()].sort();
  const indexOf = new Map(slugs.map((slug, index) => [slug, index]));
  const indexes = (credits: CreditRow[]) => credits.map((credit) => indexOf.get(credit.person_slug)!);
  const films = retained.map(({ row, directors, writers, cast }): TasteFilm => ({
    slug: row.slug,
    year: row.year,
    summary: truncateSummary(row.summary),
    genres: row.movie_genres.map((entry) => entry.genre_name),
    directors: indexes(directors),
    writers: indexes(writers),
    cast: indexes(cast),
  }));
  return { films, people: slugs.map((slug) => names.get(slug)!) };
}

/** The full catalogue for the table, read from Supabase and cached for a day. */
export async function fetchCatalogue(): Promise<RawMovie[]> {
  const rows = await pageAll((afterSlug, limit) => fetchRows<MovieRow>(MOVIE_SELECT, afterSlug, limit), (row) => row.slug);
  const { movies, dropped } = toRawMovies(rows);
  if (dropped > 0) console.warn(`Dropped ${dropped} films without a release year from the Supabase catalogue.`);
  if (movies.length === 0) {
    throw new Error("The Supabase movies table returned no films. Seed it with scripts/seed-supabase.ts before building.");
  }
  return movies;
}

/** Genres, credits, and summaries for the taste profile, read from Supabase and cached for a day. */
export async function fetchTasteData(): Promise<TasteCatalogue> {
  const rows = await pageAll((afterSlug, limit) => fetchRows<TasteRow>(TASTE_SELECT, afterSlug, limit), (row) => row.slug, TASTE_PAGE_SIZE);
  return toTasteCatalogue(rows);
}
