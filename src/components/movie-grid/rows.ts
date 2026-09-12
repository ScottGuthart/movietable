import type { MovieGroup } from "@/lib/movie-groups";
import type { ScoredMovie } from "@/lib/movies";

export interface FilmRow {
  kind: "film";
  id: string;
  movie: ScoredMovie;
}

export interface BandRow {
  kind: "band";
  id: string;
  group: MovieGroup;
  subRows: FilmRow[];
}

export type GridRow = BandRow | FilmRow;

export const BAND_ROW_HEIGHT = 44;

export function isFilmRow(row: GridRow): row is FilmRow {
  return row.kind === "film";
}

export function buildGridRows(groups: MovieGroup[]): BandRow[] {
  return groups.map((group) => ({
    kind: "band",
    id: group.id,
    group,
    subRows: group.movies.map((movie) => ({ kind: "film", id: movie.link, movie })),
  }));
}
