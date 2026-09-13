"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { IconArrowUpRight, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { Badge } from "@/components/reui/badge";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { oscarSummary } from "@/lib/film-detail";
import type { MovieGroup } from "@/lib/movie-groups";
import { numberFormat, type ScoredMovie } from "@/lib/movies";
import { FilmDetailCell } from "@/components/movie-grid/detail-row";
import { isDetailRow, isFilmRow, type GridRow } from "@/components/movie-grid/rows";
import { watchColumn, type ProviderIndex } from "@/components/movie-grid/watch-column";
import { forYouColumn, rateColumn, type TasteColumnOptions } from "@/components/taste/taste-columns";

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

/** Director, language, the Oscar record, then subgenres (two when a record needs the room); the scores already have columns. */
function ContextLine({ movie }: { movie: ScoredMovie }) {
  const oscars = oscarSummary(movie.oscarWins, movie.oscarNominations);
  const parts = [movie.signals?.directors[0]?.name, movie.language ?? "—", oscars, movie.subgenres.slice(0, oscars ? 2 : 3).join(", ")].filter(Boolean);
  const line = parts.join(" · ");
  return (
    <span className="text-muted-foreground block truncate text-xs leading-4" title={line}>
      {line}
    </span>
  );
}

function TitleCell({ movie, showContext, expanded, onToggle }: { movie: ScoredMovie; showContext: boolean; expanded: boolean; onToggle: () => void }) {
  return (
    <span className="flex min-w-0 items-center gap-1" data-film-slug={movie.slug}>
      <span className="flex min-w-0 flex-1 flex-col">
        <a className="group inline-flex max-w-full items-center gap-2 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          href={movie.link} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
          <span className="truncate">{movie.title}</span>
          <IconArrowUpRight aria-hidden="true" className="text-muted-foreground size-4 shrink-0 opacity-40 group-hover:opacity-100" />
          <span className="sr-only"> (Metacritic, opens in a new tab)</span>
        </a>
        {showContext && <ContextLine movie={movie} />}
      </span>
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        aria-expanded={expanded}
        aria-label={expanded ? `Hide details for ${movie.title}` : `Details for ${movie.title}`}
        className="text-muted-foreground hover:text-foreground shrink-0 opacity-50 group-hover/movie-row:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
        onClick={(event) => { event.stopPropagation(); onToggle(); }}
      >
        <IconChevronDown aria-hidden="true" className={cn("transition-transform duration-150", expanded && "rotate-180")} />
      </Button>
    </span>
  );
}

const numericMeta = { headerClassName: "text-right", cellClassName: "text-right" };
/** The detail band lives in the first cell and must escape the cell's truncation. */
const DETAIL_CELL = "[tr:has([data-detail-row])>&]:overflow-visible [tr:has([data-detail-row])>&]:whitespace-normal [tr:has([data-detail-row])>&]:align-top";

export const MOVIE_COLUMN_SIZES = { year: 88, title: 300, popularity: 104, users: 92, critics: 92, finalScore: 116 } as const;

export interface MovieColumnOptions {
  showContext: boolean;
  providers: ProviderIndex;
  taste?: TasteColumnOptions;
  pinForYou?: boolean;
}

/**
 * The ledger's columns: Year, Title, Watch, the figures, Final Score. With `taste`
 * a Rate column follows Title and, once a profile is active, For you closes the row.
 * `pinForYou` keeps that column in view on viewports that scroll the grid sideways.
 */
export function createMovieColumns({ showContext, providers, taste, pinForYou = false }: MovieColumnOptions): ColumnDef<DataGridFeatures, GridRow>[] {
  const tasteActive = taste?.active ?? false;
  const columns: ColumnDef<DataGridFeatures, GridRow>[] = [
    {
      id: "year",
      accessorFn: (row) => (isFilmRow(row) ? row.movie.year : isDetailRow(row) ? undefined : row.group.label),
      header: ({ column }) => <DataGridColumnHeader title="Year" column={column} />,
      size: MOVIE_COLUMN_SIZES.year,
      meta: { headerClassName: "ps-6", cellClassName: cn("ps-6 text-muted-foreground tabular-nums", DETAIL_CELL) },
      cell: ({ row }) => {
        if (isFilmRow(row.original)) return row.original.movie.year;
        if (isDetailRow(row.original)) return <FilmDetailCell movie={row.original.movie} />;
        return (
          <span data-band-row={row.original.group.id} className="flex items-center">
            <BandToggle label={row.original.group.label} expanded={row.getIsExpanded()} onToggle={row.getToggleExpandedHandler()} />
          </span>
        );
      },
    },
    {
      id: "title",
      accessorFn: (row) => (isFilmRow(row) ? row.movie.title : isDetailRow(row) ? undefined : row.group.label),
      header: ({ column }) => <DataGridColumnHeader title="Title" column={column} />,
      size: MOVIE_COLUMN_SIZES.title,
      cell: ({ row }) => {
        if (isFilmRow(row.original)) {
          return <TitleCell movie={row.original.movie} showContext={showContext} expanded={row.getIsExpanded()} onToggle={row.getToggleExpandedHandler()} />;
        }
        if (isDetailRow(row.original)) return null;
        return <BandLabel group={row.original.group} />;
      },
    },
    watchColumn(providers),
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
      accessorFn: (row) => (isFilmRow(row) ? (row.movie.finalScore ?? undefined) : isDetailRow(row) ? undefined : row.group.averageFinalScore ?? undefined),
      header: ({ column }) => <DataGridColumnHeader title="Final Score" column={column} className="ms-auto -me-2" />,
      size: MOVIE_COLUMN_SIZES.finalScore,
      meta: tasteActive ? numericMeta : { headerClassName: "text-right pe-6", cellClassName: "text-right pe-6" },
      cell: ({ row }) => {
        if (isFilmRow(row.original)) return <Score value={row.original.movie.finalScore} final={!tasteActive} />;
        if (isDetailRow(row.original)) return null;
        return <BandAverage group={row.original.group} />;
      },
    },
  ];
  if (!taste) return columns;
  columns.splice(2, 0, rateColumn(taste));
  if (taste.active) columns.push(forYouColumn(taste, pinForYou));
  return columns;
}
