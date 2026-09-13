"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { IconArrowUpRight, IconChevronRight } from "@tabler/icons-react";
import { Badge } from "@/components/reui/badge";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MovieGroup } from "@/lib/movie-groups";
import { numberFormat, type ScoredMovie } from "@/lib/movies";
import { isFilmRow, type GridRow } from "@/components/movie-grid/rows";
import { forYouColumn, rateColumn, type TasteColumnOptions } from "@/components/taste/taste-columns";
import { FilmDetail } from "@/components/film-detail/film-detail";
import { oscarSummary } from "@/lib/film-detail";

function formatScore(value: number | null): string {
  return value === null ? "—" : String(value);
}

function Score({ value, final = false }: { value: number | null; final?: boolean }) {
  if (value === null) return <span aria-label="Unavailable" className="text-muted-foreground">—</span>;
  return final ? (
    <span className="bg-primary/10 text-primary inline-flex min-w-10 justify-center px-2 py-1 font-semibold tabular-nums">{value}</span>
  ) : <span className="tabular-nums">{value}</span>;
}

export function BandToggle({ label, expanded, onToggle, tabIndex }: { label: string; expanded: boolean; onToggle: () => void; tabIndex?: number }) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      tabIndex={tabIndex}
      aria-expanded={expanded}
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
      className="text-muted-foreground hover:text-foreground pointer-events-auto"
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); onToggle(); }}
    >
      <IconChevronRight aria-hidden="true" className={cn("transition-transform duration-150", expanded && "rotate-90")} />
    </Button>
  );
}

export function BandLabel({ group }: { group: MovieGroup }) {
  const count = group.movies.length;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate font-medium">{group.label}</span>
      <Badge variant="outline" className="shrink-0">{numberFormat.format(count)} {count === 1 ? "film" : "films"}</Badge>
    </span>
  );
}

export function BandAverage({ group }: { group: MovieGroup }) {
  return (
    <span className="text-muted-foreground tabular-nums">
      <span className="sr-only">Average Final Score </span>
      <span aria-hidden="true">avg </span>
      {formatScore(group.averageFinalScore)}
    </span>
  );
}

/** Language, the Oscar record, then subgenres (two when a record needs the room); the scores already have columns. */
function ContextLine({ movie }: { movie: ScoredMovie }) {
  const oscars = oscarSummary(movie.oscarWins, movie.oscarNominations);
  const parts = [movie.language ?? "—", oscars, movie.subgenres.slice(0, oscars ? 2 : 3).join(", ")].filter(Boolean);
  const line = parts.join(" · ");
  return (
    <span className="text-muted-foreground block truncate text-xs leading-4" title={line}>
      {line}
    </span>
  );
}

function TitleCell({ movie, showContext }: { movie: ScoredMovie; showContext: boolean }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="flex min-w-0 items-center gap-1">
        <a className="group order-2 inline-flex min-w-0 items-center gap-2 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:order-1"
          href={movie.link} target="_blank" rel="noopener noreferrer">
          <span className="truncate">{movie.title}</span>
          <IconArrowUpRight aria-hidden="true" className="text-muted-foreground size-4 shrink-0 opacity-40 group-hover:opacity-100" />
          <span className="sr-only"> (Metacritic, opens in a new tab)</span>
        </a>
        <span className="order-1 -ml-1.5 flex shrink-0 md:order-2 md:ml-0">
          <FilmDetail movie={movie} />
        </span>
      </span>
      {showContext && <ContextLine movie={movie} />}
    </span>
  );
}

const numericMeta = { headerClassName: "text-right", cellClassName: "text-right" };

export const MOVIE_COLUMN_SIZES = { year: 88, title: 340, popularity: 112, users: 96, critics: 96, finalScore: 116 } as const;

/**
 * The ledger's columns; with `taste` a Rate column follows Title and, once a profile is active,
 * For you closes the row. `pinForYou` keeps that column in view on viewports that scroll the grid sideways.
 */
export function createMovieColumns({ showContext, taste, pinForYou = false }: { showContext: boolean; taste?: TasteColumnOptions; pinForYou?: boolean }): ColumnDef<DataGridFeatures, GridRow>[] {
  const tasteActive = taste?.active ?? false;
  const columns: ColumnDef<DataGridFeatures, GridRow>[] = [
    {
      id: "year",
      accessorFn: (row) => (isFilmRow(row) ? row.movie.year : row.group.label),
      header: ({ column }) => <DataGridColumnHeader title="Year" column={column} />,
      size: MOVIE_COLUMN_SIZES.year,
      meta: { headerClassName: "ps-6", cellClassName: "ps-6 text-muted-foreground tabular-nums" },
      cell: ({ row }) => {
        if (isFilmRow(row.original)) return row.original.movie.year;
        return (
          <span data-band-row="" className="flex items-center">
            <BandToggle label={row.original.group.label} expanded={row.getIsExpanded()} onToggle={row.getToggleExpandedHandler()} />
          </span>
        );
      },
    },
    {
      id: "title",
      accessorFn: (row) => (isFilmRow(row) ? row.movie.title : row.group.label),
      header: ({ column }) => <DataGridColumnHeader title="Title" column={column} />,
      size: MOVIE_COLUMN_SIZES.title,
      cell: ({ row }) => (isFilmRow(row.original)
        ? <TitleCell movie={row.original.movie} showContext={showContext} />
        : <BandLabel group={row.original.group} />),
    },
    {
      id: "popularity",
      accessorFn: (row) => (isFilmRow(row) ? (row.movie.popularity ?? undefined) : undefined),
      header: ({ column }) => <DataGridColumnHeader title="Popularity" column={column} className="ms-auto -me-2" />,
      size: MOVIE_COLUMN_SIZES.popularity,
      meta: numericMeta,
      cell: ({ row }) => {
        if (!isFilmRow(row.original)) return null;
        const { popularity } = row.original.movie;
        return popularity === null ? <Score value={null} /> : <span className="tabular-nums">{numberFormat.format(popularity)}</span>;
      },
    },
    ...([["users", "Users"], ["critics", "Critics"]] as const).map(([id, label]): ColumnDef<DataGridFeatures, GridRow> => ({
      id,
      accessorFn: (row) => (isFilmRow(row) ? (row.movie[id] ?? undefined) : undefined),
      header: ({ column }) => <DataGridColumnHeader title={label} column={column} className="ms-auto -me-2" />,
      size: MOVIE_COLUMN_SIZES[id],
      meta: numericMeta,
      cell: ({ row }) => (isFilmRow(row.original) ? <Score value={row.original.movie[id]} /> : null),
    })),
    {
      id: "finalScore",
      accessorFn: (row) => (isFilmRow(row) ? (row.movie.finalScore ?? undefined) : row.group.averageFinalScore ?? undefined),
      header: ({ column }) => <DataGridColumnHeader title="Final Score" column={column} className="ms-auto -me-2" />,
      size: MOVIE_COLUMN_SIZES.finalScore,
      meta: tasteActive ? numericMeta : { headerClassName: "text-right pe-6", cellClassName: "text-right pe-6" },
      cell: ({ row }) => (isFilmRow(row.original)
        ? <Score value={row.original.movie.finalScore} final={!tasteActive} />
        : <BandAverage group={row.original.group} />),
    },
  ];
  if (!taste) return columns;
  columns.splice(2, 0, rateColumn(taste));
  if (taste.active) columns.push(forYouColumn(taste, pinForYou));
  return columns;
}
