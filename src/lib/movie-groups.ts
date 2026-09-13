import type { SortingState } from "@tanstack/react-table";
import type { ScoredMovie } from "@/lib/movies";

export type GroupKey = "score" | "forYou" | "decade" | "director" | "popularity" | "language" | "oscars";

export interface GroupKeyOption {
  value: GroupKey;
  label: string;
}

export const GROUP_KEY_OPTIONS: GroupKeyOption[] = [
  { value: "score", label: "Final Score band" },
  { value: "forYou", label: "For you band" },
  { value: "decade", label: "Decade" },
  { value: "director", label: "Director" },
  { value: "popularity", label: "Popularity tier" },
  { value: "language", label: "Language" },
  { value: "oscars", label: "Oscars" },
];

export const DEFAULT_GROUP_KEY: GroupKey = "score";

export interface MovieGroup {
  id: string;
  label: string;
  movies: ScoredMovie[];
  averageFinalScore: number | null;
}

interface Bucket {
  id: string;
  label: string;
  min: number;
}

interface GroupSlot {
  id: string;
  label: string;
  order: number;
}

const SCORE_BANDS: Bucket[] = [
  { id: "score-90", label: "90+", min: 90 },
  { id: "score-80", label: "80–89", min: 80 },
  { id: "score-70", label: "70–79", min: 70 },
  { id: "score-60", label: "60–69", min: 60 },
  { id: "score-under-60", label: "Under 60", min: Number.NEGATIVE_INFINITY },
];
const UNSCORED: Omit<Bucket, "min"> = { id: "score-none", label: "Unscored" };

const FOR_YOU_BANDS: Bucket[] = SCORE_BANDS.map((band) => ({ ...band, id: band.id.replace("score-", "for-you-") }));
const NOT_RANKED: Omit<Bucket, "min"> = { id: "for-you-none", label: "Not yet ranked" };

const POPULARITY_TIERS: Bucket[] = [
  { id: "popularity-10000", label: "10,000+ ratings", min: 10_000 },
  { id: "popularity-2500", label: "2,500–9,999 ratings", min: 2_500 },
  { id: "popularity-1000", label: "1,000–2,499 ratings", min: 1_000 },
  { id: "popularity-300", label: "300–999 ratings", min: 300 },
  { id: "popularity-under-300", label: "Under 300 ratings", min: Number.NEGATIVE_INFINITY },
];
const NO_POPULARITY: Omit<Bucket, "min"> = { id: "popularity-none", label: "No popularity data" };

function bucketSlot(value: number | null, buckets: Bucket[], fallback: Omit<Bucket, "min">): GroupSlot {
  if (value === null) return { ...fallback, order: buckets.length };
  const index = buckets.findIndex((bucket) => value >= bucket.min);
  const bucket = buckets[index];
  if (!bucket) {
    throw new RangeError(`No bucket accepts value ${value}; the last bucket must have min -Infinity.`);
  }
  return { id: bucket.id, label: bucket.label, order: index };
}

function languageSlot(language: string | null): GroupSlot {
  if (!language) return { id: "language-unknown", label: "Unknown language", order: 1 };
  return { id: `language-${language.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-")}`, label: language, order: 0 };
}

function oscarSlot(wins: number | null, nominations: number | null): GroupSlot {
  if ((wins ?? 0) >= 3) return { id: "oscars-3", label: "3+ Oscar wins", order: 0 };
  if ((wins ?? 0) >= 1) return { id: "oscars-1", label: "1–2 Oscar wins", order: 1 };
  if ((nominations ?? 0) >= 1) return { id: "oscars-nominated", label: "Nominated only", order: 2 };
  return { id: "oscars-none", label: "No Oscar record", order: 3 };
}

/** Directors with fewer films than this in the current view share one closing band. */
export const DIRECTOR_BAND_MIN_FILMS = 2;
const OTHER_DIRECTORS = { id: "director-other", label: "Other directors" };

function directorSlot(movie: ScoredMovie): GroupSlot {
  const lead = movie.signals?.directors[0];
  return lead ? { id: `director-${lead.slug}`, label: lead.name, order: 0 } : { ...OTHER_DIRECTORS, order: Number.POSITIVE_INFINITY };
}

/**
 * Bands by first-billed director, most films first, then name. Directors below
 * the threshold and films without a director close the list as one band.
 */
function groupByDirector(movies: ScoredMovie[]): MovieGroup[] {
  const byDirector = new Map<string, { name: string; movies: ScoredMovie[] }>();
  for (const movie of movies) {
    const lead = movie.signals?.directors[0];
    if (!lead) continue;
    const entry = byDirector.get(lead.slug) ?? { name: lead.name, movies: [] };
    entry.movies.push(movie);
    byDirector.set(lead.slug, entry);
  }
  const banded = [...byDirector.entries()]
    .filter(([, entry]) => entry.movies.length >= DIRECTOR_BAND_MIN_FILMS)
    .sort(([, a], [, b]) => b.movies.length - a.movies.length || a.name.localeCompare(b.name, "en-US"));
  const bandedFilms = new Set(banded.flatMap(([, entry]) => entry.movies));
  const rest = movies.filter((movie) => !bandedFilms.has(movie));
  const groups: MovieGroup[] = banded.map(([slug, entry]) => ({
    id: `director-${slug}`,
    label: entry.name,
    movies: entry.movies,
    averageFinalScore: averageFinalScore(entry.movies),
  }));
  if (rest.length > 0) groups.push({ ...OTHER_DIRECTORS, movies: rest, averageFinalScore: averageFinalScore(rest) });
  return groups;
}

function decadeSlot(year: number): GroupSlot {
  const decade = Math.floor(year / 10) * 10;
  return { id: `decade-${decade}`, label: `${decade}s`, order: -decade };
}

export function groupSlotFor(movie: ScoredMovie, key: GroupKey): GroupSlot {
  switch (key) {
    case "score":
      return bucketSlot(movie.finalScore, SCORE_BANDS, UNSCORED);
    case "forYou":
      return bucketSlot(movie.forYou, FOR_YOU_BANDS, NOT_RANKED);
    case "decade":
      return decadeSlot(movie.year);
    case "director":
      return directorSlot(movie);
    case "popularity":
      return bucketSlot(movie.popularity, POPULARITY_TIERS, NO_POPULARITY);
    case "language":
      return languageSlot(movie.language);
    case "oscars":
      return oscarSlot(movie.oscarWins, movie.oscarNominations);
  }
}

export function averageFinalScore(movies: Pick<ScoredMovie, "finalScore">[]): number | null {
  const scored = movies.flatMap((movie) => (movie.finalScore === null ? [] : [movie.finalScore]));
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length);
}

/**
 * Buckets movies into fixed-order groups for the chosen key.
 *
 * Input order is preserved inside each group, so sort before grouping.
 * Empty groups are omitted; group order never depends on sort direction.
 */
export function groupMovies(movies: ScoredMovie[], key: GroupKey): MovieGroup[] {
  if (key === "director") return groupByDirector(movies);
  const slots = new Map<string, GroupSlot & { movies: ScoredMovie[] }>();
  for (const movie of movies) {
    const slot = groupSlotFor(movie, key);
    const existing = slots.get(slot.id);
    if (existing) {
      existing.movies.push(movie);
    } else {
      slots.set(slot.id, { ...slot, movies: [movie] });
    }
  }
  return [...slots.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "en-US"))
    .map(({ id, label, movies: members }) => ({
      id,
      label,
      movies: members,
      averageFinalScore: averageFinalScore(members),
    }));
}

export type SortableMovieColumn = "year" | "title" | "popularity" | "users" | "critics" | "finalScore" | "forYou";

const SORTABLE_COLUMNS: ReadonlySet<string> = new Set<SortableMovieColumn>([
  "year",
  "title",
  "popularity",
  "users",
  "critics",
  "finalScore",
  "forYou",
]);

function compareNullableNumbers(a: number | null, b: number | null, desc: boolean): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return desc ? b - a : a - b;
}

/**
 * Sorts movies by the table's first sorting rule.
 *
 * Missing numbers sort last in both directions so an unscored film never
 * tops a descending column. Ties keep input order.
 */
export function sortMovies(movies: ScoredMovie[], sorting: SortingState): ScoredMovie[] {
  const rule = sorting[0];
  if (!rule || !SORTABLE_COLUMNS.has(rule.id)) return movies;
  const column = rule.id as SortableMovieColumn;
  const desc = rule.desc;
  return movies
    .map((movie, index) => ({ movie, index }))
    .sort((a, b) => {
      const result =
        column === "title"
          ? (desc ? -1 : 1) * a.movie.title.localeCompare(b.movie.title, "en-US")
          : compareNullableNumbers(a.movie[column], b.movie[column], desc);
      return result !== 0 ? result : a.index - b.index;
    })
    .map(({ movie }) => movie);
}
