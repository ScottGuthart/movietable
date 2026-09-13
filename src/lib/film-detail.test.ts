import { describe, expect, test } from "bun:test";
import { awardLines, groupOffers, imdbUrl, oscarSummary, toFilmDetail, type AwardRow, type FilmDetailRow, type OfferRow } from "@/lib/film-detail";

const offer = (name: string, monetization: OfferRow["monetization"], price: number | null, quality = "HD"): OfferRow =>
  ({ monetization, price, quality, url: `https://example.test/${name}/${monetization}/${quality}`, providers: { name } });

describe("grouping offers", () => {
  test("splits streaming from rent and buy, one entry per provider with the lowest price", () => {
    const grouped = groupOffers([
      offer("Netflix", "flatrate", null), offer("Tubi", "free", null), offer("Pluto", "ads", null),
      offer("Apple TV", "rent", 3.99, "4K"), offer("Apple TV", "rent", 2.99, "SD"), offer("Amazon", "rent", 3.99),
      offer("Apple TV", "buy", 14.99), offer("Netflix", "flatrate", null, "4K"),
    ]);
    expect(grouped.stream.map((entry) => entry.name)).toEqual(["Netflix", "Pluto", "Tubi"]);
    expect(grouped.rent).toEqual([
      { name: "Amazon", price: 3.99, url: "https://example.test/Amazon/rent/HD" },
      { name: "Apple TV", price: 2.99, url: "https://example.test/Apple TV/rent/SD" },
    ]);
    expect(grouped.buy).toEqual([{ name: "Apple TV", price: 14.99, url: "https://example.test/Apple TV/buy/HD" }]);
  });
  test("handles no offers", () => {
    expect(groupOffers([])).toEqual({ stream: [], rent: [], buy: [] });
  });
});

describe("award lines", () => {
  test("names the category, the person when there is one, and the outcome", () => {
    const rows: AwardRow[] = [
      { award: "Academy Awards", category: "Best Picture", outcome: "won", year: 1973, person_slug: null, people: null },
      { award: "Academy Awards", category: "Best Actor", outcome: "won", year: 1973, person_slug: "marlon-brando", people: { name: "Marlon Brando" } },
      { award: "Academy Awards", category: "Best Supporting Actor", outcome: "nominated", year: 1973, person_slug: "al-pacino", people: { name: "Al Pacino" } },
    ];
    expect(awardLines(rows)).toEqual([
      { text: "Best Picture", detail: "Won, 1973" },
      { text: "Best Actor · Marlon Brando", detail: "Won, 1973" },
      { text: "Best Supporting Actor · Al Pacino", detail: "Nominated, 1973" },
    ]);
  });
  test("puts wins before nominations", () => {
    const rows: AwardRow[] = [
      { award: "Academy Awards", category: "Best Director", outcome: "nominated", year: null, person_slug: null, people: null },
      { award: "Academy Awards", category: "Best Picture", outcome: "won", year: null, person_slug: null, people: null },
    ];
    expect(awardLines(rows).map((line) => line.text)).toEqual(["Best Picture", "Best Director"]);
    expect(awardLines(rows)[1]!.detail).toBe("Nominated");
  });
});

describe("links", () => {
  test("builds the IMDb title url from the id", () => {
    expect(imdbUrl("tt0068646")).toBe("https://www.imdb.com/title/tt0068646/");
  });
});

describe("film detail", () => {
  const row: FilmDetailRow = {
    title: "The Godfather", year: 1972, summary: "Aging patriarch.", justwatch_url: "https://www.justwatch.com/us/movie/the-godfather",
    movie_imdb: { imdb_id: "tt0068646", language: "English", oscar_wins: 2, oscar_nominations: 9 },
    movie_genres: [{ genre_name: "Crime" }, { genre_name: "Drama" }],
    movie_subgenres: [{ subgenre_name: "gangster film" }, { subgenre_name: "crime film" }, { subgenre_name: "epic film" }],
    credits: [
      { role: "cast", billing: 1, person_slug: "marlon-brando", people: { name: "Marlon Brando" } },
      { role: "director", billing: 1, person_slug: "francis-ford-coppola", people: { name: "Francis Ford Coppola" } },
    ],
    streaming_offers: [offer("Netflix", "flatrate", null)],
  };
  test("shapes the row for the popover", () => {
    const detail = toFilmDetail(row, []);
    expect(detail).toMatchObject({ title: "The Godfather", directors: ["Francis Ford Coppola"], language: "English", subgenres: ["Epic", "Gangster"],
      oscars: { wins: 2, nominations: 9 }, imdbUrl: "https://www.imdb.com/title/tt0068646/", justwatchUrl: "https://www.justwatch.com/us/movie/the-godfather" });
    expect(detail.offers.stream).toEqual([{ name: "Netflix", url: "https://example.test/Netflix/flatrate/HD" }]);
  });
  test("has no Oscar line or IMDb link without an IMDb match", () => {
    const detail = toFilmDetail({ ...row, movie_imdb: null }, []);
    expect(detail.oscars).toBeNull();
    expect(detail.imdbUrl).toBeNull();
    expect(detail.language).toBeNull();
  });
  test("summarises Oscar counts in words", () => {
    expect(oscarSummary(2, 9)).toBe("2 Oscars, 9 nominations");
    expect(oscarSummary(1, 1)).toBe("1 Oscar, 1 nomination");
    expect(oscarSummary(0, 3)).toBe("Nominated for 3 Oscars");
    expect(oscarSummary(0, 0)).toBeNull();
    expect(oscarSummary(null, null)).toBeNull();
  });
});
