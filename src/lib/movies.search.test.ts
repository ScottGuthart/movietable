import { describe, expect, test } from "bun:test";
import { matchesSearch, normalizeMovie, scoreMovies } from "@/lib/movies";

const base = scoreMovies([normalizeMovie({ title: "Parasite", year: 2019, users_rated: 1, userscore: 88, metascore: 97, link: "https://www.metacritic.com/movie/parasite" })], 0.5)[0]!;
const movie = { ...base, signals: { directors: [{ slug: "bong-joon-ho", name: "Bong Joon Ho" }], writers: [{ slug: "han-jin-won", name: "Han Jin-won" }], genres: ["Drama"], streamOn: [], free: false } };

describe("matchesSearch with people", () => {
  test("matches director and writer names", () => {
    expect(matchesSearch(movie, "bong")).toBe(true);
    expect(matchesSearch(movie, "jin-won")).toBe(true);
  });
  test("does not match genres or cast", () => {
    expect(matchesSearch(movie, "drama")).toBe(false);
  });
  test("still works without signals", () => {
    expect(matchesSearch(base, "parasite")).toBe(true);
    expect(matchesSearch(base, "bong")).toBe(false);
  });
});
