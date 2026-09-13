"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { ProviderIcon } from "@/components/movie-grid/provider-icon";
import { isFilmRow, type GridRow } from "@/components/movie-grid/rows";
import type { Provider } from "@/lib/catalogue";
import type { FilmSignals } from "@/lib/movies";

export const WATCH_COLUMN_SIZE = 120;
const MARKS_SHOWN = 4;

export type ProviderIndex = ReadonlyMap<number, Provider>;

export function WatchMarks({ signals, providers }: { signals: FilmSignals | undefined; providers: ProviderIndex }) {
  if (!signals) return null;
  const known = signals.streamOn.map((id) => providers.get(id)).filter((provider): provider is Provider => Boolean(provider));
  if (known.length === 0) {
    return signals.free ? <Badge variant="outline">Free</Badge> : null;
  }
  const shown = known.slice(0, MARKS_SHOWN);
  const hidden = known.length - shown.length;
  const names = known.map((provider) => provider.name).join(", ");
  return (
    <span className="inline-flex items-center gap-1" title={names}>
      <span className="sr-only">Streaming on {names}</span>
      {shown.map((provider) => <ProviderIcon key={provider.id} name={provider.name} iconUrl={provider.icon_url} />)}
      {hidden > 0 && <span aria-hidden="true" className="text-muted-foreground text-xs tabular-nums">+{hidden}</span>}
    </span>
  );
}

/** Subscription availability at a glance; rent, buy, and details live in the detail band. */
export function watchColumn(providers: ProviderIndex): ColumnDef<DataGridFeatures, GridRow> {
  return {
    id: "watch",
    enableSorting: false,
    header: ({ column }) => <DataGridColumnHeader title="Watch" column={column} />,
    size: WATCH_COLUMN_SIZE,
    cell: ({ row }) => (isFilmRow(row.original) ? <WatchMarks signals={row.original.movie.signals} providers={providers} /> : null),
  };
}
