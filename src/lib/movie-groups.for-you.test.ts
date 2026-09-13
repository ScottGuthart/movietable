import { describe, expect, test } from "bun:test";
import { GROUP_KEY_OPTIONS, groupMovies, groupSlotFor, sortMovies } from "@/lib/movie-groups";
import { normalizeMovie, scoreMovies, type ScoredMovie } from "@/lib/movies";

function movie(title: string, forYou: number | null): ScoredMovie {
  const [base] = scoreMovies([normalizeMovie({ title, year: 2000, users_rated: 500, userscore: 80, metascore: 80, link: `https://www.metacritic.com/movie/${title}` })], 0.5);
  if (!base) throw new Error("scoreMovies returned no movie");
  return { ...base, forYou };
}

describe("For you grouping and sorting", () => {
  test("offers a For you band grouping", () => {
    expect(GROUP_KEY_OPTIONS.map((option) => option.value)).toContain("forYou");
  });
  test("bands For you on the same thresholds as Final Score and sends null last", () => {
    expect(groupSlotFor(movie("a", 93), "forYou")).toMatchObject({ label: "90+", order: 0 });
    expect(groupSlotFor(movie("b", 80), "forYou")).toMatchObject({ label: "80–89", order: 1 });
    expect(groupSlotFor(movie("c", 12), "forYou")).toMatchObject({ label: "Under 60", order: 4 });
    expect(groupSlotFor(movie("d", null), "forYou")).toMatchObject({ label: "Not yet ranked", order: 5 });
    expect(groupSlotFor(movie("e", 93), "forYou").id).not.toBe(groupSlotFor(movie("e", 93), "score").id);
  });
  test("groups by For you in fixed band order", () => {
    const groups = groupMovies([movie("low", 61), movie("none", null), movie("top", 95)], "forYou");
    expect(groups.map((group) => group.label)).toEqual(["90+", "60–69", "Not yet ranked"]);
  });
  test("sorts by For you with missing values last in both directions", () => {
    const rows = [movie("mid", 70), movie("none", null), movie("top", 96)];
    expect(sortMovies(rows, [{ id: "forYou", desc: true }]).map((row) => row.title)).toEqual(["top", "mid", "none"]);
    expect(sortMovies(rows, [{ id: "forYou", desc: false }]).map((row) => row.title)).toEqual(["mid", "top", "none"]);
  });
});
