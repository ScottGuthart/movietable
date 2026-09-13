import { describe, expect, test } from "bun:test";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import { DEFAULT_QUERY, parseFilterQuery } from "@/lib/movie-filters";

describe("parseFilterQuery", () => {
  test("accepts the default query and nested groups", () => {
    expect(parseFilterQuery(JSON.parse(JSON.stringify(DEFAULT_QUERY)))).toEqual(DEFAULT_QUERY);
    const nested = { id: "root", type: "group", combinator: "or", rules: [{ id: "g", type: "group", combinator: "and", rules: [{ id: "r", type: "rule", path: ["year"], operator: "gte", value: 2000, negated: true }] }] };
    expect(parseFilterQuery(nested)).toEqual(nested as unknown as FilterQuery);
  });

  test("rejects shapes a link could carry by mistake", () => {
    expect(parseFilterQuery(null)).toBeNull();
    expect(parseFilterQuery([])).toBeNull();
    expect(parseFilterQuery({ id: "r", type: "rule", path: ["year"], operator: "eq", value: 1 })).toBeNull();
    expect(parseFilterQuery({ id: "root", type: "group", combinator: "xor", rules: [] })).toBeNull();
    expect(parseFilterQuery({ id: "root", type: "group", combinator: "and", rules: [{ id: "r", type: "rule", path: "year", operator: "eq" }] })).toBeNull();
    expect(parseFilterQuery({ id: "root", type: "group", combinator: "and", rules: [{ type: "rule", path: ["year"], operator: "eq" }] })).toBeNull();
  });

  test("drops unknown keys and keeps rule values untouched", () => {
    const parsed = parseFilterQuery({ id: "root", type: "group", combinator: "and", rules: [{ id: "r", type: "rule", path: ["genre"], operator: "has_any_of", value: ["Drama"], extra: 1 }], extra: true });
    expect(parsed).toEqual({ id: "root", type: "group", combinator: "and", rules: [{ id: "r", type: "rule", path: ["genre"], operator: "has_any_of", value: ["Drama"] }] } as FilterQuery);
  });
});
