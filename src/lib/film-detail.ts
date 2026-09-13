import { cleanSubgenre } from "@/lib/catalogue";

export interface OfferRow {
  monetization: "flatrate" | "free" | "ads" | "rent" | "buy";
  /** PostgREST returns numerics as strings. */
  price: number | string | null;
  quality: string;
  url: string;
  providers: { name: string } | null;
}

export interface OfferEntry {
  name: string;
  url: string;
}

export interface PricedOffer extends OfferEntry {
  price: number | null;
}

export interface GroupedOffers {
  /** Subscription, free, and ad-supported services, one per provider. */
  stream: OfferEntry[];
  rent: PricedOffer[];
  buy: PricedOffer[];
}

const STREAMING = new Set<OfferRow["monetization"]>(["flatrate", "free", "ads"]);

function priceOf(offer: OfferRow): number | null {
  if (offer.price === null) return null;
  const value = Number(offer.price);
  return Number.isFinite(value) ? value : null;
}

function cheapest(offers: OfferRow[]): PricedOffer[] {
  const best = new Map<string, PricedOffer>();
  for (const offer of offers) {
    const name = offer.providers?.name;
    if (!name) continue;
    const price = priceOf(offer);
    const current = best.get(name);
    if (!current || (price !== null && (current.price === null || price < current.price))) best.set(name, { name, price, url: offer.url });
  }
  return [...best.values()].sort((a, b) => a.name.localeCompare(b.name, "en-US"));
}

/** One line per provider: streaming services first, then the cheapest rent and buy offers. */
export function groupOffers(offers: OfferRow[]): GroupedOffers {
  const stream = new Map<string, OfferEntry>();
  for (const offer of offers) {
    const name = offer.providers?.name;
    if (name && STREAMING.has(offer.monetization) && !stream.has(name)) stream.set(name, { name, url: offer.url });
  }
  return {
    stream: [...stream.values()].sort((a, b) => a.name.localeCompare(b.name, "en-US")),
    rent: cheapest(offers.filter((offer) => offer.monetization === "rent")),
    buy: cheapest(offers.filter((offer) => offer.monetization === "buy")),
  };
}

/** A row of the planned `movie_awards` table; the person is set for acting and craft categories. */
export interface AwardRow {
  award: string;
  category: string;
  outcome: "won" | "nominated";
  year: number | null;
  person_slug: string | null;
  people: { name: string } | null;
}

export interface AwardLine {
  text: string;
  detail: string;
}

/** Wins before nominations, each naming the category and the person it went to. */
export function awardLines(rows: AwardRow[]): AwardLine[] {
  return [...rows]
    .sort((a, b) => Number(a.outcome !== "won") - Number(b.outcome !== "won"))
    .map((row) => ({
      text: row.people?.name ? `${row.category} · ${row.people.name}` : row.category,
      detail: `${row.outcome === "won" ? "Won" : "Nominated"}${row.year ? `, ${row.year}` : ""}`,
    }));
}

export function imdbUrl(imdbId: string): string {
  return `https://www.imdb.com/title/${imdbId}/`;
}

/** The per-film row the detail popover requests. */
export interface FilmDetailRow {
  title: string;
  year: number | null;
  summary: string | null;
  justwatch_url: string | null;
  movie_imdb: { imdb_id: string; language: string | null; oscar_wins: number | null; oscar_nominations: number | null } | null;
  movie_genres: { genre_name: string }[];
  movie_subgenres: { subgenre_name: string }[];
  credits: { role: "director" | "writer" | "cast"; billing: number; person_slug: string; people: { name: string } | null }[];
  streaming_offers: OfferRow[];
}

export interface FilmDetailData {
  title: string;
  year: number | null;
  summary: string | null;
  directors: string[];
  language: string | null;
  subgenres: string[];
  oscars: { wins: number; nominations: number } | null;
  awards: AwardLine[];
  offers: GroupedOffers;
  imdbUrl: string | null;
  justwatchUrl: string | null;
}

/** Shapes the raw row into what the popover shows; subgenres drop labels that repeat the film's genres. */
export function toFilmDetail(row: FilmDetailRow, awards: AwardRow[]): FilmDetailData {
  const genres = new Set(row.movie_genres.map((entry) => entry.genre_name.toLocaleLowerCase("en-US")));
  const subgenres = [...new Set(row.movie_subgenres.map((entry) => cleanSubgenre(entry.subgenre_name)))]
    .filter((label) => !genres.has(label.toLocaleLowerCase("en-US")))
    .sort((a, b) => a.localeCompare(b, "en-US"));
  const directors = row.credits
    .filter((credit) => credit.role === "director")
    .sort((a, b) => a.billing - b.billing)
    .map((credit) => credit.people?.name ?? credit.person_slug);
  const imdb = row.movie_imdb;
  return {
    title: row.title,
    year: row.year,
    summary: row.summary,
    directors,
    language: imdb?.language ?? null,
    subgenres,
    oscars: imdb ? { wins: imdb.oscar_wins ?? 0, nominations: imdb.oscar_nominations ?? 0 } : null,
    awards: awardLines(awards),
    offers: groupOffers(row.streaming_offers),
    imdbUrl: imdb ? imdbUrl(imdb.imdb_id) : null,
    justwatchUrl: row.justwatch_url,
  };
}

/** "2 Oscars, 9 nominations", "Nominated for 3 Oscars", or null when there is nothing to say. */
export function oscarSummary(wins: number | null, nominations: number | null): string | null {
  if (wins && wins > 0) {
    const won = `${wins} Oscar${wins === 1 ? "" : "s"}`;
    return nominations && nominations > 0 ? `${won}, ${nominations} nomination${nominations === 1 ? "" : "s"}` : won;
  }
  if (nominations && nominations > 0) return `Nominated for ${nominations} Oscar${nominations === 1 ? "" : "s"}`;
  return null;
}
