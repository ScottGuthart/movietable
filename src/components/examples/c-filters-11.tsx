"use client";

import { Filters } from "@/components/reui/filters/filters";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { countFilterRules } from "@/components/reui/filters/filters-query";
import { describeQuery, MOVIE_FIELDS, MOVIE_OPERATOR_LABELS } from "@/lib/movie-filters";

interface AdvancedMovieFiltersProps {
  query: FilterQuery;
  onQueryChange: (query: FilterQuery) => void;
}

export function AdvancedMovieFilters({ query, onQueryChange }: AdvancedMovieFiltersProps) {
  return (
    <section aria-labelledby="advanced-filter-heading" className="bg-muted/40 text-foreground border-t">
      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h3 id="advanced-filter-heading" className="font-medium">Build your own filter</h3>
          <span className="text-muted-foreground text-sm">{countFilterRules(query)} conditions</span>
        </div>
        <p className="text-muted-foreground pt-1 text-sm leading-relaxed">
          Combine conditions with AND / OR. Changes apply to the table instantly.
        </p>
      </div>
      <div className="overflow-x-auto px-5 pb-5 sm:px-6" role="region" aria-label="Advanced filter conditions" tabIndex={0}>
        <div className="movie-filter-editor">
          <Filters
            variant="advanced"
            advancedMode="inline"
            reorderable
            fields={MOVIE_FIELDS}
            operatorLabels={MOVIE_OPERATOR_LABELS}
            query={query}
            onQueryChange={onQueryChange}
          />
        </div>
      </div>
      <div className="border-t px-5 py-3 sm:px-6">
        <p className="text-muted-foreground text-sm leading-relaxed" data-testid="query-expression">
          <span className="text-foreground font-medium">Current query: </span>{describeQuery(query)}
        </p>
      </div>
    </section>
  );
}
