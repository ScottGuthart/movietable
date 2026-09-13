import { describe, expect, test } from "bun:test";
import type { ScoredMovie } from "@/lib/movies";
import {
  buildProfile,
  dealHand,
  explainMatch,
  filmFeatures,
  forYouScore,
  hasPositive,
  parseVerdict,
  rankMovies,
  ratingFactor,
  ratedCount,
  summarizeProfile,
  type TasteCatalogue,
  type TasteFilm,
  type Verdicts,
} from "@/lib/taste";

const film = (overrides: Partial<TasteFilm> & Pick<TasteFilm, "slug">): TasteFilm => ({
  year: null, summary: null, genres: [], subgenres: [], language: null, directors: [], writers: [], cast: [], ...overrides,
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
  slug, title: slug, year: 2000, popularity: 1000, popularityScore: 50, users: finalScore, critics: finalScore, finalScore, forYou: null,
  language: null, subgenres: [], oscarWins: null, oscarNominations: null,
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
  test("adds subgenres and the language as features of their own kinds", () => {
    const features = filmFeatures(film({ slug: "x", subgenres: ["Gangster", "Epic"], language: "Italian" }));
    expect(features).toContainEqual({ kind: "subgenre", key: "Gangster" });
    expect(features).toContainEqual({ kind: "subgenre", key: "Epic" });
    expect(features).toContainEqual({ kind: "language", key: "Italian" });
    expect(features).toHaveLength(3);
  });
  test("weights a subgenre between a genre and a writer, and a language like a cast member", () => {
    const solo: TasteCatalogue = { films: [film({ slug: "s", subgenres: ["Gangster"], language: "Italian" })], people: [] };
    const profile = buildProfile(solo, { s: 5 });
    expect(profile.get("subgenre:Gangster")).toBe(1.5);
    expect(profile.get("language:Italian")).toBe(1);
    expect(explainMatch(profile, solo.films[0]!, [])).toEqual([{ kind: "subgenre", label: "Gangster" }, { kind: "language", label: "Italian" }]);
  });
  test("skips the decade when the year is unknown", () => {
    expect(filmFeatures(film({ slug: "x", genres: ["Drama"] }))).toEqual([{ kind: "genre", key: "Drama" }]);
  });
});

describe("profile", () => {
  test("weights a like by feature kind", () => {
    const profile = buildProfile(catalogue, { "the-godfather": 5 });
    expect(profile.get("director:0")).toBe(3);
    expect(profile.get("genre:Crime")).toBe(2);
    expect(profile.get("writer:1")).toBe(1.5);
    expect(profile.get("cast:3")).toBe(1);
    expect(profile.get("decade:1970")).toBe(1);
  });
  test("scales a rating around three stars: five is full weight, two is minus half, three is nothing", () => {
    const profile = buildProfile(catalogue, { "the-godfather": 5, heat: 3, amelie: 4 });
    expect(profile.get("director:0")).toBe(3);
    expect(profile.get("director:7")).toBeUndefined();
    expect(profile.get("genre:Thriller")).toBeUndefined();
    expect(profile.get("director:11")).toBe(1.5);
    expect(profile.get("genre:Comedy")).toBe(1);
  });
  test("a two-star rating counts against a film at two fifths weight and skips carry nothing", () => {
    const profile = buildProfile(catalogue, { "spirited-away": 2, amelie: "skip" });
    expect(profile.get("genre:Animation")).toBeCloseTo(-0.8);
    expect(profile.get("director:9")).toBeCloseTo(-1.2);
    expect(profile.has("director:11")).toBe(false);
  });
  test("accumulates across films", () => {
    const profile = buildProfile(catalogue, { "the-godfather": 5, "the-godfather-part-ii": 5, heat: 2 });
    expect(profile.get("director:0")).toBe(6);
    expect(profile.get("cast:3")).toBeCloseTo(1.6);
  });
  test("only four or five stars make a profile", () => {
    expect(hasPositive({ a: 2, b: "skip" })).toBe(false);
    expect(hasPositive({ a: 2, b: 4 })).toBe(true);
    expect(ratedCount({ a: 2, b: 5, c: "skip" })).toBe(2);
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
    expect(rankMovies(movies, catalogue, { heat: 2 }).every((row) => row.forYou === null)).toBe(true);
    expect(rankMovies(movies, null, { heat: 5 }).every((row) => row.forYou === null)).toBe(true);
  });
  test("liking The Godfather ranks Coppola and crime films above unrelated ones", () => {
    const ranked = rankMovies(movies, catalogue, { "the-godfather": 5 });
    expect(forYouOf(ranked, "the-godfather-part-ii")).toBe(96);
    expect(forYouOf(ranked, "the-godfather")).toBe(96);
    expect(forYouOf(ranked, "heat")).toBe(58);
    expect(forYouOf(ranked, "heat")!).toBeGreaterThan(forYouOf(ranked, "spirited-away")!);
    expect(forYouOf(ranked, "amelie")).toBe(36);
  });
  test("a pass pulls similar films down", () => {
    const liked = rankMovies(movies, catalogue, { "the-godfather": 5 });
    const passed = rankMovies(movies, catalogue, { "the-godfather": 5, heat: 2 });
    expect(forYouOf(passed, "heat")!).toBeLessThan(forYouOf(liked, "heat")!);
  });
  test("a film without attributes or without a Final Score shows nothing", () => {
    const ranked = rankMovies([...movies, scored("amelie-unscored", null)], { ...catalogue, films: [...catalogue.films, film({ slug: "amelie-unscored", genres: ["Comedy"] })] }, { "the-godfather": 5 });
    expect(forYouOf(ranked, "no-metadata")).toBeNull();
    expect(forYouOf(ranked, "amelie-unscored")).toBeNull();
  });
  test("scales matches against the best unrated film, not the liked film itself", () => {
    const ranked = rankMovies(movies, catalogue, { "the-godfather": 5, "the-godfather-part-ii": 2 });
    expect(forYouOf(ranked, "heat")).toBe(96);
  });
  test("still scores when every film with attributes has been rated", () => {
    const solo: TasteCatalogue = { films: [film({ slug: "seed", genres: ["Crime"] })], people: [] };
    expect(forYouOf(rankMovies([scored("seed", 70)], solo, { seed: 5 }), "seed")).toBe(88);
  });
  test("equal match never lets a weaker film beat a stronger one", () => {
    const twins: TasteCatalogue = { films: [film({ slug: "a", genres: ["Crime"] }), film({ slug: "b", genres: ["Crime"] }), film({ slug: "seed", genres: ["Crime"] })], people: [] };
    const ranked = rankMovies([scored("a", 85), scored("b", 40), scored("seed", 70)], twins, { seed: 5 });
    expect(forYouOf(ranked, "a")!).toBeGreaterThan(forYouOf(ranked, "b")!);
  });
  test("keeps input order and every other field", () => {
    const ranked = rankMovies(movies, catalogue, { "the-godfather": 5 });
    expect(ranked.map((row) => row.slug)).toEqual(movies.map((row) => row.slug));
    expect(ranked[0]).toMatchObject({ title: "the-godfather", finalScore: 90, link: movies[0]!.link });
  });
});

describe("explanations", () => {
  const profile = buildProfile(catalogue, { "the-godfather": 5, "spirited-away": 2 });

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
    const reasons = explainMatch(buildProfile(catalogue, { amelie: 5 }), byId(catalogue.films, "spirited-away"), catalogue.people);
    expect(reasons).toEqual([{ kind: "decade", label: "2000s" }]);
  });
});

describe("profile summary", () => {
  test("lists the leading genres then the leading director", () => {
    const profile = buildProfile(catalogue, { "the-godfather": 5, heat: 5 });
    expect(summarizeProfile(profile, catalogue.people)).toEqual(["Crime", "Drama", "Francis Ford Coppola"]);
  });
  test("is empty without likes", () => {
    expect(summarizeProfile(buildProfile(catalogue, { heat: 2 }), catalogue.people)).toEqual([]);
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

describe("verdicts", () => {
  test("accept whole stars from one to five or a skip", () => {
    const verdicts: Verdicts = { a: 1, b: 5, c: "skip" };
    expect(Object.keys(verdicts)).toHaveLength(3);
  });
  test("migrate saved thumbs, accept half steps, and reject anything else", () => {
    expect(parseVerdict("like")).toBe(4);
    expect(parseVerdict("pass")).toBe(2);
    expect(parseVerdict("skip")).toBe("skip");
    expect(parseVerdict(3)).toBe(3);
    expect(parseVerdict(3.5)).toBe(3.5);
    expect(parseVerdict(0.5)).toBe(0.5);
    expect(parseVerdict(5)).toBe(5);
    for (const bad of [0, 5.5, 6, 2.25, "loved", null, undefined, {}]) expect(parseVerdict(bad)).toBeNull();
  });
  test("weights run from fully against at half a star to fully for at five, neutral at three", () => {
    expect(ratingFactor(0.5)).toBe(-1);
    expect(ratingFactor(1.5)).toBeCloseTo(-0.6);
    expect(ratingFactor(3)).toBe(0);
    expect(ratingFactor(3.5)).toBe(0.25);
    expect(ratingFactor(4.5)).toBe(0.75);
    expect(ratingFactor(5)).toBe(1);
    expect(hasPositive({ a: 3.5 })).toBe(false);
    expect(hasPositive({ a: 4.5 })).toBe(true);
    expect(buildProfile(catalogue, { "the-godfather": 4.5 }).get("director:0")).toBe(2.25);
  });
  test("three stars count as rated but not as a favourite", () => {
    expect(ratedCount({ a: 3, b: "skip" })).toBe(1);
    expect(hasPositive({ a: 3 })).toBe(false);
    expect(hasPositive({ a: 4 })).toBe(true);
  });
});
