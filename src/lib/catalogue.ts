import type { RawMovie } from "@/lib/movies";
import type { TasteCatalogue, TasteFilm } from "@/lib/taste";

/** A row of the Supabase `movies` table as PostgREST returns it. */
export interface MovieRow {
  id: number;
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
  people: { slug: string; name: string };
}

/** A `movies` row with its genres and credits embedded by PostgREST. */
export interface TasteRow {
  id: number;
  slug: string;
  year: number | null;
  summary: string | null;
  movie_genres: { genres: { name: string } }[];
  credits: CreditRow[];
}

const PAGE_SIZE = 1000;
/** Nested credits make taste rows heavy; smaller pages keep each response under Next's 2 MB fetch-cache limit. */
const TASTE_PAGE_SIZE = 300;
const CAST_LIMIT = 8;
const REVALIDATE_SECONDS = 86400;

const MOVIE_SELECT = "id,slug,title,year,metascore,userscore,users_rated,link";
const TASTE_SELECT = "id,slug,year,summary,movie_genres(genres(name)),credits(role,billing,people(slug,name))";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env before running or building MovieTable.`);
  }
  return value;
}

/** Walks a table by ascending id until a page comes back short. */
export async function pageAll<T extends { id: number }>(
  fetchPage: (afterId: number, limit: number) => Promise<T[]>,
  limit = PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  let afterId = 0;
  for (;;) {
    const page = await fetchPage(afterId, limit);
    rows.push(...page);
    const last = page.at(-1);
    if (page.length < limit || !last) return rows;
    afterId = last.id;
  }
}

async function fetchRows<T>(select: string, afterId: number, limit: number): Promise<T[]> {
  const key = requireEnv("SUPABASE_ANON_KEY");
  const url = new URL(`${requireEnv("SUPABASE_URL")}/rest/v1/movies`);
  url.searchParams.set("select", select);
  url.searchParams.set("id", `gt.${afterId}`);
  url.searchParams.set("order", "id");
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(
      `Supabase returned ${response.status} ${response.statusText} for the movies table. ` +
        "Check SUPABASE_URL and that the anon role can read the catalogue.",
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
    for (const credit of [...directors, ...writers, ...cast]) names.set(credit.people.slug, credit.people.name);
  }
  const slugs = [...names.keys()].sort();
  const indexOf = new Map(slugs.map((slug, index) => [slug, index]));
  const indexes = (credits: CreditRow[]) => credits.map((credit) => indexOf.get(credit.people.slug)!);
  const films = retained.map(({ row, directors, writers, cast }): TasteFilm => ({
    slug: row.slug,
    year: row.year,
    summary: truncateSummary(row.summary),
    genres: row.movie_genres.map((entry) => entry.genres.name),
    directors: indexes(directors),
    writers: indexes(writers),
    cast: indexes(cast),
  }));
  return { films, people: slugs.map((slug) => names.get(slug)!) };
}

/** The full catalogue for the table, read from Supabase and cached for a day. */
export async function fetchCatalogue(): Promise<RawMovie[]> {
  const rows = await pageAll((afterId, limit) => fetchRows<MovieRow>(MOVIE_SELECT, afterId, limit));
  const { movies, dropped } = toRawMovies(rows);
  if (dropped > 0) console.warn(`Dropped ${dropped} films without a release year from the Supabase catalogue.`);
  if (movies.length === 0) {
    throw new Error("The Supabase movies table returned no films. Seed it with scripts/seed-supabase.ts before building.");
  }
  return movies;
}

/** Genres, credits, and summaries for the taste profile, read from Supabase and cached for a day. */
export async function fetchTasteData(): Promise<TasteCatalogue> {
  const rows = await pageAll((afterId, limit) => fetchRows<TasteRow>(TASTE_SELECT, afterId, limit), TASTE_PAGE_SIZE);
  return toTasteCatalogue(rows);
}
