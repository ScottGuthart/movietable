import { describe, expect, test } from "bun:test";
import { finalScore, getMovieBounds, matchesSearch, normalizeMovie, popularityPercentiles, scoreMovies, slugFromLink } from "@/lib/movies";

const source = { title: "A Movie", year: 2020, link: "https://www.metacritic.com/movie/a-movie" };

describe("movie normalization and weighting", () => {
  test("keeps missing scores distinct from zero", () => {
    expect(normalizeMovie(source)).toMatchObject({ popularity: null, users: null, critics: null });
    expect(normalizeMovie({ ...source, users_rated: 0, userscore: 0, metascore: 0 })).toMatchObject({ popularity: 0, users: 0, critics: 0 });
    expect(normalizeMovie({ ...source, userscore: NaN, metascore: Infinity }).users).toBeNull();
  });
  test("preserves score endpoints and floors the weighted result", () => {
    const movie = { users: 83, critics: 98 };
    expect(finalScore(movie, 0)).toBe(83);
    expect(finalScore(movie, 1)).toBe(98);
    expect(finalScore(movie, 0.5)).toBe(90);
    expect(finalScore(movie, 0.1)).toBe(84);
  });
  test("requires only sources with a nonzero contribution", () => {
    expect(finalScore({ users: null, critics: 96 }, 0.5)).toBeNull();
    expect(finalScore({ users: null, critics: 96 }, 1)).toBe(96);
    expect(finalScore({ users: 70, critics: null }, 0)).toBe(70);
    expect(finalScore({ users: 70, critics: null }, 1)).toBeNull();
    expect(finalScore({ users: null, critics: null }, 0)).toBeNull();
    expect(finalScore({ users: 0, critics: 0 }, 0.5)).toBe(0);
    expect(finalScore({ users: NaN, critics: 90 }, 0.5)).toBeNull();
  });
  test("rejects invalid weights", () => {
    for (const weight of [-0.1, 1.1, Infinity, NaN]) expect(() => finalScore({ users: 80, critics: 90 }, weight)).toThrow(RangeError);
    for (const weight of [-0.1, 1.1, NaN]) expect(() => finalScore({ users: 80, critics: 90 }, 0.5, weight)).toThrow(RangeError);
  });
  test("ranks popularity as a catalogue percentile, tied counts sharing a rank", () => {
    const counts = [Number.NaN, 10, 10, 1000, 100000].map((users_rated) => normalizeMovie({ ...source, users_rated }));
    expect(popularityPercentiles(counts)).toEqual([null, 25, 25, 63, 88]);
    expect(popularityPercentiles([])).toEqual([]);
    expect(popularityPercentiles([{ popularity: null }])).toEqual([null]);
  });
  test("leaves the blend untouched until popularity is weighted in", () => {
    const movie = { users: 80, critics: 90, popularityScore: 20 };
    expect(finalScore(movie, 0.5)).toBe(85);
    expect(finalScore(movie, 0.5, 0)).toBe(85);
    expect(finalScore(movie, 0.5, 0.5)).toBe(52);
    expect(finalScore(movie, 0.5, 1)).toBe(20);
    expect(finalScore({ ...movie, popularityScore: null }, 0.5, 0.5)).toBeNull();
    expect(finalScore({ ...movie, popularityScore: null }, 0.5)).toBe(85);
  });
  test("scores a catalogue with popularity folded in", () => {
    const raw = [1, 500, 100000].map((users_rated) => normalizeMovie({ ...source, users_rated, userscore: 60, metascore: 60 }));
    const plain = scoreMovies(raw, 0.5);
    expect(plain.map((movie) => movie.finalScore)).toEqual([60, 60, 60]);
    expect(plain.map((movie) => movie.popularityScore)).toEqual([17, 50, 83]);
    expect(scoreMovies(raw, 0.5, 1).map((movie) => movie.finalScore)).toEqual([17, 50, 83]);
  });
  test("derives the year bounds and keeps scoring separate from normalization", () => {
    const movies = [{ ...source, year: 1916 }, { ...source, year: 2026 }, source].map(normalizeMovie);
    expect(getMovieBounds(movies)).toEqual({ earliestYear: 1916, latestYear: 2026 });
    expect("finalScore" in movies[0]!).toBe(false);
    expect(scoreMovies(movies, 0.5).every((movie) => movie.finalScore === null && movie.forYou === null)).toBe(true);
  });
  test("searches case-insensitively across visible fields", () => {
    const movie = { ...normalizeMovie({ ...source, userscore: 80, metascore: 91, users_rated: 1234 }), popularityScore: 50, finalScore: 85, forYou: null };
    for (const term of ["a movie", " MOVIE ", "2020", "1234", "80", "91", "85", ""]) expect(matchesSearch(movie, term)).toBe(true);
    expect(matchesSearch(movie, "not in the title")).toBe(false);
    expect(matchesSearch({ ...movie, finalScore: null }, "null")).toBe(false);
    expect(matchesSearch({ ...movie, forYou: 42 }, "42")).toBe(true);
    expect(matchesSearch(movie, "42")).toBe(false);
  });
});

describe("slugs", () => {
  test("derives the Metacritic slug from a link", () => {
    expect(slugFromLink("https://www.metacritic.com/movie/the-godfather/")).toBe("the-godfather");
    expect(slugFromLink("https://www.metacritic.com/movie/heat")).toBe("heat");
    expect(normalizeMovie(source).slug).toBe("a-movie");
    expect(normalizeMovie({ ...source, slug: "given" }).slug).toBe("given");
  });
});
