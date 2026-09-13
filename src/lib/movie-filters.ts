import type {
  FilterField,
  FilterNode,
  FilterQuery,
  FilterRule,
} from "@/components/reui/filters/filters-types";
import {
  createFilterOperators,
  DEFAULT_FILTER_OPERATOR_LABELS,
} from "@/components/reui/filters/filters-operators";
import type { ScoredMovie } from "@/lib/movies";

export const MOVIE_OPERATOR_LABELS: Record<string, string> = {
  ...DEFAULT_FILTER_OPERATOR_LABELS,
  is_any_of: "is any of",
  is_none_of: "is none of",
  has_any_of: "has any of",
  has_all_of: "has all of",
  has_none_of: "has none of",
  gt: "greater than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  between: "between",
  not_between: "not between",
};

const operators = createFilterOperators(MOVIE_OPERATOR_LABELS);

export function numericValue(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

const numericFields = [
  ["year", "Year", "Release year"],
  ["popularity", "Popularity", "Number of audience ratings"],
  ["users", "Users", "Audience score, out of 100"],
  ["critics", "Critics", "Metascore, out of 100"],
  ["finalScore", "Final Score", "Your weighted score, out of 100"],
] as const;

const oscarFields = [
  ["oscarWins", "Oscar wins", "Academy Award wins from Wikidata; indicative, not complete"],
  ["oscarNominations", "Oscar nominations", "Academy Award nominations from Wikidata; indicative, not complete"],
] as const;

/** The catalogue's languages and subgenres, so the pickers list real values. */
export interface FilterVocabulary {
  languages: string[];
  subgenres: string[];
}

function numberField(id: string, label: string, description: string, defaultOperator: string): FilterField {
  return {
    id,
    label,
    description,
    type: "number",
    operators: operators.number,
    defaultOperator,
    validate: ({ value, arity }) => {
      if (arity === "none") return null;
      const values = arity === "range" ? (Array.isArray(value) ? value : []) : [value];
      const numbers = values.map(numericValue);
      if (numbers.length === 0 || numbers.some((number) => number === undefined)) return "Enter a valid number.";
      if (arity === "range" && (numbers.length !== 2 || numbers[0]! > numbers[1]!)) return "The minimum must not exceed the maximum.";
      return null;
    },
  };
}

/** Filter fields, with option lists filled from the catalogue when a vocabulary is given. */
export function createMovieFields(vocabulary: FilterVocabulary = { languages: [], subgenres: [] }): FilterField[] {
  return [
    { id: "title", label: "Title", type: "text", operators: operators.text, defaultOperator: "contains", placeholder: "Search a movie title…" },
    ...numericFields.map(([id, label, description]) => numberField(id, label, description, id === "year" || id === "popularity" ? "between" : "gte")),
    {
      id: "language",
      label: "Language",
      description: "Original language, when IMDb lists one",
      type: "select",
      operators: operators.select,
      defaultOperator: "is",
      options: vocabulary.languages.map((value) => ({ value, label: value })),
      placeholder: "Search languages…",
    },
    {
      id: "subgenres",
      label: "Subgenre",
      description: "Wikidata film genres, finer than Metacritic's",
      type: "multiselect",
      operators: operators.multiselect,
      defaultOperator: "has_any_of",
      options: vocabulary.subgenres.map((value) => ({ value, label: value })),
      placeholder: "Search subgenres…",
    },
    ...oscarFields.map(([id, label, description]) => numberField(id, label, description, "gte")),
  ];
}

export const MOVIE_FIELDS: FilterField[] = createMovieFields();

/** Distinct languages and subgenres present in the catalogue, alphabetical. */
export function filterVocabulary(movies: Pick<ScoredMovie, "language" | "subgenres">[]): FilterVocabulary {
  const languages = new Set<string>();
  const subgenres = new Set<string>();
  for (const movie of movies) {
    if (movie.language) languages.add(movie.language);
    for (const subgenre of movie.subgenres) subgenres.add(subgenre);
  }
  const sorted = (values: Set<string>) => [...values].sort((a, b) => a.localeCompare(b, "en-US"));
  return { languages: sorted(languages), subgenres: sorted(subgenres) };
}

export const DEFAULT_QUERY: FilterQuery = {
  id: "movie-query",
  type: "group",
  combinator: "and",
  rules: [
    { id: "default-years", type: "rule", path: ["year"], operator: "between", value: [2000, 2024] },
    { id: "default-popularity", type: "rule", path: ["popularity"], operator: "between", value: [300, 100000] },
  ],
};

export function emptyQuery(): FilterQuery {
  return { id: "movie-query", type: "group", combinator: "and", rules: [] };
}

function fieldForRule(rule: FilterRule) {
  return rule.path.length === 1 ? MOVIE_FIELDS.find((field) => field.id === rule.path[0]) : undefined;
}

const OPERATOR_CATALOGS = { text: operators.text, number: operators.number, select: operators.select, multiselect: operators.multiselect } as const;

function catalogFor(type: FilterField["type"]) {
  return type && type in OPERATOR_CATALOGS ? OPERATOR_CATALOGS[type as keyof typeof OPERATOR_CATALOGS] : operators.number;
}

function chosenValues(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

export function isCompleteRule(rule: FilterRule): boolean {
  const field = fieldForRule(rule);
  if (!field) return false;
  const operator = catalogFor(field.type).find((entry) => entry.value === rule.operator);
  if (!operator) return false;
  if (operator.arity === "none") return true;
  if (field.type === "select" || field.type === "multiselect") return chosenValues(rule.value).length > 0;
  if (field.type === "text") return typeof rule.value === "string" && rule.value.trim().length > 0;
  if (operator.arity === "range") {
    if (!Array.isArray(rule.value) || rule.value.length !== 2) return false;
    const [min, max] = rule.value.map(numericValue);
    return min !== undefined && max !== undefined && min <= max;
  }
  return numericValue(rule.value) !== undefined;
}

function evaluateMembership(actual: unknown, operator: string, chosen: string[]): boolean {
  const own = new Set(Array.isArray(actual) ? actual.map(String) : [String(actual)]);
  switch (operator) {
    case "is": return chosen.length === 1 && own.has(chosen[0]!);
    case "is_not": return !(chosen.length === 1 && own.has(chosen[0]!));
    case "is_any_of":
    case "has_any_of": return chosen.some((value) => own.has(value));
    case "is_none_of":
    case "has_none_of": return !chosen.some((value) => own.has(value));
    case "has_all_of": return chosen.every((value) => own.has(value));
    default: return false;
  }
}

function evaluateRule(movie: ScoredMovie, rule: FilterRule): boolean | undefined {
  if (!isCompleteRule(rule)) return undefined;
  const field = fieldForRule(rule);
  const actual = movie[rule.path[0] as keyof ScoredMovie];
  const missing = actual === null || actual === undefined || actual === "" || (Array.isArray(actual) && actual.length === 0);
  let result = false;
  if (rule.operator === "empty") result = missing;
  else if (rule.operator === "not_empty") result = !missing;
  else if (!missing && (field?.type === "select" || field?.type === "multiselect")) {
    result = evaluateMembership(actual, rule.operator, chosenValues(rule.value));
  } else if (!missing && rule.path[0] === "title") {
    const text = String(actual).toLocaleLowerCase("en-US");
    const term = String(rule.value).trim().toLocaleLowerCase("en-US");
    switch (rule.operator) {
      case "contains": result = text.includes(term); break;
      case "not_contains": result = !text.includes(term); break;
      case "starts_with": result = text.startsWith(term); break;
      case "ends_with": result = text.endsWith(term); break;
      case "is": result = text === term; break;
      case "is_not": result = text !== term; break;
    }
  } else if (!missing && typeof actual === "number") {
    const value = numericValue(rule.value);
    switch (rule.operator) {
      case "eq": result = actual === value; break;
      case "neq": result = actual !== value; break;
      case "gt": result = actual > value!; break;
      case "gte": result = actual >= value!; break;
      case "lt": result = actual < value!; break;
      case "lte": result = actual <= value!; break;
      case "between":
      case "not_between": {
        const [min, max] = (rule.value as unknown[]).map(numericValue);
        const inside = actual >= min! && actual <= max!;
        result = rule.operator === "between" ? inside : !inside;
        break;
      }
    }
  }
  return rule.negated ? !result : result;
}

function evaluateNode(movie: ScoredMovie, node: FilterNode): boolean | undefined {
  if (node.type === "rule") return evaluateRule(movie, node);
  // Unfinished rules are absent predicates, not true leaves that make an OR match everything.
  const results = node.rules.map((child) => evaluateNode(movie, child)).filter((value) => value !== undefined);
  if (results.length === 0) return undefined;
  return node.combinator === "and" ? results.every(Boolean) : results.some(Boolean);
}

export function matchesQuery(movie: ScoredMovie, query: FilterQuery): boolean {
  return evaluateNode(movie, query) ?? true;
}

export function describeQuery(node: FilterNode, depth = 0): string {
  if (node.type === "group") {
    const parts = node.rules.map((child) => describeQuery(child, depth + 1)).filter(Boolean);
    if (!parts.length) return depth === 0 ? "All movies" : "";
    const text = parts.join(` ${node.combinator.toUpperCase()} `);
    return depth === 0 ? text : `(${text})`;
  }
  const field = fieldForRule(node);
  const label = field?.label ?? node.path.join(".");
  if (!isCompleteRule(node)) return `${label || "Condition"} [incomplete — ignored]`;
  const operator = MOVIE_OPERATOR_LABELS[node.operator] ?? node.operator;
  let text = `${label} ${operator}`;
  if (node.operator !== "empty" && node.operator !== "not_empty") {
    const values = Array.isArray(node.value) ? node.value : [node.value];
    text += ` ${values.map((value) => field?.type === "text" ? JSON.stringify(value) : String(value)).join(" and ")}`;
  }
  return node.negated ? `NOT (${text})` : text;
}
