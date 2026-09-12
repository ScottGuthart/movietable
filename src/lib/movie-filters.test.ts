import { describe, expect, test } from "bun:test";
import data from "@/components/data.json";
import type { FilterQuery, FilterRule } from "@/components/reui/filters/filters-types";
import { DEFAULT_QUERY, describeQuery, emptyQuery, isCompleteRule, matchesQuery, MOVIE_FIELDS, numericValue } from "@/lib/movie-filters";
import { normalizeMovie, scoreMovies, type ScoredMovie } from "@/lib/movies";

const movie: ScoredMovie = { title: "The Great Film", year: 2020, popularity: 500, users: 80, critics: 90, finalScore: 85, link: "https://www.metacritic.com/movie/test" };
const rule = (field: string, operator: string, value?: unknown): FilterRule => ({ id: `${field}-${operator}`, type: "rule", path: [field], operator, value });
const group = (combinator: "and" | "or", ...rules: FilterQuery["rules"]): FilterQuery => ({ id: "group", type: "group", combinator, rules });
const check = (field: string, operator: string, value?: unknown, row = movie) => matchesQuery(row, group("and", rule(field, operator, value)));

describe("movie query evaluation", () => {
  test("preserves the 390 default results", () => {
    const scored = scoreMovies(data.map(normalizeMovie), 0.5);
    expect(scored.filter((row) => matchesQuery(row, DEFAULT_QUERY))).toHaveLength(390);
    expect(scored.filter((row) => matchesQuery(row, emptyQuery()))).toHaveLength(3963);
  });
  test.each([
    ["contains", "GREAT", true], ["contains", "bad", false],
    ["not_contains", "great", false], ["not_contains", "bad", true],
    ["starts_with", "the", true], ["starts_with", "great", false],
    ["ends_with", "FILM", true], ["ends_with", "great", false],
    ["is", "the great film", true], ["is", "film", false],
    ["is_not", "the great film", false], ["is_not", "film", true],
    ["empty", undefined, false], ["not_empty", undefined, true],
  ])("text operator %s with %s gives %s", (operator, value, expected) => {
    expect(check("title", operator, value)).toBe(expected);
  });
  test.each([
    ["eq", 80, true], ["eq", 81, false], ["neq", 80, false], ["neq", 81, true],
    ["gt", 79, true], ["gt", 80, false], ["gte", 80, true], ["gte", 81, false],
    ["lt", 81, true], ["lt", 80, false], ["lte", 80, true], ["lte", 79, false],
    ["between", [80, 80], true], ["between", [81, 100], false],
    ["not_between", [80, 80], false], ["not_between", [81, 100], true],
    ["empty", undefined, false], ["not_empty", undefined, true],
  ])("numeric operator %s with %s gives %s", (operator, value, expected) => {
    expect(check("users", operator, value)).toBe(expected);
  });
  test("all exposed fields and operators have evaluation coverage", () => {
    const covered = ["contains", "not_contains", "starts_with", "ends_with", "is", "is_not", "eq", "neq", "gt", "gte", "lt", "lte", "between", "not_between", "empty", "not_empty"];
    expect(MOVIE_FIELDS.map((field) => field.id)).toEqual(["title", "year", "popularity", "users", "critics", "finalScore"]);
    for (const field of MOVIE_FIELDS) {
      if (!Array.isArray(field.operators)) throw new Error("Expected an explicit operator catalog");
      for (const operator of field.operators) expect(covered).toContain(operator.value);
    }
    for (const field of ["year", "popularity", "users", "critics", "finalScore"] as const) expect(check(field, "eq", movie[field])).toBe(true);
  });
  test("unknown numeric values are not zero, including in negative comparisons", () => {
    const missing = { ...movie, users: null };
    expect(check("users", "empty", undefined, missing)).toBe(true);
    expect(check("users", "not_empty", undefined, missing)).toBe(false);
    expect(check("users", "eq", 0, missing)).toBe(false);
    expect(check("users", "neq", 0, missing)).toBe(false);
    expect(check("users", "not_between", [0, 100], missing)).toBe(false);
    expect(check("users", "eq", 0, { ...movie, users: 0 })).toBe(true);
  });
  test("evaluates nested AND / OR without flattening", () => {
    const query = group("and", rule("year", "gte", 2000), group("or", rule("title", "contains", "great"), rule("critics", "lt", 50)));
    expect(matchesQuery(movie, query)).toBe(true);
    expect(matchesQuery({ ...movie, year: 1999 }, query)).toBe(false);
    expect(matchesQuery({ ...movie, title: "Another Film" }, query)).toBe(false);
    expect(matchesQuery({ ...movie, title: "Another Film", critics: 40 }, query)).toBe(true);
  });
  test("supports rule negation", () => {
    expect(matchesQuery(movie, group("and", { ...rule("title", "contains", "great"), negated: true }))).toBe(false);
    expect(matchesQuery(movie, group("and", { ...rule("year", "lt", 2000), negated: true }))).toBe(true);
  });
  test("ignores incomplete rules inside OR rather than treating them as matches", () => {
    const query = group("or", rule("title", "contains", "missing"), rule("users", "gte", ""), group("and"));
    expect(matchesQuery(movie, query)).toBe(false);
    expect(matchesQuery(movie, group("or", rule("users", "gte", "")))).toBe(true);
    expect(matchesQuery(movie, group("and", rule("users", "gte", "")))).toBe(true);
  });
  test("empty roots and nested groups impose no condition", () => {
    expect(matchesQuery(movie, emptyQuery())).toBe(true);
    expect(matchesQuery(movie, group("or"))).toBe(true);
    expect(matchesQuery(movie, group("and", group("or")))).toBe(true);
  });
  test("validates finite numeric values, preserves zero and rejects reversed ranges", () => {
    for (const value of ["", " ", null, undefined, {}, NaN, Infinity, "not a number"]) expect(numericValue(value)).toBeUndefined();
    expect(numericValue("0")).toBe(0);
    expect(numericValue(0)).toBe(0);
    expect(isCompleteRule(rule("users", "gte", "0"))).toBe(true);
    for (const value of [[90, 80], [80], ["", 100], [null, 100]]) expect(isCompleteRule(rule("users", "between", value))).toBe(false);
    expect(isCompleteRule(rule("title", "contains", "  "))).toBe(false);
    expect(isCompleteRule(rule("link", "contains", "https"))).toBe(false);
    expect(isCompleteRule(rule("year", "unsupported", 2020))).toBe(false);
  });
  test("filters re-evaluate the derived final score after changing weights", () => {
    const query = group("and", rule("finalScore", "gte", 89));
    expect(scoreMovies([movie], 0).filter((row) => matchesQuery(row, query))).toHaveLength(0);
    expect(scoreMovies([movie], 1).filter((row) => matchesQuery(row, query))).toHaveLength(1);
  });
  test("renders parenthesized grouping and negation in the expression", () => {
    const query = group("and", rule("year", "gte", 2000), group("or", rule("title", "contains", "great"), { ...rule("critics", "lt", 50), negated: true }));
    expect(describeQuery(query)).toBe('Year at least 2000 AND (Title contains "great" OR NOT (Critics less than 50))');
    expect(describeQuery(emptyQuery())).toBe("All movies");
    expect(describeQuery(group("and", rule("users", "gte", "")))).toContain("incomplete — ignored");
  });
});
