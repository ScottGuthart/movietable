"use client";

import { IconArrowUpRight, IconEyeOff } from "@tabler/icons-react";
import { RatingControl } from "@/components/taste/rating-control";
import type { HandFilm } from "@/components/taste/use-taste";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Verdict } from "@/lib/taste";

interface HandCellProps {
  film: HandFilm;
  verdict: Verdict | undefined;
  onRate: (slug: string, verdict: Verdict | null) => void;
}

export function HandCell({ film, verdict, onRate }: HandCellProps) {
  const credit = [film.year, film.directors.join(", ")].filter(Boolean).join(" · ");
  return (
    <li className="bg-background motion-safe:animate-in motion-safe:fade-in flex w-64 shrink-0 snap-start flex-col gap-3 p-4 duration-300 sm:w-auto sm:shrink">
      <div className="flex min-w-0 flex-col gap-1">
        <a
          className="group inline-flex max-w-full items-center gap-1.5 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          href={film.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="truncate">{film.title}</span>
          <IconArrowUpRight aria-hidden="true" className="text-muted-foreground size-4 shrink-0 opacity-40 group-hover:opacity-100" />
          <span className="sr-only"> (Metacritic, opens in a new tab)</span>
        </a>
        <p className="text-muted-foreground text-xs font-medium tabular-nums">{credit}</p>
        {film.genres.length > 0 && <p className="text-muted-foreground text-xs">{film.genres.join(", ")}</p>}
        {film.summary && <p className="text-muted-foreground line-clamp-2 pt-1 text-sm leading-relaxed text-pretty">{film.summary}</p>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <RatingControl size="sheet" title={film.title} verdict={verdict} onChange={(next) => onRate(film.slug, next)} />
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => onRate(film.slug, "skip")}>
          <IconEyeOff data-icon="inline-start" aria-hidden="true" />
          Haven’t seen
        </Button>
      </div>
    </li>
  );
}

export function HandCellSkeleton() {
  return (
    <li className="bg-background flex w-64 shrink-0 flex-col gap-3 p-4 sm:w-auto sm:shrink" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="mt-1 h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="mt-auto flex items-center justify-between">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-7 w-24" />
      </div>
    </li>
  );
}
