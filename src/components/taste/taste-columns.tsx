"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { isFilmRow, type GridRow } from "@/components/movie-grid/rows";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { ForYouCell } from "@/components/taste/for-you-cell";
import { RatingControl } from "@/components/taste/rating-control";
import type { ScoredMovie } from "@/lib/movies";
import type { MatchReason, Verdict, Verdicts } from "@/lib/taste";
import { cn } from "@/lib/utils";

/** What the grid needs from the taste model to draw the Rate and For you columns. */
export interface TasteColumnOptions {
  active: boolean;
  verdicts: Verdicts;
  rate: (slug: string, verdict: Verdict | null) => void;
  explain: (slug: string) => MatchReason[];
  unavailableReason: (movie: ScoredMovie) => string | undefined;
}

export const TASTE_COLUMN_SIZES = { rate: 120, forYou: 116 } as const;

function averageForYou(movies: Pick<ScoredMovie, "forYou">[]): number | null {
  const ranked = movies.flatMap((movie) => (movie.forYou === null ? [] : [movie.forYou]));
  if (ranked.length === 0) return null;
  return Math.round(ranked.reduce((sum, value) => sum + value, 0) / ranked.length);
}

function BandAverageForYou({ movies }: { movies: ScoredMovie[] }) {
  const average = averageForYou(movies);
  return (
    <span className="text-muted-foreground tabular-nums">
      <span className="sr-only">Average For you </span>
      <span aria-hidden="true">avg </span>
      {average === null ? "—" : average}
    </span>
  );
}

export function rateColumn(taste: TasteColumnOptions): ColumnDef<DataGridFeatures, GridRow> {
  return {
    id: "rate",
    enableSorting: false,
    header: ({ column }) => <DataGridColumnHeader title="Your rating" column={column} className="mx-auto" />,
    size: TASTE_COLUMN_SIZES.rate,
    meta: { headerClassName: "text-center", cellClassName: "py-0 text-center" },
    cell: ({ row }) => {
      if (!isFilmRow(row.original)) return null;
      const { movie } = row.original;
      return <RatingControl title={movie.title} verdict={taste.verdicts[movie.slug]} onChange={(verdict) => taste.rate(movie.slug, verdict)} />;
    },
  };
}

/**
 * Sticky right edge for the pinned For you column. The grid paints band rows with a translucent
 * tint on every cell, so the pinned cell needs opaque equivalents (hence the `!`) or scrolled
 * titles would show through it.
 */
const PINNED_EDGE = "shadow-[-1px_0_0_var(--border),-8px_0_10px_-8px_rgba(0,0,0,0.18)]";
const PINNED_HEADER = `sticky right-0 z-20 ps-5 bg-background ${PINNED_EDGE}`;
const PINNED_CELL =
  `sticky right-0 z-20 ps-5 bg-background! ${PINNED_EDGE} ` +
  "[tr:has([data-band-row])>&]:bg-[color-mix(in_oklch,var(--muted)_45%,var(--background))]! " +
  "group-hover/movie-row:bg-[color-mix(in_oklch,var(--muted)_40%,var(--background))]!";

export function forYouColumn(taste: TasteColumnOptions, pinned = false): ColumnDef<DataGridFeatures, GridRow> {
  return {
    id: "forYou",
    accessorFn: (row) => (isFilmRow(row) ? (row.movie.forYou ?? undefined) : (averageForYou(row.group.movies) ?? undefined)),
    header: ({ column }) => <DataGridColumnHeader title="For you" column={column} className="ms-auto -me-2" />,
    size: TASTE_COLUMN_SIZES.forYou,
    meta: {
      headerClassName: cn("text-right pe-6", pinned && PINNED_HEADER),
      cellClassName: cn("text-right pe-6 motion-safe:animate-in motion-safe:fade-in duration-300", pinned && PINNED_CELL),
    },
    cell: ({ row }) => {
      if (!isFilmRow(row.original)) return <BandAverageForYou movies={row.original.group.movies} />;
      const { movie } = row.original;
      return <ForYouCell value={movie.forYou} explain={() => taste.explain(movie.slug)} unavailable={taste.unavailableReason(movie)} />;
    },
  };
}
