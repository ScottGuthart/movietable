"use client";

import { useCallback, useEffect, useMemo, useRef, type MouseEvent, type ReactNode } from "react";
import { useTable, type ExpandedState, type OnChangeFn, type SortingState } from "@tanstack/react-table";
import { elementScroll, observeElementOffset, observeElementRect } from "@tanstack/react-virtual";
import { DataGrid, dataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTableVirtual } from "@/components/reui/data-grid/data-grid-table-virtual";
import { Filters } from "@/components/reui/filters/filters";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMovieColumns } from "@/components/movie-grid/columns";
import { DisplayPopover, type Density } from "@/components/movie-grid/display-popover";
import { BAND_ROW_HEIGHT, buildGridRows, DETAIL_ROW_ESTIMATE, type GridRow } from "@/components/movie-grid/rows";
import { ServicesPopover, type ProviderUsage } from "@/components/movie-grid/services-popover";
import { StickyBand, useStickyBand } from "@/components/movie-grid/sticky-band";
import type { MyServices } from "@/components/movie-grid/use-my-services";
import type { ProviderIndex } from "@/components/movie-grid/watch-column";
import type { TasteColumnOptions } from "@/components/taste/taste-columns";
import { MOVIE_OPERATOR_LABELS } from "@/lib/movie-filters";
import { GROUP_KEY_OPTIONS, groupMovies, sortMovies, type GroupKey } from "@/lib/movie-groups";
import { useMediaQuery } from "@/lib/use-media-query";
import { numberFormat, type ScoredMovie } from "@/lib/movies";
import { cn } from "@/lib/utils";

const FILM_ROW: Record<Density, { plain: { height: number; className: string }; withContext: { height: number; className: string } }> = {
  compact: { plain: { height: 41, className: "[&>td]:h-9" }, withContext: { height: 49, className: "[&>td]:h-12" } },
  comfortable: { plain: { height: 48, className: "[&>td]:h-12" }, withContext: { height: 60, className: "[&>td]:h-15" } },
};

const ROW_CLASS =
  "cursor-default [&:has([data-band-row])]:cursor-pointer [&:has([data-film-slug])]:cursor-pointer " +
  "[&:has([data-band-row])>td]:h-11 [&:has([data-band-row])>td]:bg-muted/45 [&:has([data-band-row])>td]:shadow-none [&:has([data-band-row]):hover>td]:bg-muted/45 " +
  "[&:has([data-detail-row])>td]:bg-muted/20 [&:has([data-detail-row]):hover>td]:bg-muted/20 [&:has([data-detail-row])>td]:py-0";

/** Clicks on controls and links inside a row are theirs; everything else on a row toggles it. */
const INTERACTIVE = "a, button, input, select, textarea, label, [role='button'], [role='switch'], [role='checkbox'], [role='slider'], [data-detail-row]";

interface MovieGridProps {
  movies: ScoredMovie[];
  totalCount: number;
  fields: FilterField[];
  query: FilterQuery;
  onQueryChange: (query: FilterQuery) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  collapsedBands: ReadonlySet<string>;
  onCollapsedBandsChange: (next: ReadonlySet<string>) => void;
  openFilms: ReadonlySet<string>;
  onOpenFilmsChange: (next: ReadonlySet<string>) => void;
  groupKey: GroupKey;
  onGroupKeyChange: (key: GroupKey) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
  showContext: boolean;
  onShowContextChange: (show: boolean) => void;
  providers: ProviderIndex;
  providerUsage: ProviderUsage[];
  services: MyServices;
  onServicesChange: (next: MyServices) => void;
  actions: ReactNode;
  advancedEditor: ReactNode;
  /** Adds the Rate column and, while a profile is active, the For you column and band grouping. */
  taste?: TasteColumnOptions;
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

export function MovieGrid({
  movies, totalCount, fields, query, onQueryChange, sorting, onSortingChange,
  collapsedBands, onCollapsedBandsChange, openFilms, onOpenFilmsChange,
  groupKey, onGroupKeyChange, density, onDensityChange, showContext, onShowContextChange,
  providers, providerUsage, services, onServicesChange, actions, advancedEditor, taste,
}: MovieGridProps) {
  const bandRows = useMemo(() => buildGridRows(groupMovies(sortMovies(movies, sorting), groupKey)), [movies, sorting, groupKey]);
  const narrow = useMediaQuery("(max-width: 1023px)");
  const columns = useMemo(() => createMovieColumns({ showContext, providers, taste, pinForYou: narrow }), [showContext, providers, taste, narrow]);
  const groupOptions = GROUP_KEY_OPTIONS.filter((option) => option.value !== "forYou" || taste?.active);
  const filmRow = FILM_ROW[density][showContext ? "withContext" : "plain"];
  const bandIds = useMemo(() => new Set(bandRows.map((band) => band.id)), [bandRows]);

  // Bands are open unless collapsed; films are closed unless opened. TanStack sees one map.
  const expanded = useMemo<ExpandedState>(() => {
    const map: Record<string, boolean> = {};
    for (const band of bandRows) if (!collapsedBands.has(band.id)) map[band.id] = true;
    for (const slug of openFilms) map[slug] = true;
    return map;
  }, [bandRows, collapsedBands, openFilms]);

  const handleExpandedChange = useCallback<OnChangeFn<ExpandedState>>((updater) => {
    const next = typeof updater === "function" ? updater(expanded) : updater;
    const map: Record<string, boolean> = next === true ? Object.fromEntries([...bandIds, ...openFilms].map((id) => [id, true])) : next;
    const nextCollapsed = new Set(bandRows.filter((band) => !map[band.id]).map((band) => band.id));
    const nextOpen = new Set(Object.keys(map).filter((id) => map[id] && !bandIds.has(id) && !id.endsWith("#detail")));
    if (!sameSet(nextCollapsed, collapsedBands)) onCollapsedBandsChange(nextCollapsed);
    if (!sameSet(nextOpen, openFilms)) onOpenFilmsChange(nextOpen);
  }, [expanded, bandIds, bandRows, collapsedBands, openFilms, onCollapsedBandsChange, onOpenFilmsChange]);

  const table = useTable({
    features: dataGridFeatures,
    manualPagination: true,
    manualSorting: true,
    autoResetExpanded: false,
    data: bandRows,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => (row.kind === "detail" ? undefined : (row.subRows as GridRow[])),
    getRowCanExpand: (row) => row.original.kind !== "detail" && row.original.subRows.length > 0,
    state: { sorting, expanded },
    onSortingChange,
    onExpandedChange: handleExpandedChange,
  });

  const rows = table.getRowModel().rows;
  const columnSizes = table.getVisibleLeafColumns().map((column) => column.getSize());
  const { snapshot, handleVirtualizerChange, scrollToRow } = useStickyBand(rows);
  const stickyRow = snapshot ? rows[snapshot.rowIndex] : undefined;

  const allExpanded = bandRows.every((band) => !collapsedBands.has(band.id));
  const toggleAll = () => onCollapsedBandsChange(allExpanded ? new Set(bandIds) : new Set());

  const handleGridClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE)) return;
    const tr = target.closest("tr");
    if (!tr) return;
    const slug = tr.querySelector("[data-film-slug]")?.getAttribute("data-film-slug");
    const bandId = tr.querySelector("[data-band-row]")?.getAttribute("data-band-row");
    const id = slug || bandId;
    if (id) table.getRow(id)?.toggleExpanded();
  }, [table]);

  const toggleFromSticky = useCallback(
    (row: (typeof rows)[number]) => {
      const index = rows.indexOf(row);
      row.toggleExpanded();
      requestAnimationFrame(() => scrollToRow(index));
    },
    [rows, scrollToRow],
  );

  const estimateSize = useCallback(
    (_index: number, row: (typeof rows)[number]) => {
      if (row.original.kind === "band") return BAND_ROW_HEIGHT;
      if (row.original.kind === "detail") return DETAIL_ROW_ESTIMATE;
      return filmRow.height;
    },
    [filmRow.height],
  );

  // The detail band fills the visible grid and rides along when the table scrolls sideways;
  // it reads the viewport's width and horizontal offset from these variables.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrapper = gridRef.current;
    const viewport = wrapper?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!wrapper || !viewport) return;
    const size = () => wrapper.style.setProperty("--grid-viewport", `${viewport.clientWidth}px`);
    const scroll = () => wrapper.style.setProperty("--grid-scroll-x", `${viewport.scrollLeft}px`);
    size();
    scroll();
    const observer = new ResizeObserver(size);
    observer.observe(viewport);
    viewport.addEventListener("scroll", scroll, { passive: true });
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", scroll);
    };
  }, []);

  return (
    <DataGrid
      table={table}
      recordCount={movies.length}
      emptyMessage="No movies match. Try a different search or reset your view."
      tableLayout={{ dense: density === "compact", rowBorder: true, headerSticky: true, width: "fixed", columnsResizable: false, columnsMovable: false }}
      tableClassNames={{
        base: "min-w-[760px]",
        headerSticky: "sticky top-0 z-10 bg-background",
        bodyRow: cn("group/movie-row", filmRow.className, ROW_CLASS),
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
              fields={fields}
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Field orientation="horizontal" className="w-auto items-center gap-3 *:data-[slot=field-label]:flex-none">
              <FieldLabel htmlFor="movie-group-by" className="shrink-0 font-normal">Group by</FieldLabel>
              <Select value={groupKey} onValueChange={(value) => onGroupKeyChange(value as GroupKey)}>
                <SelectTrigger id="movie-group-by" size="sm" className="w-[176px]">
                  <SelectValue>{groupOptions.find((option) => option.value === groupKey)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {groupOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <ServicesPopover providers={providerUsage} services={services} onChange={onServicesChange} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DisplayPopover density={density} onDensityChange={onDensityChange} showContext={showContext} onShowContextChange={onShowContextChange} />
            <Button type="button" variant="outline" onClick={toggleAll} disabled={bandRows.length === 0}>
              {allExpanded ? "Collapse groups" : "Expand groups"}
            </Button>
          </div>
        </div>
        <CardContent className="border-y px-0">
          <div ref={gridRef} className="relative" onClick={handleGridClick}>
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
