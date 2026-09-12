import type { SortingState } from "@tanstack/react-table";
import type { ScoredMovie } from "@/lib/movies";

export type GroupKey = "score" | "decade" | "popularity";

export interface GroupKeyOption {
  value: GroupKey;
  label: string;
}

export const GROUP_KEY_OPTIONS: GroupKeyOption[] = [
  { value: "score", label: "Final Score band" },
  { value: "decade", label: "Decade" },
  { value: "popularity", label: "Popularity tier" },
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

function decadeSlot(year: number): GroupSlot {
  const decade = Math.floor(year / 10) * 10;
  return { id: `decade-${decade}`, label: `${decade}s`, order: -decade };
}

export function groupSlotFor(movie: ScoredMovie, key: GroupKey): GroupSlot {
  switch (key) {
    case "score":
      return bucketSlot(movie.finalScore, SCORE_BANDS, UNSCORED);
    case "decade":
      return decadeSlot(movie.year);
    case "popularity":
      return bucketSlot(movie.popularity, POPULARITY_TIERS, NO_POPULARITY);
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
    .sort((a, b) => a.order - b.order)
    .map(({ id, label, movies: members }) => ({
      id,
      label,
      movies: members,
      averageFinalScore: averageFinalScore(members),
    }));
}

export type SortableMovieColumn = "year" | "title" | "popularity" | "users" | "critics" | "finalScore";

const SORTABLE_COLUMNS: ReadonlySet<string> = new Set<SortableMovieColumn>([
  "year",
  "title",
  "popularity",
  "users",
  "critics",
  "finalScore",
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
