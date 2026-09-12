/**
 * Scrapes Metacritic movie detail pages for the union of two browse rankings
 * and writes normalized seed tables.
 *
 * Collects the de-duplicated set of movies listed by the metascore-sorted and
 * userscore-sorted browse pages, fetches each movie page for genre, crew, cast
 * and summary, then splits the result into movies / people / credits /
 * genres / movie_genres tables. Movies missing either score are dropped.
 *
 * Usage: bun run scripts/scrape-metacritic.ts --limit 1000 --out-dir seed
 */
import { parseArgs } from "node:util";

import { fetchHtml } from "./metacritic/fetch";
import { parseBrowse, parseMovie } from "./metacritic/parse";
import { buildTables, type Format, writeTables } from "./metacritic/seed";
import {
	BASE,
	BROWSE_SOURCES,
	dedupe,
	type ScrapedMovie,
	type SortKey,
} from "./metacritic/types";

const FORMATS: Format[] = ["csv", "json", "both"];

function pageUrl(url: string, page: number): string {
	const parsed = new URL(url);
	parsed.searchParams.set("page", String(page));
	return parsed.toString();
}

/** Paginates one browse ranking until `limit` movies are collected or pages run out. */
async function collectPaths(
	name: SortKey,
	url: string,
	limit: number,
	cacheDir: string | null,
): Promise<string[]> {
	const paths: string[] = [];
	for (let page = 1; limit === 0 || paths.length < limit; page += 1) {
		const found = await parseBrowse(
			await fetchHtml(pageUrl(url, page), cacheDir),
		);
		if (found.length === 0) break;
		paths.push(...found);
		if (page % 10 === 0)
			console.error(`  [${name}] page ${page}: ${paths.length} movies`);
	}
	const unique = dedupe(paths);
	return limit === 0 ? unique : unique.slice(0, limit);
}

async function mapPool<T, R>(
	items: T[],
	size: number,
	worker: (item: T) => Promise<R>,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let cursor = 0;
	const runners = Array.from(
		{ length: Math.min(size, items.length) },
		async () => {
			while (cursor < items.length) {
				const position = cursor;
				cursor += 1;
				results[position] = await worker(items[position]!);
				if ((position + 1) % 100 === 0) {
					console.error(`  fetched ${position + 1}/${items.length}`);
				}
			}
		},
	);
	await Promise.all(runners);
	return results;
}

async function scrapeMovie(
	path: string,
	cacheDir: string | null,
): Promise<ScrapedMovie | null> {
	const link = `${BASE}${path}`;
	try {
		return await parseMovie(await fetchHtml(link, cacheDir), link);
	} catch (error) {
		console.error(
			`  skip ${path}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
}

function parseCli() {
	const { values } = parseArgs({
		options: {
			limit: { type: "string", default: "150" },
			"out-dir": { type: "string", default: "seed" },
			format: { type: "string", default: "both" },
			concurrency: { type: "string", default: "6" },
			"cache-dir": { type: "string", default: ".cache/metacritic" },
		},
	});
	const limit = Number(values.limit);
	const concurrency = Number(values.concurrency);
	if (!Number.isInteger(limit) || limit < 0) {
		throw new RangeError(
			`--limit must be an integer >= 0 (0 means every page), got ${values.limit}`,
		);
	}
	if (!Number.isInteger(concurrency) || concurrency < 1) {
		throw new RangeError(
			`--concurrency must be an integer >= 1, got ${values.concurrency}`,
		);
	}
	if (!FORMATS.includes(values.format as Format)) {
		throw new RangeError(
			`--format must be one of ${FORMATS.join("|")}, got ${values.format}`,
		);
	}
	return {
		limit,
		concurrency,
		outDir: values["out-dir"],
		format: values.format as Format,
		cacheDir: values["cache-dir"] || null,
	};
}

async function main(): Promise<void> {
	const { limit, concurrency, outDir, format, cacheDir } = parseCli();

	const rankedBy = new Map<string, SortKey[]>();
	for (const [name, url] of Object.entries(BROWSE_SOURCES) as [
		SortKey,
		string,
	][]) {
		console.error(`browsing ${name}...`);
		for (const path of await collectPaths(name, url, limit, cacheDir)) {
			rankedBy.set(path, [...(rankedBy.get(path) ?? []), name]);
		}
	}

	const paths = [...rankedBy.keys()];
	console.error(`${paths.length} unique movies; fetching details...`);
	const scraped = await mapPool(paths, concurrency, (path) =>
		scrapeMovie(path, cacheDir),
	);

	const movies: ScrapedMovie[] = [];
	scraped.forEach((movie, position) => {
		if (!movie || movie.metascore === null || movie.userscore === null) return;
		movie.ranked_by = rankedBy.get(paths[position]!) ?? [];
		movies.push(movie);
	});

	const written = await writeTables(outDir, buildTables(movies), format);
	console.error(
		`kept ${movies.length} of ${paths.length} movies ` +
			`(${paths.length - movies.length} dropped for missing metascore or userscore)`,
	);
	for (const line of written) console.error(`  ${line}`);
}

if (import.meta.main) await main();
