"use client";

import { useMemo, useState } from "react";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { IconChevronDown, IconRefresh, IconSearch, IconX } from "@tabler/icons-react";
import { AdvancedMovieFilters } from "@/components/examples/c-filters-11";
import type { Density } from "@/components/movie-grid/display-popover";
import { MovieGrid } from "@/components/movie-grid/movie-grid";
import type { ProviderUsage } from "@/components/movie-grid/services-popover";
import { canStream, useMyServices } from "@/components/movie-grid/use-my-services";
import { clampBias, useViewParams } from "@/components/movie-grid/view-params";
import type { ProviderIndex } from "@/components/movie-grid/watch-column";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { countFilterRules } from "@/components/reui/filters/filters-query";
import type { TasteColumnOptions } from "@/components/taste/taste-columns";
import { TasteField } from "@/components/taste/taste-field";
import { TastePanel } from "@/components/taste/taste-panel";
import { useTaste } from "@/components/taste/use-taste";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Slider } from "@/components/ui/slider";
import type { Provider } from "@/lib/catalogue";
import { createMovieFields, emptyQuery, filterVocabulary, matchesQuery } from "@/lib/movie-filters";
import { DEFAULT_GROUP_KEY, type GroupKey } from "@/lib/movie-groups";
import { matchesSearch, scoreMovies, type Movie } from "@/lib/movies";

const DEFAULT_SORT: SortingState = [{ id: "finalScore", desc: true }];
const FOR_YOU_SORT: SortingState = [{ id: "forYou", desc: true }];
const DEFAULT_DENSITY: Density = "compact";
const NONE: ReadonlySet<string> = new Set();

/** An explicit choice wins unless it points at For you while no profile is active; otherwise the profile sets the default. */
function resolveSorting(override: SortingState | null, tasteActive: boolean): SortingState {
  if (override && (tasteActive || override[0]?.id !== "forYou")) return override;
  return tasteActive ? FOR_YOU_SORT : DEFAULT_SORT;
}

function resolveGroupKey(override: GroupKey | null, tasteActive: boolean): GroupKey {
  if (override && (tasteActive || override !== "forYou")) return override;
  return tasteActive ? "forYou" : DEFAULT_GROUP_KEY;
}

/** Providers that carry at least one subscription film, most films first. */
function rankProviders(providers: Provider[], movies: Movie[]): ProviderUsage[] {
  const films = new Map<number, number>();
  for (const movie of movies) for (const id of movie.signals?.streamOn ?? []) films.set(id, (films.get(id) ?? 0) + 1);
  return providers
    .flatMap((provider) => (films.has(provider.id) ? [{ ...provider, films: films.get(provider.id)! }] : []))
    .sort((a, b) => b.films - a.films || a.name.localeCompare(b.name, "en-US"));
}

export default function MovieTable({ movies, providers }: { movies: Movie[]; providers: Provider[] }) {
  const [view, setView] = useViewParams();
  const query = view.q;
  const search = view.search;
  const criticWeight = clampBias(view.bias);
  const groupKeyOverride = view.group;
  const setQuery = (next: FilterQuery) => void setView({ q: next });
  const setSearch = (next: string) => void setView({ search: next });
  const setCriticWeight = (next: number) => void setView({ bias: next });
  const setGroupKeyOverride = (next: GroupKey | null) => void setView({ group: next });
  const [sortingOverride, setSortingOverride] = useState<SortingState | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [density, setDensity] = useState<Density>(DEFAULT_DENSITY);
  const [showContext, setShowContext] = useState(false);
  const [collapsedBands, setCollapsedBands] = useState<ReadonlySet<string>>(NONE);
  const [openFilms, setOpenFilms] = useState<ReadonlySet<string>>(NONE);
  const [services, setServices] = useMyServices();

  const fields = useMemo(() => createMovieFields(filterVocabulary(movies)), [movies]);
  const providerIndex = useMemo<ProviderIndex>(() => new Map(providers.map((provider) => [provider.id, provider])), [providers]);
  const providerUsage = useMemo(() => rankProviders(providers, movies), [providers, movies]);

  const scored = useMemo(() => scoreMovies(movies, criticWeight), [movies, criticWeight]);
  const taste = useTaste(scored);
  const rows = useMemo(
    () => taste.ranked.filter((movie) => matchesQuery(movie, query) && matchesSearch(movie, search) && (!services.onlyMine || canStream(movie.signals, services))),
    [taste.ranked, query, search, services],
  );
  const sorting = resolveSorting(sortingOverride, taste.active);
  const groupKey = resolveGroupKey(groupKeyOverride, taste.active);
  const tasteColumns = useMemo<TasteColumnOptions>(
    () => ({ active: taste.active, verdicts: taste.verdicts, rate: taste.rate, explain: taste.explain, unavailableReason: taste.unavailableReason }),
    [taste.active, taste.verdicts, taste.rate, taste.explain, taste.unavailableReason],
  );

  const applySorting: OnChangeFn<SortingState> = (updater) => setSortingOverride(typeof updater === "function" ? updater(sorting) : updater);
  // Picking the default key clears the URL param instead of pinning it; with a taste profile the default is For you, so score stays explicit.
  const changeGroupKey = (key: GroupKey) => { setGroupKeyOverride(key === DEFAULT_GROUP_KEY && !taste.active ? null : key); setCollapsedBands(NONE); };
  const resetView = () => {
    void setView({ q: null, search: null, bias: null, group: null });
    setSortingOverride(null);
    setDensity(DEFAULT_DENSITY);
    setShowContext(false);
    setCollapsedBands(NONE);
    setOpenFilms(NONE);
    taste.setOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Movie search and ranking preferences">
        <FieldGroup className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
          <Field className="md:max-w-md">
            <FieldLabel htmlFor="movie-search">Find a film</FieldLabel>
            <InputGroup>
              <InputGroupInput id="movie-search" placeholder="Search titles, directors, writers…" value={search}
                onChange={(event) => setSearch(event.target.value)} />
              <InputGroupAddon><IconSearch aria-hidden="true" /></InputGroupAddon>
              {search && <InputGroupAddon align="inline-end"><InputGroupButton aria-label="Clear search" size="icon-sm" onClick={() => setSearch("")}><IconX aria-hidden="true" /></InputGroupButton></InputGroupAddon>}
            </InputGroup>
          </Field>
          <Field className="md:max-w-sm">
            <div className="flex items-center justify-between gap-3">
              <FieldLabel id="score-bias-label">Score bias</FieldLabel>
              <output className="text-muted-foreground text-sm" data-testid="score-bias">{criticWeight === 0.5 ? "Equal weight" : `${Math.round(criticWeight * 100)}% critics`}</output>
            </div>
            <Slider value={[criticWeight]} min={0} max={1} step={0.1} aria-labelledby="score-bias-label"
              thumbProps={{ "aria-label": "Critic weighting", getAriaValueText: (_, value) => `${Math.round((1 - value) * 100)} percent users, ${Math.round(value * 100)} percent critics` }}
              onValueChange={(value) => setCriticWeight(typeof value === "number" ? value : value[0])} />
            <div className="text-muted-foreground flex justify-between text-sm"><span>Users</span><span>Critics</span></div>
          </Field>
          <TasteField open={taste.open} onToggle={() => taste.setOpen(!taste.open)} rated={taste.rated} positive={taste.positive} active={taste.active}
            summary={taste.summary} persistent={taste.persistent} state={taste.state} onClear={taste.clear} />
        </FieldGroup>
        <p role="status" className="sr-only">{taste.active ? "Table ranked for your taste." : ""}</p>
      </section>
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <MovieGrid
          movies={rows} totalCount={movies.length} fields={fields} query={query} onQueryChange={setQuery}
          sorting={sorting} onSortingChange={applySorting}
          collapsedBands={collapsedBands} onCollapsedBandsChange={setCollapsedBands} openFilms={openFilms} onOpenFilmsChange={setOpenFilms}
          groupKey={groupKey} onGroupKeyChange={changeGroupKey} density={density} onDensityChange={setDensity}
          showContext={showContext} onShowContextChange={setShowContext}
          providers={providerIndex} providerUsage={providerUsage} services={services} onServicesChange={setServices}
          taste={tasteColumns}
          actions={
            <CollapsibleTrigger render={<Button variant="outline" />}>
              Advanced editor
              <IconChevronDown data-icon="inline-end" aria-hidden="true" className={advancedOpen ? "rotate-180" : ""} />
            </CollapsibleTrigger>
          }
          advancedEditor={
            <>
              {taste.open && (
                <TastePanel state={taste.state} retry={taste.retry} hand={taste.hand} handTotal={taste.handTotal} verdicts={taste.verdicts}
                  rate={taste.rate} dealAnother={taste.dealAnother} rated={taste.rated} positive={taste.positive} />
              )}
              <CollapsibleContent><AdvancedMovieFilters fields={fields} query={query} onQueryChange={setQuery} /></CollapsibleContent>
            </>
          }
        />
      </Collapsible>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          Final Score blends audience and critic ratings, rounded down. For you blends how closely a film matches what you liked with its Final Score. Popularity is the number of audience ratings. Unavailable scores appear as —.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" disabled={countFilterRules(query) === 0} onClick={() => setQuery(emptyQuery())}>Clear filters</Button>
          <Button variant="outline" onClick={resetView}><IconRefresh data-icon="inline-start" aria-hidden="true" />Reset view</Button>
        </div>
      </div>
    </div>
  );
}
