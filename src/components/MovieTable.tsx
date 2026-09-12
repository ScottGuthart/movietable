"use client";

import { useMemo, useState } from "react";
import type { ExpandedState, OnChangeFn, SortingState } from "@tanstack/react-table";
import { IconChevronDown, IconRefresh, IconSearch, IconX } from "@tabler/icons-react";
import { AdvancedMovieFilters } from "@/components/examples/c-filters-11";
import type { Density } from "@/components/movie-grid/display-popover";
import { MovieGrid } from "@/components/movie-grid/movie-grid";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { countFilterRules } from "@/components/reui/filters/filters-query";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_QUERY, emptyQuery, matchesQuery } from "@/lib/movie-filters";
import { DEFAULT_GROUP_KEY, type GroupKey } from "@/lib/movie-groups";
import { DEFAULT_CRITIC_WEIGHT, matchesSearch, scoreMovies, type Movie } from "@/lib/movies";

const DEFAULT_SORT: SortingState = [{ id: "finalScore", desc: true }];
const DEFAULT_DENSITY: Density = "compact";
const ALL_EXPANDED: ExpandedState = true;

export default function MovieTable({ movies }: { movies: Movie[] }) {
  const [query, setQuery] = useState<FilterQuery>(DEFAULT_QUERY);
  const [search, setSearch] = useState("");
  const [criticWeight, setCriticWeight] = useState(DEFAULT_CRITIC_WEIGHT);
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [groupKey, setGroupKey] = useState<GroupKey>(DEFAULT_GROUP_KEY);
  const [density, setDensity] = useState<Density>(DEFAULT_DENSITY);
  const [showContext, setShowContext] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState>(ALL_EXPANDED);

  const scored = useMemo(() => scoreMovies(movies, criticWeight), [movies, criticWeight]);
  const rows = useMemo(() => scored.filter((movie) => matchesQuery(movie, query) && matchesSearch(movie, search)), [scored, query, search]);
  const applySorting: OnChangeFn<SortingState> = (next) => setSorting(next);
  const applyExpanded: OnChangeFn<ExpandedState> = (next) => setExpanded(next);
  const changeGroupKey = (key: GroupKey) => { setGroupKey(key); setExpanded(ALL_EXPANDED); };
  const resetView = () => {
    setQuery(DEFAULT_QUERY);
    setSearch("");
    setCriticWeight(DEFAULT_CRITIC_WEIGHT);
    setSorting(DEFAULT_SORT);
    setGroupKey(DEFAULT_GROUP_KEY);
    setDensity(DEFAULT_DENSITY);
    setShowContext(false);
    setExpanded(ALL_EXPANDED);
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Movie search and ranking preferences">
        <FieldGroup className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-12">
          <Field className="md:max-w-md">
            <FieldLabel htmlFor="movie-search">Find a film</FieldLabel>
            <InputGroup>
              <InputGroupInput id="movie-search" placeholder="Search titles, years, scores…" value={search}
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
        </FieldGroup>
      </section>
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <MovieGrid
          movies={rows} totalCount={movies.length} query={query} onQueryChange={setQuery}
          sorting={sorting} onSortingChange={applySorting} expanded={expanded} onExpandedChange={applyExpanded}
          groupKey={groupKey} onGroupKeyChange={changeGroupKey} density={density} onDensityChange={setDensity}
          showContext={showContext} onShowContextChange={setShowContext}
          actions={
            <CollapsibleTrigger render={<Button variant="outline" />}>
              Advanced editor
              <IconChevronDown data-icon="inline-end" aria-hidden="true" className={advancedOpen ? "rotate-180" : ""} />
            </CollapsibleTrigger>
          }
          advancedEditor={<CollapsibleContent><AdvancedMovieFilters query={query} onQueryChange={setQuery} /></CollapsibleContent>}
        />
      </Collapsible>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          Final Score blends audience and critic ratings, rounded down. Popularity is the number of audience ratings. Unavailable scores appear as —.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" disabled={countFilterRules(query) === 0} onClick={() => setQuery(emptyQuery())}>Clear filters</Button>
          <Button variant="outline" onClick={resetView}><IconRefresh data-icon="inline-start" aria-hidden="true" />Reset view</Button>
        </div>
      </div>
    </div>
  );
}
