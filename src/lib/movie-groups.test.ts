import { describe, expect, test } from "bun:test";
import { averageFinalScore, groupMovies, groupSlotFor, sortMovies } from "@/lib/movie-groups";
import { normalizeMovie, scoreMovies, type ScoredMovie } from "@/lib/movies";

/** Builds a scored movie through the real normalizer so new Movie fields keep compiling. */
function movie(overrides: Partial<ScoredMovie> & { title: string }): ScoredMovie {
  const link = `https://www.metacritic.com/movie/${overrides.title.toLowerCase().replace(/\s+/g, "-")}`;
  const base = scoreMovies([normalizeMovie({ title: overrides.title, year: 2000, users_rated: 500, userscore: 80, metascore: 80, link })], 0.5)[0];
  if (!base) throw new Error("scoreMovies returned no movie");
  return { ...base, ...overrides };
}

describe("groupSlotFor", () => {
  test("score bands split on 90, 80, 70, 60 and send null to Unscored", () => {
    expect(groupSlotFor(movie({ title: "a", finalScore: 100 }), "score").label).toBe("90+");
    expect(groupSlotFor(movie({ title: "b", finalScore: 90 }), "score").label).toBe("90+");
    expect(groupSlotFor(movie({ title: "c", finalScore: 89 }), "score").label).toBe("80–89");
    expect(groupSlotFor(movie({ title: "d", finalScore: 60 }), "score").label).toBe("60–69");
    expect(groupSlotFor(movie({ title: "e", finalScore: 59 }), "score").label).toBe("Under 60");
    expect(groupSlotFor(movie({ title: "f", finalScore: 0 }), "score").label).toBe("Under 60");
    expect(groupSlotFor(movie({ title: "g", finalScore: null }), "score").label).toBe("Unscored");
  });

  test("decades floor the year and order newest first", () => {
    expect(groupSlotFor(movie({ title: "a", year: 1916 }), "decade").label).toBe("1910s");
    expect(groupSlotFor(movie({ title: "b", year: 2024 }), "decade").label).toBe("2020s");
    expect(groupSlotFor(movie({ title: "c", year: 2020 }), "decade").order).toBeLessThan(
      groupSlotFor(movie({ title: "d", year: 2019 }), "decade").order,
    );
  });

  test("popularity tiers split on 10,000, 2,500, 1,000, 300 and send null last", () => {
    expect(groupSlotFor(movie({ title: "a", popularity: 10_000 }), "popularity").label).toBe("10,000+ ratings");
    expect(groupSlotFor(movie({ title: "b", popularity: 9_999 }), "popularity").label).toBe("2,500–9,999 ratings");
    expect(groupSlotFor(movie({ title: "c", popularity: 300 }), "popularity").label).toBe("300–999 ratings");
    expect(groupSlotFor(movie({ title: "d", popularity: 299 }), "popularity").label).toBe("Under 300 ratings");
    expect(groupSlotFor(movie({ title: "e", popularity: null }), "popularity").label).toBe("No popularity data");
    expect(groupSlotFor(movie({ title: "e", popularity: null }), "popularity").order).toBeGreaterThan(
      groupSlotFor(movie({ title: "d", popularity: 299 }), "popularity").order,
    );
  });
});

describe("averageFinalScore", () => {
  test("rounds the mean of scored films and ignores unscored ones", () => {
    expect(averageFinalScore([{ finalScore: 90 }, { finalScore: 93 }, { finalScore: null }])).toBe(92);
    expect(averageFinalScore([{ finalScore: 90 }, { finalScore: 91 }])).toBe(91);
  });

  test("is null when nothing is scored", () => {
    expect(averageFinalScore([])).toBeNull();
    expect(averageFinalScore([{ finalScore: null }])).toBeNull();
  });
});

describe("groupMovies", () => {
  const movies = [
    movie({ title: "Low", finalScore: 55 }),
    movie({ title: "Top", finalScore: 95 }),
    movie({ title: "Missing", finalScore: null, users: null }),
    movie({ title: "Top two", finalScore: 91 }),
  ];

  test("keeps fixed band order regardless of input order and drops empty bands", () => {
    const groups = groupMovies(movies, "score");
    expect(groups.map((group) => group.label)).toEqual(["90+", "Under 60", "Unscored"]);
  });

  test("preserves input order inside a group and computes the average", () => {
    const [top] = groupMovies(movies, "score");
    expect(top?.movies.map((item) => item.title)).toEqual(["Top", "Top two"]);
    expect(top?.averageFinalScore).toBe(93);
  });

  test("returns no groups for no movies", () => {
    expect(groupMovies([], "decade")).toEqual([]);
  });

  test("decade groups run newest to oldest", () => {
    const groups = groupMovies(
      [movie({ title: "a", year: 1994 }), movie({ title: "b", year: 2021 }), movie({ title: "c", year: 1999 })],
      "decade",
    );
    expect(groups.map((group) => group.label)).toEqual(["2020s", "1990s"]);
    expect(groups[1]?.movies.map((item) => item.title)).toEqual(["a", "c"]);
  });
});

describe("sortMovies", () => {
  const movies = [
    movie({ title: "Beta", users: 70, popularity: null }),
    movie({ title: "Alpha", users: null, popularity: 10 }),
    movie({ title: "Gamma", users: 90, popularity: 5 }),
  ];

  test("returns input order with no sorting rule", () => {
    expect(sortMovies(movies, [])).toBe(movies);
  });

  test("sorts numbers with nulls last in both directions", () => {
    expect(sortMovies(movies, [{ id: "users", desc: true }]).map((item) => item.title)).toEqual([
      "Gamma",
      "Beta",
      "Alpha",
    ]);
    expect(sortMovies(movies, [{ id: "users", desc: false }]).map((item) => item.title)).toEqual([
      "Beta",
      "Gamma",
      "Alpha",
    ]);
  });

  test("sorts titles alphabetically and reverses on desc", () => {
    expect(sortMovies(movies, [{ id: "title", desc: false }]).map((item) => item.title)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    expect(sortMovies(movies, [{ id: "title", desc: true }])[0]?.title).toBe("Gamma");
  });

  test("keeps input order on ties", () => {
    const tied = [movie({ title: "First", users: 80 }), movie({ title: "Second", users: 80 })];
    expect(sortMovies(tied, [{ id: "users", desc: true }]).map((item) => item.title)).toEqual(["First", "Second"]);
  });

  test("ignores unknown columns", () => {
    expect(sortMovies(movies, [{ id: "link", desc: true }])).toBe(movies);
  });
});
