import type { ScoredMovie } from "@/lib/movies";

/** A whole-star rating from one to five. */
export type Stars = 1 | 2 | 3 | 4 | 5;
/** What the visitor said about a film: stars, or `skip` for "haven't seen", which carries no taste signal. */
export type Verdict = Stars | "skip";
/** Verdicts keyed by Metacritic film slug. */
export type Verdicts = Record<string, Verdict>;

export interface TasteFilm {
  slug: string;
  year: number | null;
  summary: string | null;
  genres: string[];
  /** Indexes into `TasteCatalogue.people`, in billing order. */
  directors: number[];
  writers: number[];
  cast: number[];
}

export interface TasteCatalogue {
  films: TasteFilm[];
  /** Display names; credits refer to a person by index. */
  people: string[];
}

export type FeatureKind = "director" | "genre" | "writer" | "cast" | "decade";

export interface Feature {
  kind: FeatureKind;
  key: string;
}

/** Summed feature weights keyed by `${kind}:${key}`. */
export type Profile = Map<string, number>;

export interface MatchReason {
  kind: FeatureKind;
  label: string;
}

export interface HandCandidate {
  slug: string;
  year: number | null;
  genres: string[];
  popularity: number | null;
}

const KIND_WEIGHT: Record<FeatureKind, number> = { director: 3, genre: 2, writer: 1.5, cast: 1, decade: 1 };
const STARS: readonly number[] = [1, 2, 3, 4, 5];
/** Ratings at or above this many stars count as a favourite and can build a profile on their own. */
const FAVOURITE_STARS = 4;
/** For you = MATCH_SHARE × match strength + QUALITY_SHARE × Final Score, so equal matches keep the stronger film ahead. */
const MATCH_SHARE = 60;
const QUALITY_SHARE = 0.4;

export const HAND_SIZE = 12;
export const SHARP_PROFILE_SIZE = 5;

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

function featureId(feature: Feature): string {
  return `${feature.kind}:${feature.key}`;
}

function parseFeatureId(id: string): Feature {
  const separator = id.indexOf(":");
  return { kind: id.slice(0, separator) as FeatureKind, key: id.slice(separator + 1) };
}

export function filmFeatures(film: TasteFilm): Feature[] {
  const features: Feature[] = [];
  if (film.year !== null) features.push({ kind: "decade", key: String(decadeOf(film.year)) });
  for (const key of film.genres) features.push({ kind: "genre", key });
  for (const index of film.directors) features.push({ kind: "director", key: String(index) });
  for (const index of film.writers) features.push({ kind: "writer", key: String(index) });
  for (const index of film.cast) features.push({ kind: "cast", key: String(index) });
  return features;
}

/** Reads a saved verdict, accepting the thumbs stored before the star scale: like became four stars, pass two. */
export function parseVerdict(value: unknown): Verdict | null {
  if (value === "skip") return "skip";
  if (value === "like") return 4;
  if (value === "pass") return 2;
  return typeof value === "number" && STARS.includes(value) ? (value as Stars) : null;
}

/** How strongly a rating speaks for a film's attributes: five stars is +1, three is neutral, one is -1. */
export function ratingFactor(stars: Stars): number {
  return (stars - 3) / 2;
}

export function hasPositive(verdicts: Verdicts): boolean {
  return Object.values(verdicts).some((verdict) => verdict !== "skip" && verdict >= FAVOURITE_STARS);
}

export function ratedCount(verdicts: Verdicts): number {
  return Object.values(verdicts).filter((verdict) => verdict !== "skip").length;
}

function indexFilms(catalogue: TasteCatalogue): Map<string, TasteFilm> {
  return new Map(catalogue.films.map((film) => [film.slug, film]));
}

/** Sums each rated film's weighted features, scaled by how far its rating sits from three stars. */
export function buildProfile(catalogue: TasteCatalogue, verdicts: Verdicts): Profile {
  const films = indexFilms(catalogue);
  const profile: Profile = new Map();
  for (const [slug, verdict] of Object.entries(verdicts)) {
    if (verdict === "skip") continue;
    const film = films.get(slug);
    if (!film) continue;
    const factor = ratingFactor(verdict);
    if (factor === 0) continue;
    for (const feature of filmFeatures(film)) {
      const id = featureId(feature);
      profile.set(id, (profile.get(id) ?? 0) + factor * KIND_WEIGHT[feature.kind]);
    }
  }
  return profile;
}

/**
 * Cosine similarity between the profile and each film's weighted attribute vector,
 * clamped at zero and rescaled so the best match among unrated films reads 1.
 * Rated films are excluded from the scale (a favourite matches itself perfectly)
 * and capped at 1.
 */
function matchStrengths(catalogue: TasteCatalogue, profile: Profile, rated: Set<string>): Map<string, number> {
  let profileSquared = 0;
  for (const weight of profile.values()) profileSquared += weight * weight;
  const profileNorm = Math.sqrt(profileSquared);

  const strengths = new Map<string, number>();
  let best = 0;
  for (const film of catalogue.films) {
    let dot = 0;
    let filmSquared = 0;
    for (const feature of filmFeatures(film)) {
      const weight = KIND_WEIGHT[feature.kind];
      filmSquared += weight * weight;
      dot += weight * (profile.get(featureId(feature)) ?? 0);
    }
    const denominator = Math.sqrt(filmSquared) * profileNorm;
    const similarity = denominator === 0 ? 0 : Math.max(0, dot / denominator);
    strengths.set(film.slug, similarity);
    if (!rated.has(film.slug) && similarity > best) best = similarity;
  }
  if (best === 0) best = Math.max(0, ...strengths.values());
  if (best > 0) {
    for (const [slug, similarity] of strengths) strengths.set(slug, Math.min(1, similarity / best));
  }
  return strengths;
}

export function forYouScore(match: number | null, finalScore: number | null): number | null {
  if (match === null || finalScore === null) return null;
  return Math.floor(MATCH_SHARE * match + QUALITY_SHARE * finalScore);
}

/** Fills `forYou` on every movie; leaves it null without a favourite or without attributes. */
export function rankMovies(movies: ScoredMovie[], catalogue: TasteCatalogue | null, verdicts: Verdicts): ScoredMovie[] {
  if (!catalogue || !hasPositive(verdicts)) {
    return movies.map((movie) => (movie.forYou === null ? movie : { ...movie, forYou: null }));
  }
  const rated = new Set(Object.entries(verdicts).flatMap(([slug, verdict]) => (verdict === "skip" ? [] : [slug])));
  const strengths = matchStrengths(catalogue, buildProfile(catalogue, verdicts), rated);
  return movies.map((movie) => ({ ...movie, forYou: forYouScore(strengths.get(movie.slug) ?? null, movie.finalScore) }));
}

export const UNKNOWN_PERSON = "Unknown person";

function featureLabel(feature: Feature, people: string[]): string {
  if (feature.kind === "decade") return `${feature.key}s`;
  if (feature.kind === "genre") return feature.key;
  return people[Number(feature.key)] ?? UNKNOWN_PERSON;
}

/** The film's attributes the profile rewards, heaviest first. */
export function explainMatch(profile: Profile, film: TasteFilm, people: string[], limit = 3): MatchReason[] {
  return filmFeatures(film)
    .map((feature) => ({ feature, weight: (profile.get(featureId(feature)) ?? 0) * KIND_WEIGHT[feature.kind] }))
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map(({ feature }) => ({ kind: feature.kind, label: featureLabel(feature, people) }));
}

/** Up to two leading genres followed by the leading director. */
export function summarizeProfile(profile: Profile, people: string[]): string[] {
  const positive = [...profile]
    .filter(([, weight]) => weight > 0)
    .map(([id, weight]) => {
      const feature = parseFeatureId(id);
      return { kind: feature.kind, label: featureLabel(feature, people), weight };
    })
    .sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label, "en-US"));
  const leading = (kind: FeatureKind, count: number) =>
    positive.filter((entry) => entry.kind === kind).slice(0, count).map((entry) => entry.label);
  return [...leading("genre", 2), ...leading("director", 1)];
}

function comparePopularity(a: HandCandidate, b: HandCandidate): number {
  if (a.popularity === null && b.popularity === null) return 0;
  if (a.popularity === null) return 1;
  if (b.popularity === null) return -1;
  return b.popularity - a.popularity;
}

/**
 * Deals a deterministic hand: the most popular film from each unseen
 * decade-and-lead-genre combination first, then the rest by popularity.
 * Callers exclude films the visitor has already judged before dealing.
 */
export function dealHand<T extends HandCandidate>(candidates: T[], offset: number, size = HAND_SIZE): T[] {
  const ordered = [...candidates].sort((a, b) => comparePopularity(a, b) || a.slug.localeCompare(b.slug, "en-US"));
  const seen = new Set<string>();
  const fresh: T[] = [];
  const repeats: T[] = [];
  for (const candidate of ordered) {
    const combination = `${candidate.year === null ? "?" : decadeOf(candidate.year)}|${candidate.genres[0] ?? "?"}`;
    if (seen.has(combination)) {
      repeats.push(candidate);
    } else {
      seen.add(combination);
      fresh.push(candidate);
    }
  }
  return [...fresh, ...repeats].slice(offset, offset + size);
}
