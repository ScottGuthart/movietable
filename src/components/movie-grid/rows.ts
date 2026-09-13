import type { MovieGroup } from "@/lib/movie-groups";
import type { ScoredMovie } from "@/lib/movies";

/** The detail band beneath an open film. */
export interface DetailRow {
  kind: "detail";
  id: string;
  movie: ScoredMovie;
}

export interface FilmRow {
  kind: "film";
  id: string;
  movie: ScoredMovie;
  subRows: [DetailRow];
}

export interface BandRow {
  kind: "band";
  id: string;
  group: MovieGroup;
  subRows: FilmRow[];
}

export type GridRow = BandRow | FilmRow | DetailRow;

export const BAND_ROW_HEIGHT = 44;
/** Starting guess for a detail band; the virtualizer measures the real height once it renders. */
export const DETAIL_ROW_ESTIMATE = 280;

export function isFilmRow(row: GridRow): row is FilmRow {
  return row.kind === "film";
}

export function isDetailRow(row: GridRow): row is DetailRow {
  return row.kind === "detail";
}

export function detailRowId(slug: string): string {
  return `${slug}#detail`;
}

export function buildGridRows(groups: MovieGroup[]): BandRow[] {
  return groups.map((group) => ({
    kind: "band",
    id: group.id,
    group,
    subRows: group.movies.map((movie) => ({
      kind: "film",
      id: movie.slug,
      movie,
      subRows: [{ kind: "detail", id: detailRowId(movie.slug), movie }],
    })),
  }));
}
