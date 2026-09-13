"use client";

import { parseAsFloat, parseAsJson, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { DEFAULT_QUERY, parseFilterQuery } from "@/lib/movie-filters";
import { GROUP_KEY_OPTIONS, type GroupKey } from "@/lib/movie-groups";
import { DEFAULT_CRITIC_WEIGHT } from "@/lib/movies";

const GROUP_KEYS = GROUP_KEY_OPTIONS.map((option) => option.value) as [GroupKey, ...GroupKey[]];

/**
 * The parts of the view worth sharing as a link: the filter tree, the search,
 * the grouping override, and the score bias. Defaults leave the URL clean.
 */
export const viewParsers = {
  q: parseAsJson(parseFilterQuery).withDefault(DEFAULT_QUERY),
  search: parseAsString.withDefault(""),
  group: parseAsStringLiteral(GROUP_KEYS),
  bias: parseAsFloat.withDefault(DEFAULT_CRITIC_WEIGHT),
};

export function useViewParams() {
  return useQueryStates(viewParsers, { history: "replace", clearOnDefault: true });
}

/** Keeps a shared link honest: bias outside the slider's range snaps back to equal weight. */
export function clampBias(bias: number): number {
  return Number.isFinite(bias) && bias >= 0 && bias <= 1 ? Math.round(bias * 10) / 10 : DEFAULT_CRITIC_WEIGHT;
}
