"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTable, type ExpandedState, type OnChangeFn, type SortingState } from "@tanstack/react-table";
import { elementScroll, observeElementOffset, observeElementRect } from "@tanstack/react-virtual";
import { DataGrid, dataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTableVirtual } from "@/components/reui/data-grid/data-grid-table-virtual";
import { Filters } from "@/components/reui/filters/filters";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMovieColumns } from "@/components/movie-grid/columns";
import { DisplayPopover, type Density } from "@/components/movie-grid/display-popover";
import { BAND_ROW_HEIGHT, buildGridRows, type GridRow } from "@/components/movie-grid/rows";
import { StickyBand, useStickyBand } from "@/components/movie-grid/sticky-band";
import { MOVIE_FIELDS, MOVIE_OPERATOR_LABELS } from "@/lib/movie-filters";
import { GROUP_KEY_OPTIONS, groupMovies, sortMovies, type GroupKey } from "@/lib/movie-groups";
import { numberFormat, type ScoredMovie } from "@/lib/movies";
import { cn } from "@/lib/utils";

/** Film row heights by density. Compact sits on the 28px score chip plus cell padding. */
const FILM_ROW: Record<Density, { plain: { height: number; className: string }; withContext: { height: number; className: string } }> = {
  compact: { plain: { height: 41, className: "[&>td]:h-9" }, withContext: { height: 49, className: "[&>td]:h-12" } },
  comfortable: { plain: { height: 48, className: "[&>td]:h-12" }, withContext: { height: 60, className: "[&>td]:h-15" } },
};

const BAND_ROW_CLASS =
  "cursor-default [&:has([data-band-row])]:cursor-pointer [&:has([data-band-row])>td]:h-11 [&:has([data-band-row])>td]:bg-muted/45 [&:has([data-band-row])>td]:shadow-none [&:has([data-band-row]):hover>td]:bg-muted/45";

interface MovieGridProps {
  movies: ScoredMovie[];
  totalCount: number;
  query: FilterQuery;
  onQueryChange: (query: FilterQuery) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
  groupKey: GroupKey;
  onGroupKeyChange: (key: GroupKey) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
  showContext: boolean;
  onShowContextChange: (show: boolean) => void;
  actions: ReactNode;
  advancedEditor: ReactNode;
}

export function MovieGrid({
  movies, totalCount, query, onQueryChange, sorting, onSortingChange, expanded, onExpandedChange,
  groupKey, onGroupKeyChange, density, onDensityChange, showContext, onShowContextChange, actions, advancedEditor,
}: MovieGridProps) {
  const bandRows = useMemo(() => buildGridRows(groupMovies(sortMovies(movies, sorting), groupKey)), [movies, sorting, groupKey]);
  const columns = useMemo(() => createMovieColumns({ showContext }), [showContext]);
  const filmRow = FILM_ROW[density][showContext ? "withContext" : "plain"];

  const table = useTable({
    features: dataGridFeatures,
    manualPagination: true,
    manualSorting: true,
    autoResetExpanded: false,
    data: bandRows,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.kind === "band" ? (row.subRows as GridRow[]) : undefined),
    getRowCanExpand: (row) => row.original.kind === "band" && row.original.subRows.length > 0,
    state: { sorting, expanded },
    onSortingChange,
    onExpandedChange,
  });

  const rows = table.getRowModel().rows;
  const columnSizes = table.getVisibleLeafColumns().map((column) => column.getSize());
  const { snapshot, handleVirtualizerChange, scrollToRow } = useStickyBand(rows);
  const stickyRow = snapshot ? rows[snapshot.rowIndex] : undefined;

  const allExpanded = expanded === true || bandRows.every((band) => expanded[band.id] === true);
  const toggleAll = () => onExpandedChange(allExpanded ? {} : true);
  const toggleBandById = useCallback((id: string) => table.getRow(id)?.toggleExpanded(), [table]);
  const handleRowClick = useCallback((row: GridRow) => { if (row.kind === "band") toggleBandById(row.id); }, [toggleBandById]);

  // A band the visitor collapsed stays collapsed, but a band that appears for
  // the first time (a filter change surfacing "Unscored") opens like the rest.
  const seenBandIds = useRef(new Set<string>());
  useEffect(() => {
    const unseen = bandRows.filter((band) => !seenBandIds.current.has(band.id));
    if (unseen.length === 0) return;
    unseen.forEach((band) => seenBandIds.current.add(band.id));
    if (expanded !== true) {
      onExpandedChange({ ...expanded, ...Object.fromEntries(unseen.map((band) => [band.id, true])) });
    }
  }, [bandRows, expanded, onExpandedChange]);

  const toggleFromSticky = useCallback(
    (row: (typeof rows)[number]) => {
      const index = rows.indexOf(row);
      row.toggleExpanded();
      requestAnimationFrame(() => scrollToRow(index));
    },
    [rows, scrollToRow],
  );

  const estimateSize = useCallback(
    (_index: number, row: (typeof rows)[number]) => (row.original.kind === "band" ? BAND_ROW_HEIGHT : filmRow.height),
    [filmRow.height],
  );

  return (
    <DataGrid
      table={table}
      recordCount={movies.length}
      emptyMessage="No movies match. Try a different search or reset your view."
      onRowClick={handleRowClick}
      tableLayout={{ dense: density === "compact", rowBorder: true, headerSticky: true, width: "fixed", columnsResizable: false, columnsMovable: false }}
      tableClassNames={{
        base: "min-w-[760px]",
        headerSticky: "sticky top-0 z-10 bg-background",
        bodyRow: cn("group/movie-row", filmRow.className, BAND_ROW_CLASS),
      }}
    >
      <Card className="w-full gap-0 p-0">
        <CardHeader className="flex flex-wrap items-center justify-between px-5 py-4 sm:px-6">
          <div>
            <CardTitle><h2>Your movie list</h2></CardTitle>
            <CardDescription aria-live="polite" aria-atomic="true" data-testid="result-count">
              {numberFormat.format(movies.length)} of {numberFormat.format(totalCount)} movies
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
        <div className="bg-muted/20 flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Field orientation="horizontal" className="w-auto items-center gap-3 *:data-[slot=field-label]:flex-none">
            <FieldLabel htmlFor="movie-group-by" className="shrink-0 font-normal">Group by</FieldLabel>
            <Select value={groupKey} onValueChange={(value) => onGroupKeyChange(value as GroupKey)}>
              <SelectTrigger id="movie-group-by" size="sm" className="w-[176px]">
                <SelectValue>{GROUP_KEY_OPTIONS.find((option) => option.value === groupKey)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {GROUP_KEY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <DisplayPopover density={density} onDensityChange={onDensityChange} showContext={showContext} onShowContextChange={onShowContextChange} />
            <Button type="button" variant="outline" onClick={toggleAll} disabled={bandRows.length === 0}>
              {allExpanded ? "Collapse groups" : "Expand groups"}
            </Button>
          </div>
        </div>
        <CardContent className="border-y px-0">
          <div className="relative">
            <DataGridScrollArea className="[&_[data-slot=scroll-area-viewport]]:max-h-[640px]">
              <StickyBand snapshot={snapshot} row={stickyRow} columnSizes={columnSizes} onToggle={toggleFromSticky} />
              <DataGridTableVirtual
                estimateSize={filmRow.height}
                overscan={16}
                virtualizerOptions={{ estimateSize, onChange: handleVirtualizerChange, scrollToFn: elementScroll, observeElementRect, observeElementOffset }}
              />
            </DataGridScrollArea>
          </div>
        </CardContent>
      </Card>
    </DataGrid>
  );
}
