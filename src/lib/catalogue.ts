import { awardLines, imdbUrl, type AwardRow, type AwardSummary } from "@/lib/film-detail";
import type { FilmSignals, Person, RawMovie } from "@/lib/movies";
import type { TasteCatalogue, TasteFilm } from "@/lib/taste";

export interface ImdbRow {
  language: string | null;
  oscar_wins: number | null;
  oscar_nominations: number | null;
}

/** A row of the Supabase `movies` table with its enrichment embedded; the slug is the key. */
export interface MovieRow {
  slug: string;
  title: string;
  year: number | null;
  metascore: number | null;
  userscore: number | null;
  users_rated: number | null;
  link: string;
  justwatch_url: string | null;
  movie_imdb: ImdbRow | null;
  movie_genres: { genre_name: string }[];
  movie_subgenres: { subgenre_name: string }[];
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
  movie_imdb: { language: string | null } | null;
  movie_genres: { genre_name: string }[];
  movie_subgenres: { subgenre_name: string }[];
  credits: CreditRow[];
}

const PAGE_SIZE = 1000;
/** Nested credits make taste rows heavy; smaller pages keep each response under Next's 2 MB fetch-cache limit. */
const TASTE_PAGE_SIZE = 300;
const CAST_LIMIT = 8;
const REVALIDATE_SECONDS = 86400;

const MOVIE_SELECT =
  "slug,title,year,metascore,userscore,users_rated,link,justwatch_url," +
  "movie_imdb(language,oscar_wins,oscar_nominations),movie_genres(genre_name),movie_subgenres(subgenre_name)";
const TASTE_SELECT =
  "slug,year,summary,movie_imdb(language),movie_genres(genre_name),movie_subgenres(subgenre_name)," +
  "credits(role,billing,person_slug,people(name))";

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

/** One PostgREST read of `table` with the given query parameters. */
async function fetchTable<T>(table: string, params: Record<string, string>): Promise<T[]> {
  const key = requireEnv("SUPABASE_ANON_KEY");
  const url = new URL(`${requireEnv("SUPABASE_URL")}/rest/v1/${table}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetchWithRetry(fetch, url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    const body = (await response.text()).replace(/\s+/g, " ").slice(0, 200);
    throw new Error(
      `Supabase at ${url.host} returned ${response.status} ${response.statusText} for the ${table} table` +
        `${body ? ` (${body})` : ""}. Check SUPABASE_URL and that the anon role can read the catalogue.`,
    );
  }
  return (await response.json()) as T[];
}

async function fetchRows<T>(select: string, afterSlug: string, limit: number, extra: Record<string, string> = {}): Promise<T[]> {
  return fetchTable<T>("movies", { select, slug: `gt.${afterSlug}`, order: "slug", limit: String(limit), ...extra });
}

/** Turns a Wikidata film-genre label into a sentence-case subgenre: "crime drama film" becomes "Crime drama". */
export function cleanSubgenre(label: string): string {
  const stripped = label.trim().replace(/\s+films?$/i, "").trim() || label.trim();
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

interface SubgenreContext {
  /** How many films carry each cleaned label. */
  frequency: Map<string, number>;
  /** Every Metacritic genre in the catalogue, lower-cased; a subgenre that repeats one adds nothing. */
  genres: Set<string>;
}

/** Cleaned subgenres for one film, without Metacritic genres, ordered by how common each is across the catalogue. */
function filmSubgenres(subgenres: { subgenre_name: string }[], context: SubgenreContext): string[] {
  const labels = [...new Set(subgenres.map((entry) => cleanSubgenre(entry.subgenre_name)))]
    .filter((label) => !context.genres.has(label.toLocaleLowerCase("en-US")));
  return labels.sort((a, b) => (context.frequency.get(b) ?? 0) - (context.frequency.get(a) ?? 0) || a.localeCompare(b, "en-US"));
}

function subgenreContext(rows: { movie_subgenres: { subgenre_name: string }[]; movie_genres: { genre_name: string }[] }[]): SubgenreContext {
  const frequency = new Map<string, number>();
  const genres = new Set<string>();
  for (const row of rows) {
    for (const entry of row.movie_genres) genres.add(entry.genre_name.toLocaleLowerCase("en-US"));
    for (const label of new Set(row.movie_subgenres.map((entry) => cleanSubgenre(entry.subgenre_name)))) {
      frequency.set(label, (frequency.get(label) ?? 0) + 1);
    }
  }
  return { frequency, genres };
}

export function toRawMovies(rows: MovieRow[]): { movies: RawMovie[]; dropped: number } {
  const context = subgenreContext(rows);
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
      language: row.movie_imdb?.language ?? null,
      subgenres: filmSubgenres(row.movie_subgenres, context),
      oscar_wins: row.movie_imdb?.oscar_wins ?? null,
      oscar_nominations: row.movie_imdb?.oscar_nominations ?? null,
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
  const context = subgenreContext(rows);
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
    subgenres: filmSubgenres(row.movie_subgenres, context),
    language: row.movie_imdb?.language ?? null,
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

/** Streaming, rental, and purchase services, keyed on JustWatch provider ids. */
export interface Provider {
  id: number;
  name: string;
  icon_url: string | null;
}

export type Monetization = "flatrate" | "free" | "ads" | "rent" | "buy";

/** A `movies` row with the light embeds every film carries inline. */
export interface SignalRow {
  slug: string;
  movie_genres: { genre_name: string }[];
  credits: CreditRow[];
  streaming_offers: { provider_id: number; monetization: Monetization }[];
}

const SIGNAL_SELECT =
  "slug,movie_genres(genre_name),credits(role,billing,person_slug,people(name)),streaming_offers(provider_id,monetization)";
const SIGNAL_PAGE_SIZE = 500;
const SIGNAL_PARAMS = {
  "credits.role": "in.(director,writer)",
  "credits.order": "billing",
  "streaming_offers.monetization": "in.(flatrate,free,ads)",
};

function people(credits: CreditRow[], role: CreditRow["role"]): Person[] {
  return credits
    .filter((credit) => credit.role === role)
    .sort((a, b) => a.billing - b.billing)
    .map((credit) => ({ slug: credit.person_slug, name: credit.people.name }));
}

/** Folds signal rows into a slug-keyed map; subscription providers are deduplicated and sorted by id. */
export function toSignals(rows: SignalRow[]): Record<string, FilmSignals> {
  const signals: Record<string, FilmSignals> = {};
  for (const row of rows) {
    const streamOn = [...new Set(row.streaming_offers.filter((offer) => offer.monetization === "flatrate").map((offer) => offer.provider_id))].sort((a, b) => a - b);
    signals[row.slug] = {
      directors: people(row.credits, "director"),
      writers: people(row.credits, "writer"),
      genres: row.movie_genres.map((entry) => entry.genre_name),
      streamOn,
      free: row.streaming_offers.some((offer) => offer.monetization === "free" || offer.monetization === "ads"),
    };
  }
  return signals;
}

/** Directors, writers, genres, and subscription availability for every film, cached for a day. */
export async function fetchSignals(): Promise<Record<string, FilmSignals>> {
  const rows = await pageAll(
    (afterSlug, limit) => fetchRows<SignalRow>(SIGNAL_SELECT, afterSlug, limit, SIGNAL_PARAMS),
    (row) => row.slug,
    SIGNAL_PAGE_SIZE,
  );
  return toSignals(rows);
}

/** Every provider the offers table refers to, cached for a day. */
export async function fetchProviders(): Promise<Provider[]> {
  return fetchTable<Provider>("providers", { select: "id,name,icon_url", order: "id" });
}

export interface OfferRow {
  monetization: Monetization;
  quality: string;
  url: string;
  /** PostgREST returns numerics as strings. */
  price: number | string | null;
  currency_code: string | null;
  providers: Provider;
}

/** A `movies` row with everything the detail band shows. */
export interface DetailRow {
  slug: string;
  summary: string | null;
  justwatch_url: string | null;
  movie_imdb: { imdb_id: string } | null;
  movie_genres: { genre_name: string }[];
  credits: (CreditRow & { character: string | null })[];
  streaming_offers: OfferRow[];
}

export interface FilmOffer {
  providerId: number;
  provider: string;
  iconUrl: string | null;
  monetization: Monetization;
  quality: string;
  url: string;
  price: number | null;
  currency: string | null;
}

export interface CastMember extends Person {
  character: string | null;
}

export interface FilmDetail {
  slug: string;
  summary: string | null;
  justwatchUrl: string | null;
  imdbUrl: string | null;
  genres: string[];
  directors: Person[];
  writers: Person[];
  /** Top-billed cast, at most `CAST_LIMIT`. */
  cast: CastMember[];
  castTotal: number;
  offers: FilmOffer[];
  /** Oscar categories from `movie_awards`: wins first, then up to five nominations and a count of the rest. */
  awards: AwardSummary;
}

const DETAIL_SELECT =
  "slug,summary,justwatch_url,movie_imdb(imdb_id),movie_genres(genre_name),credits(role,billing,character,person_slug,people(name))," +
  "streaming_offers(monetization,quality,url,price,currency_code,providers(id,name,icon_url))";
const AWARDS_SELECT = "award_name,result,year,person_name,person_slug";

const MONETIZATION_ORDER: Record<Monetization, number> = { flatrate: 0, free: 1, ads: 2, rent: 3, buy: 4 };

function priceOf(offer: OfferRow): number | null {
  if (offer.price === null) return null;
  const value = Number(offer.price);
  return Number.isFinite(value) ? value : null;
}

export function toFilmDetail(row: DetailRow, awards: AwardRow[] = []): FilmDetail {
  const cast = row.credits
    .filter((credit) => credit.role === "cast")
    .sort((a, b) => a.billing - b.billing);
  const offers = [...row.streaming_offers]
    .sort((a, b) => MONETIZATION_ORDER[a.monetization] - MONETIZATION_ORDER[b.monetization] || a.providers.name.localeCompare(b.providers.name, "en-US"))
    .map((offer) => ({
      providerId: offer.providers.id,
      provider: offer.providers.name,
      iconUrl: offer.providers.icon_url,
      monetization: offer.monetization,
      quality: offer.quality,
      url: offer.url,
      price: priceOf(offer),
      currency: offer.currency_code,
    }));
  return {
    slug: row.slug,
    summary: row.summary?.trim() || null,
    justwatchUrl: row.justwatch_url,
    imdbUrl: row.movie_imdb ? imdbUrl(row.movie_imdb.imdb_id) : null,
    genres: row.movie_genres.map((entry) => entry.genre_name),
    directors: people(row.credits, "director"),
    writers: people(row.credits, "writer"),
    cast: cast.slice(0, CAST_LIMIT).map((credit) => ({ slug: credit.person_slug, name: credit.people.name, character: credit.character })),
    castTotal: cast.length,
    offers,
    awards: awardLines(awards),
  };
}

/** Synopsis, credits, awards, and every US offer for one film, or null when the slug is unknown. */
export async function fetchFilmDetail(slug: string): Promise<FilmDetail | null> {
  const [rows, awards] = await Promise.all([
    fetchTable<DetailRow>("movies", { select: DETAIL_SELECT, slug: `eq.${slug}`, "credits.order": "billing", limit: "1" }),
    fetchTable<AwardRow>("movie_awards", { select: AWARDS_SELECT, movie_slug: `eq.${slug}`, order: "award_name" }),
  ]);
  const row = rows[0];
  return row ? toFilmDetail(row, awards) : null;
}
