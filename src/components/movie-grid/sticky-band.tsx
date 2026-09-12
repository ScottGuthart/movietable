"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Row } from "@tanstack/react-table";
import type { Virtualizer } from "@tanstack/react-virtual";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { BandAverage, BandLabel, BandToggle } from "@/components/movie-grid/columns";
import { BAND_ROW_HEIGHT, type BandRow, type GridRow } from "@/components/movie-grid/rows";

type GridVirtualizer = Virtualizer<HTMLElement, HTMLTableRowElement>;

export interface StickyBandSnapshot {
  rowIndex: number;
  /** Vertical push, in px, while the next band hands off. Zero or negative. */
  offset: number;
  /** Height of the sticky column header the band sits beneath. */
  top: number;
}

function findCurrentBand(bandIndices: number[], startOf: (index: number) => number, scrollTop: number) {
  let low = 0;
  let high = bandIndices.length - 1;
  let current = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const index = bandIndices[mid] ?? 0;
    if (startOf(index) < scrollTop) {
      current = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return current;
}

function sameSnapshot(a: StickyBandSnapshot | null, b: StickyBandSnapshot | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.rowIndex === b.rowIndex && a.offset === b.offset && a.top === b.top;
}

/**
 * Tracks which band row owns the viewport's top edge as the virtualized
 * grid scrolls, so a pinned copy can sit under the sticky column header.
 */
export function useStickyBand(rows: Row<DataGridFeatures, GridRow>[]) {
  const [snapshot, setSnapshot] = useState<StickyBandSnapshot | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const virtualizerRef = useRef<GridVirtualizer | null>(null);
  const bandIndices = useMemo(
    () => rows.flatMap((row, index) => (row.original.kind === "band" ? [index] : [])),
    [rows],
  );

  const measure = useCallback(() => {
    const instance = virtualizerRef.current;
    const element = instance?.scrollElement;
    if (!instance || !element) {
      setSnapshot(null);
      return;
    }
    const scrollTop = instance.scrollOffset ?? 0;
    const startOf = (index: number) =>
      instance.measurementsCache[index]?.start ?? instance.getOffsetForIndex(index, "start")?.[0] ?? 0;
    const current = findCurrentBand(bandIndices, startOf, scrollTop);
    if (current < 0) {
      setSnapshot(null);
      return;
    }
    const nextIndex = bandIndices[current + 1];
    let offset = 0;
    if (nextIndex !== undefined) {
      const gap = startOf(nextIndex) - scrollTop;
      if (gap < BAND_ROW_HEIGHT) offset = gap - BAND_ROW_HEIGHT;
    }
    const next: StickyBandSnapshot = {
      rowIndex: bandIndices[current] ?? 0,
      offset,
      top: element.querySelector("thead")?.getBoundingClientRect().height ?? 0,
    };
    setSnapshot((previous) => (sameSnapshot(previous, next) ? previous : next));
  }, [bandIndices]);

  const handleVirtualizerChange = useCallback(
    (instance: GridVirtualizer) => {
      virtualizerRef.current = instance;
      setScrollElement(instance.scrollElement ?? null);
      measure();
    },
    [measure],
  );

  // The virtualizer only notifies when the row window changes; the handoff
  // needs every scroll frame, so listen to the scroll element directly too.
  useEffect(() => {
    if (!scrollElement) return;
    scrollElement.addEventListener("scroll", measure, { passive: true });
    return () => scrollElement.removeEventListener("scroll", measure);
  }, [measure, scrollElement]);

  useEffect(() => {
    measure();
  }, [measure, rows]);

  const scrollToRow = useCallback((index: number) => {
    virtualizerRef.current?.scrollToIndex(index, { align: "start" });
  }, []);

  return { snapshot, handleVirtualizerChange, scrollToRow };
}

interface StickyBandProps {
  snapshot: StickyBandSnapshot | null;
  row: Row<DataGridFeatures, GridRow> | undefined;
  columnSizes: number[];
  onToggle: (row: Row<DataGridFeatures, GridRow>) => void;
}

/**
 * Pinned copy of the band row that owns the viewport top. It renders inside
 * the scroll content as a zero-height sticky anchor, so it scrolls sideways
 * with the columns, catches clicks meant for it, and still lets the wheel
 * reach the grid. The real row keeps the accessible name and control, so
 * this copy is hidden from assistive tech.
 */
export function StickyBand({ snapshot, row, columnSizes, onToggle }: StickyBandProps) {
  if (!snapshot || !row || row.original.kind !== "band") return null;
  const band: BandRow = row.original;
  return (
    <div aria-hidden="true" data-testid="sticky-band" className="sticky z-10 h-0" style={{ top: snapshot.top }}>
      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: BAND_ROW_HEIGHT }}>
        <table
          className="bg-background w-full table-fixed border-collapse text-sm"
          style={{ transform: `translateY(${snapshot.offset}px)` }}
        >
          <colgroup>
            {columnSizes.map((size, index) => <col key={index} style={{ width: size }} />)}
          </colgroup>
          <tbody>
            <tr className="bg-muted/45 cursor-pointer border-b" style={{ height: BAND_ROW_HEIGHT }} onClick={() => onToggle(row)}>
              <td className="ps-6">
                <span className="flex items-center">
                  <BandToggle label={band.group.label} expanded={row.getIsExpanded()} onToggle={() => onToggle(row)} tabIndex={-1} />
                </span>
              </td>
              <td className="px-2"><BandLabel group={band.group} /></td>
              <td colSpan={Math.max(0, columnSizes.length - 3)} />
              <td className="pe-6 text-right"><BandAverage group={band.group} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
