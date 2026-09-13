import { describe, expect, test } from "bun:test";
import { DIRECTOR_BAND_MIN_FILMS, groupMovies } from "@/lib/movie-groups";
import { normalizeMovie, scoreMovies, type Person, type ScoredMovie } from "@/lib/movies";

function film(title: string, directors: Person[], finalScore = 80): ScoredMovie {
  const base = scoreMovies([normalizeMovie({ title, year: 2000, users_rated: 500, userscore: finalScore, metascore: finalScore, link: `https://www.metacritic.com/movie/${title}` })], 0.5)[0]!;
  return { ...base, signals: { directors, writers: [], genres: [], streamOn: [], free: false } };
}

const bong: Person = { slug: "bong-joon-ho", name: "Bong Joon Ho" };
const nolan: Person = { slug: "christopher-nolan", name: "Christopher Nolan" };
const solo: Person = { slug: "solo", name: "One Timer" };

describe("groupMovies by director", () => {
  test("bands directors with enough films, most films first, then name", () => {
    const groups = groupMovies([film("a", [nolan]), film("b", [bong]), film("c", [bong]), film("d", [nolan]), film("e", [bong])], "director");
    expect(groups.map((group) => group.label)).toEqual(["Bong Joon Ho", "Christopher Nolan"]);
    expect(groups[0]?.movies.map((movie) => movie.title)).toEqual(["b", "c", "e"]);
  });

  test("gathers single-film directors and undirected films into a closing Other directors band", () => {
    const groups = groupMovies([film("a", [solo]), film("b", [bong]), film("c", [bong]), film("d", [])], "director");
    expect(groups.map((group) => group.label)).toEqual(["Bong Joon Ho", "Other directors"]);
    expect(groups[1]?.movies.map((movie) => movie.title)).toEqual(["a", "d"]);
    expect(DIRECTOR_BAND_MIN_FILMS).toBe(2);
  });

  test("uses the first-billed director for co-directed films", () => {
    const groups = groupMovies([film("a", [nolan, bong]), film("b", [nolan])], "director");
    expect(groups.map((group) => group.label)).toEqual(["Christopher Nolan"]);
  });

  test("keeps sort order inside a band and averages Final Score", () => {
    const groups = groupMovies([film("hi", [bong], 95), film("lo", [bong], 71)], "director");
    expect(groups[0]?.movies.map((movie) => movie.title)).toEqual(["hi", "lo"]);
    expect(groups[0]?.averageFinalScore).toBe(83);
  });
});
