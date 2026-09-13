import { describe, expect, test } from "bun:test";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { createMovieFields, describeQuery, GENRE_FIELD_ID, matchesQuery, MOVIE_FIELDS } from "@/lib/movie-filters";
import { normalizeMovie, scoreMovies, type ScoredMovie } from "@/lib/movies";

function film(genres: string[] | undefined): ScoredMovie {
  const base = scoreMovies([normalizeMovie({ title: "x", year: 2000, users_rated: 1, userscore: 80, metascore: 80, link: "https://www.metacritic.com/movie/x" })], 0.5)[0]!;
  return genres ? { ...base, signals: { directors: [], writers: [], genres, streamOn: [], free: false } } : base;
}

function query(operator: string, value: unknown): FilterQuery {
  return { id: "q", type: "group", combinator: "and", rules: [{ id: "r", type: "rule", path: [GENRE_FIELD_ID], operator, value }] };
}

describe("genre filter", () => {
  test("has any of / has all of / has none of", () => {
    const drama = film(["Drama", "Thriller"]);
    expect(matchesQuery(drama, query("has_any_of", ["Comedy", "Thriller"]))).toBe(true);
    expect(matchesQuery(drama, query("has_all_of", ["Drama", "Comedy"]))).toBe(false);
    expect(matchesQuery(drama, query("has_all_of", ["Drama", "Thriller"]))).toBe(true);
    expect(matchesQuery(drama, query("has_none_of", ["Comedy"]))).toBe(true);
    expect(matchesQuery(drama, query("has_none_of", ["Drama"]))).toBe(false);
  });

  test("films without signals count as having no genres", () => {
    expect(matchesQuery(film(undefined), query("has_any_of", ["Drama"]))).toBe(false);
    expect(matchesQuery(film(undefined), query("empty", undefined))).toBe(true);
    expect(matchesQuery(film(["Drama"]), query("not_empty", undefined))).toBe(true);
  });

  test("an empty selection is an incomplete rule and matches everything", () => {
    expect(matchesQuery(film(["Drama"]), query("has_any_of", []))).toBe(true);
  });

  test("describes chosen genres as a list", () => {
    expect(describeQuery(query("has_any_of", ["Drama", "Comedy"]))).toBe("Genre has any of Drama, Comedy");
  });

  test("createMovieFields fills the genre field's options and leaves the rest alone", () => {
    const fields = createMovieFields({ languages: [], subgenres: [], genres: ["Action", "Drama"] });
    expect(fields.find((field) => field.id === GENRE_FIELD_ID)?.options?.map((option) => option.value)).toEqual(["Action", "Drama"]);
    expect(fields.length).toBe(MOVIE_FIELDS.length);
    expect(MOVIE_FIELDS.find((field) => field.id === GENRE_FIELD_ID)?.options).toEqual([]);
  });
});
