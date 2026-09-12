import {
	type Credit,
	dedupe,
	parseCount,
	SCORE_HEADERS,
	type ScrapedMovie,
	type SortKey,
	slugFromPath,
} from "./types";

const YEAR = /(?:19|20)\d{2}/;

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

/**
 * Decodes the HTML entities that HTMLRewriter leaves untouched in text chunks.
 *
 * Metacritic escapes apostrophes as `&#39;`, so titles such as "Schindler's
 * List" arrive encoded unless they are decoded here.
 */
function decodeEntities(text: string): string {
	return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body: string) => {
		if (body.startsWith("#")) {
			const isHex = body[1] === "x" || body[1] === "X";
			const code = Number.parseInt(
				isHex ? body.slice(2) : body.slice(1),
				isHex ? 16 : 10,
			);
			return Number.isFinite(code) && code > 0
				? String.fromCodePoint(code)
				: match;
		}
		return NAMED_ENTITIES[body.toLowerCase()] ?? match;
	});
}

/**
 * Registers a handler reporting the trimmed text and href of every element
 * matching `selector`, in document order.
 *
 * @param decode Decode HTML entities. Disable for `<script>` bodies, whose raw
 *   text is not entity-encoded and would be corrupted by decoding.
 */
function onText(
	rewriter: HTMLRewriter,
	selector: string,
	sink: (text: string, href: string) => void,
	decode = true,
): void {
	let buffer = "";
	rewriter.on(selector, {
		element(element) {
			buffer = "";
			const href = element.getAttribute("href") ?? "";
			element.onEndTag(() => {
				sink((decode ? decodeEntities(buffer) : buffer).trim(), href);
				buffer = "";
			});
		},
		text(chunk) {
			buffer += chunk.text;
		},
	});
}

async function run(rewriter: HTMLRewriter, html: string): Promise<void> {
	await rewriter.transform(new Response(html)).text();
}

/** Returns the movie paths listed on one browse page, in rank order. */
export async function parseBrowse(html: string): Promise<string[]> {
	const paths: string[] = [];
	const rewriter = new HTMLRewriter();
	rewriter.on('div[data-testid="filter-results"] a[href]', {
		element(element) {
			const href = element.getAttribute("href");
			if (href?.startsWith("/movie/")) paths.push(href);
		},
	});
	await run(rewriter, html);
	return dedupe(paths);
}

interface Schema {
	datePublished?: unknown;
	description?: unknown;
}

/**
 * Chooses the complete summary between the two the page carries.
 *
 * The hero element holds the richer blurb but is clamped, ending in
 * "... Read More"; the schema.org payload is always complete but sometimes a
 * one-line synopsis. Prefer the hero text when it was not truncated.
 */
function pickSummary(
	hero: string | undefined,
	schema: string | null,
): string | null {
	const truncated = hero ? /\.\.\.\s*Read More$/.test(hero) : true;
	if (hero && !truncated) return hero;
	return schema ?? hero?.replace(/\s*\.\.\.\s*Read More$/, "") ?? null;
}

/**
 * Returns the movie's schema.org payload.
 *
 * Carries the publisher's canonical description and release date.
 */
function schemaOrg(payloads: string[]): Schema {
	for (const payload of payloads) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(payload);
		} catch {
			continue;
		}
		if (parsed && typeof parsed === "object" && "description" in parsed) {
			return parsed as Schema;
		}
	}
	return {};
}

function collectCredits(rewriter: HTMLRewriter): () => Credit[] {
	const credits: Credit[] = [];
	const counters = { director: 0, writer: 0, cast: 0 };
	let crewTitle = "";
	let personSlug = "";

	onText(rewriter, ".c-crew-list__title", (text) => {
		crewTitle = text.toLowerCase();
	});
	onText(rewriter, ".c-crew-list__link", (name, href) => {
		const role = crewTitle.includes("direct")
			? "director"
			: crewTitle.includes("writ")
				? "writer"
				: null;
		if (!role || !name) return;
		counters[role] += 1;
		const slug = slugFromPath(href) || name.toLowerCase().replaceAll(" ", "-");
		credits.push({
			person_slug: slug,
			name,
			role,
			billing: counters[role],
			character: null,
		});
	});

	// Each cast card is wrapped in its own /person/ anchor, which the parser
	// reaches immediately before the card's name and role spans.
	rewriter.on('a[href^="/person/"]', {
		element(element) {
			personSlug = slugFromPath(element.getAttribute("href") ?? "");
		},
	});
	onText(rewriter, ".c-global-person-card__name", (name) => {
		if (!name) return;
		counters.cast += 1;
		credits.push({
			person_slug: personSlug || name.toLowerCase().replaceAll(" ", "-"),
			name,
			role: "cast",
			billing: counters.cast,
			character: null,
		});
	});
	onText(rewriter, ".c-global-person-card__role", (character) => {
		const last = credits.at(-1);
		if (last?.role === "cast" && character) last.character = character;
	});

	return () => credits;
}

/**
 * Parses one movie detail page.
 *
 * The user score is rescaled from Metacritic's 0-10 display to 0-100 so it
 * shares the metascore's units, matching the shape the app already consumes.
 */
export async function parseMovie(
	html: string,
	link: string,
): Promise<ScrapedMovie> {
	const rewriter = new HTMLRewriter();
	const titles: string[] = [];
	const genres: string[] = [];
	const jsonLd: string[] = [];
	const heroMeta: string[] = [];
	const heroSummaries: string[] = [];
	const values: Partial<Record<SortKey, string>> = {};
	const counts: Partial<Record<SortKey, number>> = {};
	let scoreKey: SortKey | null = null;

	onText(rewriter, "h1", (text) => titles.push(text));
	onText(rewriter, ".c-genreList_item", (text) => genres.push(text));
	onText(rewriter, '[data-testid="hero-metadata"]', (text) =>
		heroMeta.push(text),
	);
	onText(rewriter, ".c-hero-summary__description", (text) =>
		heroSummaries.push(text),
	);
	onText(
		rewriter,
		'script[type="application/ld+json"]',
		(text) => jsonLd.push(text),
		false,
	);

	const credits = collectCredits(rewriter);

	// The hero renders header, review count and value in that order, so the most
	// recent header tells us which score the following nodes belong to.
	onText(rewriter, '[data-testid="global-score-header"]', (text) => {
		scoreKey = SCORE_HEADERS[text.toLowerCase()] ?? null;
	});
	onText(rewriter, '[data-testid="global-score-review-count"]', (text) => {
		const key = scoreKey;
		if (key && counts[key] === undefined)
			counts[key] = parseCount(text) ?? undefined;
	});
	onText(rewriter, '[data-testid="global-score-value"]', (text) => {
		const key = scoreKey;
		if (key && values[key] === undefined) values[key] = text;
	});

	await run(rewriter, html);

	const rawMeta = Number(values.metascore);
	const rawUser = Number(values.userscore);
	const schema = schemaOrg(jsonLd);
	const published =
		typeof schema.datePublished === "string" ? schema.datePublished : "";
	const year = YEAR.exec(published) ?? YEAR.exec(heroMeta[0] ?? "");

	return {
		slug: slugFromPath(link),
		title: titles[0] ?? "",
		year: year ? Number(year[0]) : null,
		users_rated: counts.userscore ?? null,
		userscore: Number.isFinite(rawUser) ? Math.round(rawUser * 100) / 10 : null,
		metascore: Number.isFinite(rawMeta) ? rawMeta : null,
		link,
		summary: pickSummary(
			heroSummaries[0],
			typeof schema.description === "string" ? schema.description : null,
		),
		genres: dedupe(genres),
		credits: credits(),
		ranked_by: [],
	};
}
