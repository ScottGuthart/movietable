import { describe, expect, test } from "bun:test";
import { GROUP_KEY_OPTIONS, groupMovies, groupSlotFor } from "@/lib/movie-groups";
import { normalizeMovie, scoreMovies, type ScoredMovie } from "@/lib/movies";

function movie(title: string, extra: Partial<ScoredMovie>): ScoredMovie {
  const [base] = scoreMovies([normalizeMovie({ title, year: 2000, users_rated: 500, userscore: 80, metascore: 80, link: `https://www.metacritic.com/movie/${title}` })], 0.5);
  if (!base) throw new Error("scoreMovies returned no movie");
  return { ...base, ...extra };
}

describe("language and Oscar grouping", () => {
  test("offers both groupings", () => {
    expect(GROUP_KEY_OPTIONS.map((option) => option.value)).toEqual(expect.arrayContaining(["language", "oscars"]));
  });
  test("groups languages alphabetically with unknown last", () => {
    const groups = groupMovies([movie("c", { language: "Japanese" }), movie("a", { language: null }), movie("b", { language: "English" }), movie("d", { language: "English" })], "language");
    expect(groups.map((group) => group.label)).toEqual(["English", "Japanese", "Unknown language"]);
    expect(groups[0]!.movies.map((entry) => entry.title)).toEqual(["b", "d"]);
  });
  test("bands Oscars by wins, then nominations, then nothing", () => {
    expect(groupSlotFor(movie("a", { oscarWins: 3, oscarNominations: 11 }), "oscars")).toMatchObject({ label: "3+ Oscar wins", order: 0 });
    expect(groupSlotFor(movie("b", { oscarWins: 1, oscarNominations: 2 }), "oscars")).toMatchObject({ label: "1\u20132 Oscar wins", order: 1 });
    expect(groupSlotFor(movie("c", { oscarWins: 0, oscarNominations: 4 }), "oscars")).toMatchObject({ label: "Nominated only", order: 2 });
    expect(groupSlotFor(movie("d", { oscarWins: 0, oscarNominations: 0 }), "oscars")).toMatchObject({ label: "No Oscar record", order: 3 });
    expect(groupSlotFor(movie("e", { oscarWins: null, oscarNominations: null }), "oscars")).toMatchObject({ label: "No Oscar record", order: 3 });
  });
});
