"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { IconArrowUpRight, IconRefresh } from "@tabler/icons-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderIcon } from "@/components/movie-grid/provider-icon";
import { useFilmDetail } from "@/components/movie-grid/use-film-detail";
import type { CastMember, FilmDetail, FilmOffer, Monetization } from "@/lib/catalogue";
import { oscarSummary } from "@/lib/film-detail";
import type { Person, ScoredMovie } from "@/lib/movies";
import { cn } from "@/lib/utils";

const PERSON_URL = "https://www.metacritic.com/person/";
const OFFER_GROUPS: { label: string; monetizations: Monetization[] }[] = [
  { label: "Stream", monetizations: ["flatrate"] },
  { label: "Free", monetizations: ["free", "ads"] },
  { label: "Rent", monetizations: ["rent"] },
  { label: "Buy", monetizations: ["buy"] },
];
const QUALITY_ORDER = ["4K", "HD", "SD", ""];

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function OutboundLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      className={cn("group/link text-foreground inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring", className)}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <IconArrowUpRight aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0 opacity-40 group-hover/link:opacity-100" />
    </a>
  );
}

/** A name that opens its Metacritic person page; no arrow, so a cast list stays a sentence. */
function PersonLink({ person }: { person: Person }) {
  return (
    <a
      className="text-foreground font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      href={`${PERSON_URL}${person.slug}/`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {person.name}
      <span className="sr-only"> (Metacritic, opens in a new tab)</span>
    </a>
  );
}

function PeopleLine({ label, people }: { label: string; people: Person[] }) {
  if (people.length === 0) return null;
  return (
    <p className="leading-relaxed">
      <span className="text-muted-foreground">{label} </span>
      {people.map((person, index) => (
        <span key={person.slug}>
          {index > 0 && <span className="text-muted-foreground">, </span>}
          <PersonLink person={person} />
        </span>
      ))}
    </p>
  );
}

function CastLine({ cast, total, link }: { cast: CastMember[]; total: number; link: string }) {
  if (cast.length === 0) return null;
  const more = total - cast.length;
  return (
    <p className="leading-relaxed">
      <span className="text-muted-foreground">Cast </span>
      {cast.map((member, index) => (
        <span key={member.slug}>
          {index > 0 && <span className="text-muted-foreground">, </span>}
          <PersonLink person={member} />
          {member.character && <span className="text-muted-foreground"> as {member.character}</span>}
        </span>
      ))}
      {more > 0 && (
        <>
          <span className="text-muted-foreground">, </span>
          <OutboundLink href={link} className="text-muted-foreground font-normal">+{more} more on Metacritic</OutboundLink>
        </>
      )}
    </p>
  );
}

/** Three clamped lines; the inline "More" opens the full text in a compact popover. */
function Synopsis({ text, title }: { text: string; title: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setClamped(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);
  return (
    <div className="max-w-prose">
      <p ref={ref} className="line-clamp-3 leading-relaxed text-pretty">{text}</p>
      {clamped && (
        <Popover>
          <PopoverTrigger
            render={<button type="button" className="text-foreground mt-1 cursor-default text-sm underline decoration-dashed decoration-1 underline-offset-4 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" />}
          >
            More
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-86 gap-0 p-0" align="start">
            <p className="text-foreground border-b px-2 py-1 font-medium">{title}</p>
            <p className="max-h-80 overflow-y-auto px-2 py-1.5 leading-relaxed">{text}</p>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function bestQuality(qualities: string[]): string {
  return [...qualities].sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b))[0] ?? "";
}

/** One line per provider inside a monetization group, carrying its best quality and lowest price. */
function mergeOffers(offers: FilmOffer[]): { key: string; provider: string; iconUrl: string | null; url: string; quality: string; price: number | null }[] {
  const byProvider = new Map<number, FilmOffer[]>();
  for (const offer of offers) byProvider.set(offer.providerId, [...(byProvider.get(offer.providerId) ?? []), offer]);
  return [...byProvider.entries()].map(([providerId, group]) => {
    const cheapest = group.reduce((best, offer) => (offer.price !== null && (best.price === null || offer.price < best.price) ? offer : best), group[0]!);
    return {
      key: String(providerId),
      provider: group[0]!.provider,
      iconUrl: group[0]!.iconUrl,
      url: cheapest.url,
      quality: bestQuality(group.map((offer) => offer.quality)),
      price: cheapest.price,
    };
  });
}

function OfferList({ label, offers }: { label: string; offers: FilmOffer[] }) {
  const merged = mergeOffers(offers);
  if (merged.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <ul className="flex flex-col gap-1">
        {merged.map((offer) => (
          <li key={offer.key}>
            <a
              className="group/offer -mx-1.5 flex items-center gap-2 px-1.5 py-0.5 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ProviderIcon name={offer.provider} iconUrl={offer.iconUrl} scope="offer" />
              <span className="min-w-0 flex-1 truncate font-medium">{offer.provider}</span>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {[offer.price !== null ? usd.format(offer.price) : null, offer.quality || null].filter(Boolean).join(" · ")}
              </span>
              <IconArrowUpRight aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0 opacity-40 group-hover/offer:opacity-100" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WhereToWatch({ detail }: { detail: FilmDetail }) {
  const groups = OFFER_GROUPS.map((group) => ({ ...group, offers: detail.offers.filter((offer) => group.monetizations.includes(offer.monetization)) }))
    .filter((group) => group.offers.length > 0);
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">Where to watch</p>
      {groups.length === 0 ? (
        <p className="text-muted-foreground leading-relaxed">Not streaming in the US right now.</p>
      ) : (
        groups.map((group) => <OfferList key={group.label} label={group.label} offers={group.offers} />)
      )}
      {detail.justwatchUrl && (
        <p className="text-sm">
          <OutboundLink href={detail.justwatchUrl} className="text-muted-foreground font-normal">All options on JustWatch</OutboundLink>
        </p>
      )}
    </div>
  );
}

/** Language then subgenres in Caption; each separator stays glued to the label after it so a wrap never strands a dot. */
function FactsLine({ movie }: { movie: ScoredMovie }) {
  const facts = [movie.language, ...movie.subgenres].filter((fact): fact is string => Boolean(fact));
  if (facts.length === 0) return null;
  return (
    <p className="text-muted-foreground text-xs">
      {facts.map((fact, index) => (
        <span key={fact} className="inline-block">
          {index > 0 && "\u00a0·\u00a0"}
          {fact}
        </span>
      ))}
    </p>
  );
}

/** The Oscar record, each category with its honorees (wins first, five nominations then a count), and the Wikidata caveat. */
function Oscars({ movie, detail }: { movie: ScoredMovie; detail: FilmDetail }) {
  const summary = oscarSummary(movie.oscarWins, movie.oscarNominations);
  const { lines, hiddenNominations } = detail.awards;
  if (!summary && lines.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {summary && <p className="font-medium">{summary}</p>}
      {lines.length > 0 && (
        <ul className="flex max-w-prose flex-col gap-0.5">
          {lines.map((line) => (
            <li key={`${line.text}-${line.detail}`} className="flex justify-between gap-3">
              <span>{line.text}</span>
              <span className="text-muted-foreground shrink-0">{line.detail}</span>
            </li>
          ))}
          {hiddenNominations > 0 && (
            <li className="text-muted-foreground">and {hiddenNominations} more nomination{hiddenNominations === 1 ? "" : "s"}</li>
          )}
        </ul>
      )}
      <p className="text-muted-foreground max-w-prose text-xs">
        Academy Awards from Wikidata. Counts are indicative, and awards to the film itself, such as Best Picture, are often missing from the list.
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[3fr_2fr]" aria-busy="true" aria-label="Loading film details">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function DetailBody({ detail, movie }: { detail: FilmDetail; movie: ScoredMovie }) {
  return (
    <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
      <div className="flex min-w-0 flex-col gap-4">
        {detail.summary ? <Synopsis text={detail.summary} title={movie.title} /> : <p className="text-muted-foreground">No synopsis on record.</p>}
        {detail.genres.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Genres">
            {detail.genres.map((genre) => <li key={genre}><Badge variant="outline">{genre}</Badge></li>)}
          </ul>
        )}
        <FactsLine movie={movie} />
        <div className="flex flex-col gap-1">
          <PeopleLine label="Directed by" people={detail.directors} />
          <PeopleLine label="Written by" people={detail.writers} />
          <CastLine cast={detail.cast} total={detail.castTotal} link={movie.link} />
        </div>
        <Oscars movie={movie} detail={detail} />
        {detail.imdbUrl && (
          <p className="text-sm">
            <OutboundLink href={detail.imdbUrl} className="text-muted-foreground font-normal">More on IMDb</OutboundLink>
          </p>
        )}
      </div>
      <WhereToWatch detail={detail} />
    </div>
  );
}

/**
 * The band beneath an open film. It lives in the row's first cell, in normal
 * flow so the virtualizer measures it, sized to the visible grid and shifted
 * by the horizontal scroll so it never leaves the viewport on narrow screens.
 * The cell's own 24px indent is the band's left gutter; the band resets the
 * cell's Faded Ink and tabular figures so its Body reads as Ink prose.
 */
export function FilmDetailCell({ movie }: { movie: ScoredMovie }) {
  const { state, retry } = useFilmDetail(movie.slug);
  return (
    <section
      data-detail-row=""
      aria-label={`Details for ${movie.title}`}
      className="text-foreground pe-6 ps-0 py-5 text-sm normal-nums whitespace-normal"
      style={{ width: "calc(var(--grid-viewport, 760px) - 24px)", transform: "translateX(var(--grid-scroll-x, 0px))" }}
    >
      {state.status === "loading" && <DetailSkeleton />}
      {state.status === "error" && (
        <p className="flex flex-wrap items-center gap-3">
          <span>{state.message}</span>
          <Button type="button" size="sm" variant="outline" onClick={retry}><IconRefresh data-icon="inline-start" aria-hidden="true" />Retry</Button>
        </p>
      )}
      {state.status === "ready" && <DetailBody detail={state.detail} movie={movie} />}
    </section>
  );
}
