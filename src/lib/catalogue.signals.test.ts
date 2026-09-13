import { describe, expect, test } from "bun:test";
import { toFilmDetail, toSignals, type DetailRow, type SignalRow } from "@/lib/catalogue";

const bong = { slug: "bong-joon-ho", name: "Bong Joon Ho" };
const han = { slug: "han-jin-won", name: "Han Jin-won" };
const credit = (role: "director" | "writer" | "cast", billing: number, person: { slug: string; name: string }, character: string | null = null) =>
  ({ role, billing, person_slug: person.slug, people: { name: person.name }, character });

describe("toSignals", () => {
  test("splits credits by role in billing order and collects subscription providers once", () => {
    const rows: SignalRow[] = [{
      slug: "parasite",
      movie_genres: [{ genre_name: "Drama" }, { genre_name: "Thriller" }],
      credits: [credit("writer", 2, han), credit("director", 1, bong), credit("writer", 1, bong)],
      streaming_offers: [
        { provider_id: 9, monetization: "flatrate" },
        { provider_id: 9, monetization: "flatrate" },
        { provider_id: 3, monetization: "flatrate" },
        { provider_id: 7, monetization: "ads" },
      ],
    }];
    const signals = toSignals(rows);
    expect(signals.parasite).toEqual({
      directors: [bong],
      writers: [bong, han],
      genres: ["Drama", "Thriller"],
      streamOn: [3, 9],
      free: true,
    });
  });

  test("a film with no offers is not free and streams nowhere", () => {
    const signals = toSignals([{ slug: "quiet", movie_genres: [], credits: [], streaming_offers: [] }]);
    expect(signals.quiet).toEqual({ directors: [], writers: [], genres: [], streamOn: [], free: false });
  });
});

describe("toFilmDetail", () => {
  const row: DetailRow = {
    slug: "parasite",
    summary: "  A poor family schemes.  ",
    justwatch_url: "https://www.justwatch.com/us/movie/parasite-2019",
    movie_imdb: { imdb_id: "tt6751668" },
    movie_genres: [{ genre_name: "Drama" }],
    credits: [
      credit("cast", 2, { slug: "choi-woo-sik", name: "Choi Woo-sik" }, "Ki-woo"),
      credit("cast", 1, { slug: "song-kang-ho", name: "Song Kang-ho" }, "Ki-taek"),
      credit("director", 1, bong),
    ],
    streaming_offers: [
      { monetization: "rent", quality: "HD", url: "https://a", price: 3.99, currency_code: "USD", providers: { id: 2, name: "Apple TV", icon_url: null } },
      { monetization: "flatrate", quality: "4K", url: "https://h", price: null, currency_code: null, providers: { id: 27, name: "HBO Max", icon_url: "https://images/hbo" } },
    ],
  };

  test("orders cast by billing, keeps the total, trims the summary, and sorts offers stream first", () => {
    const detail = toFilmDetail(row);
    expect(detail.summary).toBe("A poor family schemes.");
    expect(detail.cast.map((member) => member.name)).toEqual(["Song Kang-ho", "Choi Woo-sik"]);
    expect(detail.cast[0]?.character).toBe("Ki-taek");
    expect(detail.castTotal).toBe(2);
    expect(detail.directors).toEqual([bong]);
    expect(detail.offers.map((offer) => offer.provider)).toEqual(["HBO Max", "Apple TV"]);
    expect(detail.offers[1]).toMatchObject({ monetization: "rent", quality: "HD", price: 3.99, currency: "USD" });
  });

  test("an empty summary becomes null", () => {
    expect(toFilmDetail({ ...row, summary: "   " }).summary).toBeNull();
  });

  test("links IMDb from the match and reads string prices PostgREST sends for numerics", () => {
    const detail = toFilmDetail({ ...row, streaming_offers: [{ ...row.streaming_offers[0]!, price: "3.99" }] });
    expect(detail.imdbUrl).toBe("https://www.imdb.com/title/tt6751668/");
    expect(detail.offers[0]?.price).toBe(3.99);
  });

  test("has no IMDb link without a match and no award lines by default", () => {
    const detail = toFilmDetail({ ...row, movie_imdb: null });
    expect(detail.imdbUrl).toBeNull();
    expect(detail.awards).toEqual({ lines: [], hiddenNominations: 0 });
  });

  test("turns award rows into lines, wins first", () => {
    const detail = toFilmDetail(row, [
      { award_name: "Academy Award for Best Director", result: "nominee", year: 2020, person_name: "Bong Joon-ho", person_slug: "bong-joon-ho" },
      { award_name: "Academy Award for Best Picture", result: "win", year: 2020, person_name: "", person_slug: null },
    ]);
    expect(detail.awards).toEqual({
      lines: [
        { text: "Best Picture", detail: "Won, 2020" },
        { text: "Best Director ·\u00a0Bong Joon-ho", detail: "Nominated, 2020" },
      ],
      hiddenNominations: 0,
    });
  });
});
