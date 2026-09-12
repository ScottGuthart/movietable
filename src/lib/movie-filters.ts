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

export const MOVIE_FIELDS: FilterField[] = [
  { id: "title", label: "Title", type: "text", operators: operators.text, defaultOperator: "contains", placeholder: "Search a movie title…" },
  ...numericFields.map(([id, label, description]): FilterField => ({
    id,
    label,
    description,
    type: "number",
    operators: operators.number,
    defaultOperator: id === "year" || id === "popularity" ? "between" : "gte",
    validate: ({ value, arity }) => {
      if (arity === "none") return null;
      const values = arity === "range" ? (Array.isArray(value) ? value : []) : [value];
      const numbers = values.map(numericValue);
      if (numbers.length === 0 || numbers.some((number) => number === undefined)) return "Enter a valid number.";
      if (arity === "range" && (numbers.length !== 2 || numbers[0]! > numbers[1]!)) return "The minimum must not exceed the maximum.";
      return null;
    },
  })),
];

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

export function isCompleteRule(rule: FilterRule): boolean {
  const field = fieldForRule(rule);
  if (!field) return false;
  const catalog = field.type === "text" ? operators.text : operators.number;
  const operator = catalog.find((entry) => entry.value === rule.operator);
  if (!operator) return false;
  if (operator.arity === "none") return true;
  if (field.type === "text") return typeof rule.value === "string" && rule.value.trim().length > 0;
  if (operator.arity === "range") {
    if (!Array.isArray(rule.value) || rule.value.length !== 2) return false;
    const [min, max] = rule.value.map(numericValue);
    return min !== undefined && max !== undefined && min <= max;
  }
  return numericValue(rule.value) !== undefined;
}

function evaluateRule(movie: ScoredMovie, rule: FilterRule): boolean | undefined {
  if (!isCompleteRule(rule)) return undefined;
  const actual = movie[rule.path[0] as keyof ScoredMovie];
  const missing = actual === null || actual === undefined || actual === "";
  let result = false;
  if (rule.operator === "empty") result = missing;
  else if (rule.operator === "not_empty") result = !missing;
  else if (!missing && rule.path[0] === "title") {
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
