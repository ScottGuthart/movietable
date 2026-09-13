import { describe, expect, test } from "bun:test";
import { finalScore, getMovieBounds, matchesSearch, normalizeMovie, scoreMovies, slugFromLink } from "@/lib/movies";

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
  });
  test("derives the year bounds and keeps scoring separate from normalization", () => {
    const movies = [{ ...source, year: 1916 }, { ...source, year: 2026 }, source].map(normalizeMovie);
    expect(getMovieBounds(movies)).toEqual({ earliestYear: 1916, latestYear: 2026 });
    expect("finalScore" in movies[0]!).toBe(false);
    expect(scoreMovies(movies, 0.5).every((movie) => movie.finalScore === null && movie.forYou === null)).toBe(true);
  });
  test("searches case-insensitively across visible fields", () => {
    const movie = { ...normalizeMovie({ ...source, userscore: 80, metascore: 91, users_rated: 1234 }), finalScore: 85, forYou: null };
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
