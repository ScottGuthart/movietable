"use client";

import type { ReactNode } from "react";
import {
  useTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { IconArrowUpRight } from "@tabler/icons-react";
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Filters } from "@/components/reui/filters/filters";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MOVIE_FIELDS, MOVIE_OPERATOR_LABELS } from "@/lib/movie-filters";
import { numberFormat, type ScoredMovie } from "@/lib/movies";

function Score({ value, final = false }: { value: number | null; final?: boolean }) {
  if (value === null) return <span aria-label="Unavailable" className="text-muted-foreground">—</span>;
  return final ? (
    <span className="bg-primary/10 text-primary inline-flex min-w-10 justify-center px-2 py-1 font-semibold tabular-nums">{value}</span>
  ) : <span className="tabular-nums">{value}</span>;
}

const numericMeta = { headerClassName: "text-right", cellClassName: "text-right" };
const columns: ColumnDef<DataGridFeatures, ScoredMovie>[] = [
  {
    id: "year",
    accessorKey: "year",
    header: ({ column }) => <DataGridColumnHeader title="Year" column={column} />,
    size: 95,
    meta: { headerClassName: "ps-6", cellClassName: "ps-6 text-muted-foreground tabular-nums" },
  },
  {
    id: "title",
    accessorKey: "title",
    header: ({ column }) => <DataGridColumnHeader title="Title" column={column} />,
    size: 430,
    cell: ({ row }) => (
      <a className="group inline-flex max-w-full items-center gap-2 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        href={row.original.link} target="_blank" rel="noopener noreferrer">
        <span className="truncate">{row.original.title}</span>
        <IconArrowUpRight aria-hidden="true" className="text-muted-foreground size-4 shrink-0 opacity-40 group-hover:opacity-100" />
        <span className="sr-only"> (Metacritic, opens in a new tab)</span>
      </a>
    ),
  },
  {
    id: "popularity",
    accessorFn: (row) => row.popularity ?? undefined,
    header: ({ column }) => <DataGridColumnHeader title="Popularity" column={column} className="ms-auto -me-2" />,
    cell: ({ row }) => row.original.popularity === null ? <Score value={null} /> : <span className="tabular-nums">{numberFormat.format(row.original.popularity)}</span>,
    size: 125,
    sortUndefined: "last",
    meta: numericMeta,
  },
  ...([ ["users", "Users"], ["critics", "Critics"], ["finalScore", "Final Score"] ] as const).map(([id, label]): ColumnDef<DataGridFeatures, ScoredMovie> => ({
    id,
    accessorFn: (row) => row[id] ?? undefined,
    header: ({ column }) => <DataGridColumnHeader title={label} column={column} className="ms-auto -me-2" />,
    cell: ({ row }) => <Score value={row.original[id]} final={id === "finalScore"} />,
    size: id === "finalScore" ? 135 : 105,
    sortUndefined: "last",
    meta: id === "finalScore" ? { headerClassName: "text-right pe-6", cellClassName: "text-right pe-6" } : numericMeta,
  })),
];

interface MovieResultsGridProps {
  rows: ScoredMovie[];
  totalCount: number;
  query: FilterQuery;
  onQueryChange: (query: FilterQuery) => void;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  actions: ReactNode;
  advancedEditor: ReactNode;
}

export function MovieResultsGrid({ rows, totalCount, query, onQueryChange, pagination, onPaginationChange, sorting, onSortingChange, actions, advancedEditor }: MovieResultsGridProps) {
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    pageCount: Math.ceil(rows.length / pagination.pageSize),
    getRowId: (row: ScoredMovie) => row.link,
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
  });

  return (
    <DataGrid table={table} recordCount={rows.length} tableLayout={{ dense: true }} tableClassNames={{ base: "min-w-[760px]" }} emptyMessage="No movies match. Try a different search or reset your view.">
      <Card className="w-full gap-0 p-0">
        <CardHeader className="flex flex-wrap items-center justify-between px-5 py-4 sm:px-6">
          <div>
            <CardTitle><h2>Your movie list</h2></CardTitle>
            <CardDescription aria-live="polite" aria-atomic="true" data-testid="result-count">
              {numberFormat.format(rows.length)} of {numberFormat.format(totalCount)} movies
            </CardDescription>
          </div>
          <CardAction className="flex flex-wrap items-center gap-2">
            <Filters
              variant="advanced"
              advancedMode="popover"
              advancedAlign="end"
              reorderable
              fields={MOVIE_FIELDS}
              operatorLabels={MOVIE_OPERATOR_LABELS}
              query={query}
              onQueryChange={onQueryChange}
              className="movie-filter-popover [--filter-field-width:9rem] [--filter-operator-width:7rem] [--filter-value-width:11rem]"
            />
            {actions}
          </CardAction>
        </CardHeader>
        {advancedEditor}
        <CardContent className="border-y px-0">
          <DataGridScrollArea className="[&_[data-slot=scroll-area-viewport]]:max-h-[640px]">
            <DataGridTable />
          </DataGridScrollArea>
        </CardContent>
        <CardFooter className="border-t-0 px-5 py-4 sm:px-6">
          <DataGridPagination sizes={[10, 25, 50, 100]} info="{from}–{to} of {count}" />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
