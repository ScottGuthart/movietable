import { describe, expect, test } from "bun:test";
import type { ScoredMovie } from "@/lib/movies";
import {
  buildProfile,
  dealHand,
  explainMatch,
  filmFeatures,
  forYouScore,
  hasLikes,
  rankMovies,
  ratedCount,
  summarizeProfile,
  type TasteCatalogue,
  type TasteFilm,
  type Verdicts,
} from "@/lib/taste";

const film = (overrides: Partial<TasteFilm> & Pick<TasteFilm, "slug">): TasteFilm => ({
  year: null, summary: null, genres: [], directors: [], writers: [], cast: [], ...overrides,
});

const people = [
  "Francis Ford Coppola", "Mario Puzo", "Marlon Brando", "Al Pacino", "James Caan", "Robert Duvall",
  "Diane Keaton", "Michael Mann", "Robert De Niro", "Hayao Miyazaki", "Rumi Hiiragi", "Jean-Pierre Jeunet",
];
const P = { coppola: 0, puzo: 1, brando: 2, pacino: 3, caan: 4, duvall: 5, keaton: 6, mann: 7, deniro: 8, miyazaki: 9, hiiragi: 10, jeunet: 11 };

const catalogue: TasteCatalogue = {
  films: [
    film({ slug: "the-godfather", year: 1972, genres: ["Crime", "Drama"], directors: [P.coppola],
      writers: [P.puzo, P.coppola], cast: [P.brando, P.pacino, P.caan] }),
    film({ slug: "the-godfather-part-ii", year: 1974, genres: ["Crime", "Drama"], directors: [P.coppola],
      writers: [P.coppola, P.puzo], cast: [P.pacino, P.duvall, P.keaton] }),
    film({ slug: "heat", year: 1995, genres: ["Crime", "Drama", "Thriller"], directors: [P.mann],
      writers: [P.mann], cast: [P.pacino, P.deniro] }),
    film({ slug: "spirited-away", year: 2001, genres: ["Animation", "Adventure", "Family"], directors: [P.miyazaki],
      writers: [P.miyazaki], cast: [P.hiiragi] }),
    film({ slug: "amelie", year: 2001, genres: ["Comedy", "Romance"], directors: [P.jeunet] }),
  ],
  people,
};

const scored = (slug: string, finalScore: number | null = 90): ScoredMovie => ({
  slug, title: slug, year: 2000, popularity: 1000, users: finalScore, critics: finalScore, finalScore, forYou: null,
  link: `https://www.metacritic.com/movie/${slug}/`,
});

const byId = (films: TasteFilm[], slug: string) => films.find((entry) => entry.slug === slug)!;
const forYouOf = (rows: ScoredMovie[], slug: string) => rows.find((row) => row.slug === slug)!.forYou;

describe("film features", () => {
  test("derives one feature per genre, credit, and decade", () => {
    const features = filmFeatures(byId(catalogue.films, "the-godfather"));
    expect(features).toContainEqual({ kind: "decade", key: "1970" });
    expect(features).toContainEqual({ kind: "genre", key: "Crime" });
    expect(features).toContainEqual({ kind: "director", key: "0" });
    expect(features).toContainEqual({ kind: "writer", key: "1" });
    expect(features).toContainEqual({ kind: "cast", key: "3" });
    expect(features).toHaveLength(1 + 2 + 1 + 2 + 3);
  });
  test("skips the decade when the year is unknown", () => {
    expect(filmFeatures(film({ slug: "x", genres: ["Drama"] }))).toEqual([{ kind: "genre", key: "Drama" }]);
  });
});

describe("profile", () => {
  test("weights a like by feature kind", () => {
    const profile = buildProfile(catalogue, { "the-godfather": "like" });
    expect(profile.get("director:0")).toBe(3);
    expect(profile.get("genre:Crime")).toBe(2);
    expect(profile.get("writer:1")).toBe(1.5);
    expect(profile.get("cast:3")).toBe(1);
    expect(profile.get("decade:1970")).toBe(1);
  });
  test("subtracts half weight for a pass and ignores skips", () => {
    const profile = buildProfile(catalogue, { "spirited-away": "pass", amelie: "skip" });
    expect(profile.get("genre:Animation")).toBe(-1);
    expect(profile.get("director:9")).toBe(-1.5);
    expect(profile.has("director:11")).toBe(false);
  });
  test("accumulates across films", () => {
    const profile = buildProfile(catalogue, { "the-godfather": "like", "the-godfather-part-ii": "like", heat: "pass" });
    expect(profile.get("director:0")).toBe(6);
    expect(profile.get("cast:3")).toBe(1.5);
  });
  test("only likes make a profile", () => {
    expect(hasLikes({ a: "pass", b: "skip" })).toBe(false);
    expect(hasLikes({ a: "pass", b: "like" })).toBe(true);
    expect(ratedCount({ a: "pass", b: "like", c: "skip" })).toBe(2);
  });
});

describe("For you score", () => {
  test("blends match strength with Final Score and floors", () => {
    expect(forYouScore(1, 90)).toBe(96);
    expect(forYouScore(0.5, 70)).toBe(58);
    expect(forYouScore(0, 100)).toBe(40);
  });
  test("is unavailable when either input is missing", () => {
    expect(forYouScore(null, 90)).toBeNull();
    expect(forYouScore(1, null)).toBeNull();
  });
});

describe("ranking", () => {
  const movies = ["the-godfather", "the-godfather-part-ii", "heat", "spirited-away", "amelie", "no-metadata"].map((slug) => scored(slug));

  test("leaves For you empty without a like or a catalogue", () => {
    expect(rankMovies(movies, catalogue, {}).every((row) => row.forYou === null)).toBe(true);
    expect(rankMovies(movies, catalogue, { heat: "pass" }).every((row) => row.forYou === null)).toBe(true);
    expect(rankMovies(movies, null, { heat: "like" }).every((row) => row.forYou === null)).toBe(true);
  });
  test("liking The Godfather ranks Coppola and crime films above unrelated ones", () => {
    const ranked = rankMovies(movies, catalogue, { "the-godfather": "like" });
    expect(forYouOf(ranked, "the-godfather-part-ii")).toBe(96);
    expect(forYouOf(ranked, "the-godfather")).toBe(96);
    expect(forYouOf(ranked, "heat")).toBe(58);
    expect(forYouOf(ranked, "heat")!).toBeGreaterThan(forYouOf(ranked, "spirited-away")!);
    expect(forYouOf(ranked, "amelie")).toBe(36);
  });
  test("a pass pulls similar films down", () => {
    const liked = rankMovies(movies, catalogue, { "the-godfather": "like" });
    const passed = rankMovies(movies, catalogue, { "the-godfather": "like", heat: "pass" });
    expect(forYouOf(passed, "heat")!).toBeLessThan(forYouOf(liked, "heat")!);
  });
  test("a film without attributes or without a Final Score shows nothing", () => {
    const ranked = rankMovies([...movies, scored("amelie-unscored", null)], { ...catalogue, films: [...catalogue.films, film({ slug: "amelie-unscored", genres: ["Comedy"] })] }, { "the-godfather": "like" });
    expect(forYouOf(ranked, "no-metadata")).toBeNull();
    expect(forYouOf(ranked, "amelie-unscored")).toBeNull();
  });
  test("scales matches against the best unrated film, not the liked film itself", () => {
    const ranked = rankMovies(movies, catalogue, { "the-godfather": "like", "the-godfather-part-ii": "pass" });
    expect(forYouOf(ranked, "heat")).toBe(96);
  });
  test("still scores when every film with attributes has been rated", () => {
    const solo: TasteCatalogue = { films: [film({ slug: "seed", genres: ["Crime"] })], people: [] };
    expect(forYouOf(rankMovies([scored("seed", 70)], solo, { seed: "like" }), "seed")).toBe(88);
  });
  test("equal match never lets a weaker film beat a stronger one", () => {
    const twins: TasteCatalogue = { films: [film({ slug: "a", genres: ["Crime"] }), film({ slug: "b", genres: ["Crime"] }), film({ slug: "seed", genres: ["Crime"] })], people: [] };
    const ranked = rankMovies([scored("a", 85), scored("b", 40), scored("seed", 70)], twins, { seed: "like" });
    expect(forYouOf(ranked, "a")!).toBeGreaterThan(forYouOf(ranked, "b")!);
  });
  test("keeps input order and every other field", () => {
    const ranked = rankMovies(movies, catalogue, { "the-godfather": "like" });
    expect(ranked.map((row) => row.slug)).toEqual(movies.map((row) => row.slug));
    expect(ranked[0]).toMatchObject({ title: "the-godfather", finalScore: 90, link: movies[0]!.link });
  });
});

describe("explanations", () => {
  const profile = buildProfile(catalogue, { "the-godfather": "like", "spirited-away": "pass" });

  test("names the strongest shared attributes, heaviest first, at most three", () => {
    const reasons = explainMatch(profile, byId(catalogue.films, "the-godfather-part-ii"), catalogue.people);
    expect(reasons[0]).toEqual({ kind: "director", label: "Francis Ford Coppola" });
    expect(reasons).toHaveLength(3);
    expect(reasons.map((reason) => reason.kind)).not.toContain("cast");
  });
  test("names an unrecorded person honestly", () => {
    const reasons = explainMatch(profile, byId(catalogue.films, "the-godfather"), []);
    expect(reasons[0]).toEqual({ kind: "director", label: "Unknown person" });
  });
  test("says nothing when every shared attribute counts against the film", () => {
    expect(explainMatch(profile, byId(catalogue.films, "spirited-away"), catalogue.people)).toEqual([]);
    expect(explainMatch(profile, byId(catalogue.films, "amelie"), catalogue.people)).toEqual([]);
  });
  test("labels decades as a range", () => {
    const reasons = explainMatch(buildProfile(catalogue, { amelie: "like" }), byId(catalogue.films, "spirited-away"), catalogue.people);
    expect(reasons).toEqual([{ kind: "decade", label: "2000s" }]);
  });
});

describe("profile summary", () => {
  test("lists the leading genres then the leading director", () => {
    const profile = buildProfile(catalogue, { "the-godfather": "like", heat: "like" });
    expect(summarizeProfile(profile, catalogue.people)).toEqual(["Crime", "Drama", "Francis Ford Coppola"]);
  });
  test("is empty without likes", () => {
    expect(summarizeProfile(buildProfile(catalogue, { heat: "pass" }), catalogue.people)).toEqual([]);
  });
});

describe("starter hand", () => {
  const candidate = (slug: string, year: number, genre: string, popularity: number | null) => ({ slug, year, genres: [genre], popularity });
  const candidates = [
    candidate("d", 2004, "Drama", 600),
    candidate("a", 2001, "Drama", 900),
    candidate("e", 1975, "Crime", 500),
    candidate("c", 1995, "Crime", 700),
    candidate("b", 2002, "Drama", 800),
    candidate("f", 2005, "Drama", null),
  ];

  test("deals the most popular film from each decade and genre first", () => {
    expect(dealHand(candidates, 0, 3).map((row) => row.slug)).toEqual(["a", "c", "e"]);
  });
  test("continues with the remaining films by popularity, unknown popularity last", () => {
    expect(dealHand(candidates, 3, 3).map((row) => row.slug)).toEqual(["b", "d", "f"]);
    expect(dealHand(candidates, 0, 10).map((row) => row.slug)).toEqual(["a", "c", "e", "b", "d", "f"]);
  });
  test("is deterministic and never invents films", () => {
    expect(dealHand(candidates, 0, 3)).toEqual(dealHand([...candidates].reverse(), 0, 3));
    expect(dealHand([], 0, 12)).toEqual([]);
    expect(dealHand(candidates, 99, 12)).toEqual([]);
  });
});

describe("verdict typing", () => {
  test("accepts only the three verdicts", () => {
    const verdicts: Verdicts = { a: "like", b: "pass", c: "skip" };
    expect(Object.keys(verdicts)).toHaveLength(3);
  });
});
