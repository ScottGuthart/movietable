"use client";

import { useState } from "react";
import { IconArrowUpRight, IconInfoCircle } from "@tabler/icons-react";
import { useFilmDetail, type FilmDetailState } from "@/components/film-detail/use-film-detail";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { oscarSummary, type FilmDetailData, type PricedOffer } from "@/lib/film-detail";
import type { ScoredMovie } from "@/lib/movies";
import { isSupabaseConfigured } from "@/lib/supabase-browser";
import { useMediaQuery } from "@/lib/use-media-query";

const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 underline-offset-4 hover:underline">
      {children}
      <IconArrowUpRight aria-hidden="true" className="text-muted-foreground size-3.5 opacity-40 group-hover:opacity-100" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function PricedList({ label, offers }: { label: string; offers: PricedOffer[] }) {
  if (offers.length === 0) return null;
  const priced = offers.filter((offer) => offer.price !== null).map((offer) => offer.price as number);
  const from = priced.length > 0 ? ` from ${price.format(Math.min(...priced))}` : "";
  return (
    <p className="text-sm leading-relaxed">
      <span className="text-muted-foreground">{label}{from}: </span>
      {offers.map((offer, index) => (
        <span key={offer.name} className="inline-block">
          {index > 0 && <span className="text-muted-foreground">{"\u00a0·\u00a0"}</span>}
          <OutLink href={offer.url}>{offer.name}</OutLink>
        </span>
      ))}
    </p>
  );
}

function WhereToWatch({ detail }: { detail: FilmDetailData }) {
  const { stream, rent, buy } = detail.offers;
  if (stream.length + rent.length + buy.length === 0) {
    return <p className="text-muted-foreground text-sm">No US streaming, rental, or purchase offers in the last update.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {stream.length > 0 && (
        <p className="text-sm leading-relaxed">
          <span className="text-muted-foreground">Stream: </span>
          {stream.map((offer, index) => (
            <span key={offer.name} className="inline-block">
              {index > 0 && <span className="text-muted-foreground">{"\u00a0·\u00a0"}</span>}
              <OutLink href={offer.url}>{offer.name}</OutLink>
            </span>
          ))}
        </p>
      )}
      <PricedList label="Rent" offers={rent} />
      <PricedList label="Buy" offers={buy} />
      <p className="text-muted-foreground text-xs">Prices in USD at the last update.</p>
    </div>
  );
}

function Oscars({ detail }: { detail: FilmDetailData }) {
  if (!detail.oscars) return null;
  const summary = oscarSummary(detail.oscars.wins, detail.oscars.nominations);
  if (!summary && detail.awards.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {summary && <p className="text-sm font-medium">{summary}</p>}
      {detail.awards.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-sm">
          {detail.awards.map((line) => (
            <li key={`${line.text}-${line.detail}`} className="flex justify-between gap-3">
              <span>{line.text}</span>
              <span className="text-muted-foreground shrink-0">{line.detail}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-muted-foreground text-xs">Academy Award counts from Wikidata, indicative rather than complete.</p>
    </div>
  );
}

function Body({ movie, state, retry }: { movie: ScoredMovie; state: FilmDetailState; retry: () => void }) {
  if (state.status === "error") {
    return (
      <div className="flex flex-col gap-3" role="alert">
        <p className="text-sm">{state.message}</p>
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={retry}>Try again</Button>
      </div>
    );
  }
  if (state.status !== "ready") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading film details">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </div>
    );
  }
  const { detail } = state;
  const meta = [detail.year, detail.directors.join(", "), detail.language ?? "—"].filter(Boolean).join(" · ");
  return (
    <>
      <PopoverHeader>
        <PopoverTitle className="text-base leading-snug">{detail.title}</PopoverTitle>
        <PopoverDescription className="tabular-nums">{meta}</PopoverDescription>
        {detail.subgenres.length > 0 && (
          <p className="text-muted-foreground text-xs">
            {detail.subgenres.map((subgenre, index) => (
              <span key={subgenre} className="inline-block">
                {index > 0 && "\u00a0·\u00a0"}
                {subgenre}
              </span>
            ))}
          </p>
        )}
      </PopoverHeader>
      {detail.summary && <p className="text-sm leading-relaxed text-pretty">{detail.summary}</p>}
      <Oscars detail={detail} />
      <WhereToWatch detail={detail} />
      <p className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
        <OutLink href={movie.link}>Metacritic</OutLink>
        {detail.imdbUrl && <OutLink href={detail.imdbUrl}>IMDb</OutLink>}
        {detail.justwatchUrl && <OutLink href={detail.justwatchUrl}>JustWatch</OutLink>}
      </p>
    </>
  );
}

/** An info button beside a title that opens the film's detail, fetched for that film alone when first opened. */
export function FilmDetail({ movie }: { movie: ScoredMovie }) {
  const [open, setOpen] = useState(false);
  const narrow = useMediaQuery("(max-width: 767px)");
  const { state, retry } = useFilmDetail(open ? movie.slug : null);
  if (!isSupabaseConfigured()) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-xs" aria-label={`Details for ${movie.title}`} className="text-muted-foreground hover:text-foreground shrink-0" />}
      >
        <IconInfoCircle aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent side={narrow ? "bottom" : "right"} align="start" className="max-h-[var(--available-height)] w-80 max-w-[calc(100vw-2rem)] gap-3 overflow-y-auto p-4">
        <Body movie={movie} state={state} retry={retry} />
      </PopoverContent>
    </Popover>
  );
}
