"use client";

import { IconFilter, IconFilterFilled } from "@tabler/icons-react";
import { countFilterRules } from "@/components/reui/filters/filters-query";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { describeQuery } from "@/lib/movie-filters";
import { numberFormat } from "@/lib/movies";
import { cn } from "@/lib/utils";

/**
 * States plainly what the table is showing and why.
 *
 * The count alone ("3 conditions") tells a visitor that something is on but not
 * what, so the conditions are spelled out in the same words the filter editor
 * uses. The icon fills and takes the accent only while a filter is applied, so
 * an untouched table is visibly untouched.
 */
export function FilterStatus({ query, shown, total }: { query: FilterQuery; shown: number; total: number }) {
  const count = countFilterRules(query);
  const active = count > 0;
  const Icon = active ? IconFilterFilled : IconFilter;
  const films = (value: number) => numberFormat.format(value) + (value === 1 ? " film" : " films");
  return (
    <p role="status" className="text-muted-foreground flex items-start gap-2 text-sm">
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-4 shrink-0 transition-[color,transform] duration-200 ease-out",
          active ? "text-primary scale-110" : "scale-100",
        )}
      />
      <span className="min-w-0">
        {active ? (
          <>
            <span className="text-foreground font-medium">{films(shown)}</span>
            {" of " + numberFormat.format(total) + ", filtered by "}
            <span className="text-foreground">{describeQuery(query)}</span>
          </>
        ) : (
          <>
            <span className="text-foreground font-medium">All {films(total)}</span>
            {" \u2014 no filters applied"}
          </>
        )}
      </span>
    </p>
  );
}
