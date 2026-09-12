export const BASE = "https://www.metacritic.com";

export const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
	"(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const BROWSE_SOURCES = {
	metascore: `${BASE}/browse/movie/?releaseYearMin=1910&releaseYearMax=2026`,
	userscore:
		`${BASE}/browse/movie/all/all/all-time/userscore/` +
		`?releaseYearMin=1910&releaseYearMax=2011`,
} as const;

export type SortKey = keyof typeof BROWSE_SOURCES;

/** Maps the on-page score heading to the field it populates. */
export const SCORE_HEADERS: Record<string, SortKey> = {
	metascore: "metascore",
	"user score": "userscore",
};

/** How a person is credited on a movie. */
export type CreditRole = "director" | "writer" | "cast";

/**
 * One person's credit on one movie.
 *
 * `person_slug` is Metacritic's own person identifier, taken from the
 * `/person/<slug>/` href. It is the join key rather than the display name,
 * because two people can share a name but never a slug.
 */
export interface Credit {
	person_slug: string;
	name: string;
	role: CreditRole;
	/** 1-based order the site lists this person in, within its role. */
	billing: number;
	/** Character played, for cast credits only. */
	character: string | null;
}

/** A scraped movie, before it is split into seed tables. */
export interface ScrapedMovie {
	slug: string;
	title: string;
	year: number | null;
	users_rated: number | null;
	userscore: number | null;
	metascore: number | null;
	link: string;
	summary: string | null;
	genres: string[];
	credits: Credit[];
	ranked_by: SortKey[];
}

export function dedupe(values: string[]): string[] {
	return [...new Set(values.filter((value) => value.length > 0))];
}

export function parseCount(text: string): number | null {
	const match = /([\d,]+)/.exec(text);
	return match ? Number(match[1]!.replaceAll(",", "")) : null;
}

/** Extracts the trailing slug from a Metacritic path such as `/person/al-pacino/`. */
export function slugFromPath(path: string): string {
	return path.replace(/\/+$/, "").split("/").pop() ?? "";
}
