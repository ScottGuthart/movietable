import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import type { CreditRole, ScrapedMovie } from "./types";

export type Format = "csv" | "json" | "both";

export interface MovieRow {
	slug: string;
	title: string;
	year: number | null;
	metascore: number | null;
	userscore: number | null;
	users_rated: number | null;
	summary: string | null;
	link: string;
	justwatch_url: string | null;
	in_metascore_ranking: boolean;
	in_userscore_ranking: boolean;
}

export interface PersonRow {
	slug: string;
	name: string;
}

export interface CreditRow {
	movie_slug: string;
	person_slug: string;
	role: CreditRole;
	billing: number;
	character: string | null;
}

export interface GenreRow {
	name: string;
}

export interface MovieGenreRow {
	movie_slug: string;
	genre_name: string;
}

export interface ProviderRow {
	id: number;
	name: string;
	icon_url: string | null;
}

export interface OfferRow {
	movie_slug: string;
	provider_id: number;
	monetization: string;
	quality: string;
	url: string;
	price: number | null;
	currency_code: string | null;
}

export interface SeedTables {
	movies: MovieRow[];
	people: PersonRow[];
	credits: CreditRow[];
	genres: GenreRow[];
	movie_genres: MovieGenreRow[];
	providers: ProviderRow[];
	streaming_offers: OfferRow[];
}

/**
 * Splits scraped movies into normalized tables.
 *
 * Rows are keyed on the identifiers the sources already own — Metacritic's
 * movie and person slugs, the genre name, JustWatch's provider id — rather
 * than on surrogate ids minted here. A locally numbered key depends on which
 * movies happen to be in the scrape, so scraping a larger set would renumber
 * existing rows and re-point every foreign key at the wrong record.
 */
export function buildTables(scraped: ScrapedMovie[]): SeedTables {
	const people = new Map<string, PersonRow>();
	const genres = new Set<string>();
	const providers = new Map<number, ProviderRow>();
	const credits: CreditRow[] = [];
	const movieGenres: MovieGenreRow[] = [];
	const offers: OfferRow[] = [];

	for (const movie of scraped) {
		for (const name of movie.genres) {
			genres.add(name);
			movieGenres.push({ movie_slug: movie.slug, genre_name: name });
		}

		for (const offer of movie.offers) {
			providers.set(offer.provider_id, {
				id: offer.provider_id,
				name: offer.provider_name,
				icon_url: offer.provider_icon,
			});
			offers.push({
				movie_slug: movie.slug,
				provider_id: offer.provider_id,
				monetization: offer.monetization,
				quality: offer.quality,
				url: offer.url,
				price: offer.price,
				currency_code: offer.currency_code,
			});
		}

		const billing = { director: 0, writer: 0, cast: 0 };
		const seen = new Set<string>();
		for (const credit of movie.credits) {
			people.set(credit.person_slug, {
				slug: credit.person_slug,
				name: credit.name,
			});
			const key = `${credit.person_slug}|${credit.role}`;
			if (seen.has(key)) continue;
			seen.add(key);
			billing[credit.role] += 1;
			credits.push({
				movie_slug: movie.slug,
				person_slug: credit.person_slug,
				role: credit.role,
				billing: billing[credit.role],
				character: credit.character,
			});
		}
	}

	const movies = scraped.map((movie) => ({
		slug: movie.slug,
		title: movie.title,
		year: movie.year,
		metascore: movie.metascore,
		userscore: movie.userscore,
		users_rated: movie.users_rated,
		summary: movie.summary,
		link: movie.link,
		justwatch_url: movie.justwatch_url,
		// "recent" is the same metascore ranking with a year filter, so a film
		// found through it is genuinely in the metascore ranking.
		in_metascore_ranking:
			movie.ranked_by.includes("metascore") ||
			movie.ranked_by.includes("recent"),
		in_userscore_ranking: movie.ranked_by.includes("userscore"),
	}));

	return {
		movies: movies.sort((a, b) => a.slug.localeCompare(b.slug)),
		people: [...people.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
		credits: credits.sort(
			(a, b) =>
				a.movie_slug.localeCompare(b.movie_slug) ||
				a.role.localeCompare(b.role) ||
				a.billing - b.billing,
		),
		genres: [...genres].sort().map((name) => ({ name })),
		movie_genres: movieGenres.sort(
			(a, b) =>
				a.movie_slug.localeCompare(b.movie_slug) ||
				a.genre_name.localeCompare(b.genre_name),
		),
		providers: [...providers.values()].sort((a, b) => a.id - b.id),
		streaming_offers: offers.sort(
			(a, b) =>
				a.movie_slug.localeCompare(b.movie_slug) ||
				a.monetization.localeCompare(b.monetization) ||
				a.provider_id - b.provider_id ||
				a.quality.localeCompare(b.quality),
		),
	};
}

/** Renders one CSV field, quoting per RFC 4180 and writing null as an empty field. */
function csvField(value: unknown): string {
	if (value === null || value === undefined) return "";
	const text = String(value);
	return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: Record<string, unknown>[]): string {
	const first = rows[0];
	if (!first) return "";
	const columns = Object.keys(first);
	const lines = rows.map((row) =>
		columns.map((key) => csvField(row[key])).join(","),
	);
	return `${[columns.join(","), ...lines].join("\n")}\n`;
}

/** Writes each table to `dir` and returns the paths written. */
export async function writeTables(
	dir: string,
	tables: SeedTables,
	format: Format,
): Promise<string[]> {
	await mkdir(dir, { recursive: true });
	const written: string[] = [];
	for (const [name, rows] of Object.entries(tables)) {
		if (format !== "json") {
			const path = join(dir, `${name}.csv`);
			await Bun.write(path, toCsv(rows as Record<string, unknown>[]));
			written.push(`${path} (${rows.length} rows)`);
		}
		if (format !== "csv") {
			const path = join(dir, `${name}.json`);
			await Bun.write(path, `${JSON.stringify(rows, null, 2)}\n`);
			written.push(`${path} (${rows.length} rows)`);
		}
	}
	return written;
}
