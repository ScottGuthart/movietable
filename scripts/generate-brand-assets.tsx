/**
 * Renders MovieTable's social card and favicon set from the DESIGN.md tokens
 * and publishes them to Supabase Storage.
 *
 *   bun run scripts/generate-brand-assets.tsx            # render to .brand/ and public/favicon.ico
 *   bun run scripts/generate-brand-assets.tsx --upload   # upload .brand/, write src/lib/brand-assets.json and public/manifest.json
 *
 * Rendering needs SUPABASE_URL and SUPABASE_ANON_KEY for the catalogue facts;
 * uploading needs SUPABASE_SERVICE_ROLE_KEY. Between the two steps, embed each
 * raster's provenance with `impeccable embed-prompt` so the published files carry it.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pngToIco, renderMarkPng, renderMarkSvg } from "./brand/mark";
import {
	type CatalogueFacts,
	type Font,
	LEDE,
	OG_ALT,
	OG_HEIGHT,
	OG_WIDTH,
	renderOgCard,
} from "./brand/og-card";
import { type Asset, uploadAssets } from "./brand/storage";
import { FONT_FAMILY } from "./brand/tokens";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, ".brand");
const SITE = "https://movietable.ai";
/** Install icons the web app manifest points at; same-origin so installs never depend on the storage host. */
const PUBLIC_ICONS = ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
const FILES: { name: string; type: string }[] = [
	{ name: "og.png", type: "image/png" },
	{ name: "icon.svg", type: "image/svg+xml" },
	{ name: "icon-32.png", type: "image/png" },
	{ name: "apple-touch-icon.png", type: "image/png" },
	{ name: "icon-192.png", type: "image/png" },
	{ name: "icon-512.png", type: "image/png" },
	{ name: "icon-1024.png", type: "image/png" },
];

async function loadFonts(): Promise<Font[]> {
	const dir = join(ROOT, "node_modules/@fontsource/playfair-display/files");
	const weights = [400, 500, 600] as const;
	return Promise.all(
		weights.map(async (weight) => ({
			name: FONT_FAMILY,
			data: await readFile(
				join(dir, `playfair-display-latin-${weight}-normal.woff`),
			),
			weight,
			style: "normal" as const,
		})),
	);
}

async function catalogueFacts(): Promise<CatalogueFacts> {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_ANON_KEY;
	if (!url || !key)
		throw new Error(
			"SUPABASE_URL and SUPABASE_ANON_KEY are required to read the catalogue",
		);
	const headers = { apikey: key, Authorization: `Bearer ${key}` };
	const [count, first, last] = await Promise.all([
		fetch(`${url}/rest/v1/movies?select=slug`, {
			method: "HEAD",
			headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
		}),
		fetch(`${url}/rest/v1/movies?select=year&order=year.asc&limit=1`, {
			headers,
		}).then((r) => r.json()),
		fetch(`${url}/rest/v1/movies?select=year&order=year.desc&limit=1`, {
			headers,
		}).then((r) => r.json()),
	]);
	const total = Number(count.headers.get("content-range")?.split("/")[1]);
	if (!Number.isFinite(total) || !first[0]?.year || !last[0]?.year) {
		throw new Error(
			`catalogue facts unavailable: count=${count.status} first=${JSON.stringify(first)} last=${JSON.stringify(last)}`,
		);
	}
	return {
		films: `${new Intl.NumberFormat("en-US").format(total)} films`,
		years: `${first[0].year}–${last[0].year}`,
	};
}

async function render() {
	const [fonts, facts] = await Promise.all([loadFonts(), catalogueFacts()]);
	const og = await renderOgCard(fonts, facts);
	const png32 = await renderMarkPng(32, { weight: "bold", glyph: 0.84, dot: 0.25, dotInset: 0.05 });
	const rendered: Record<string, Buffer> = {
		"og.png": og,
		"icon.svg": Buffer.from(await renderMarkSvg()),
		"icon-32.png": png32,
		"apple-touch-icon.png": await renderMarkPng(180, { weight: "regular", glyph: 0.78, dot: 0.16, dotInset: 0.08 }),
		"icon-192.png": await renderMarkPng(192, { weight: "regular", glyph: 0.76, dot: 0.16, dotInset: 0.09 }),
		"icon-512.png": await renderMarkPng(512, { weight: "regular", glyph: 0.78, dot: 0.15, dotInset: 0.09 }),
		"icon-1024.png": await renderMarkPng(1024, { weight: "regular", glyph: 0.78, dot: 0.15, dotInset: 0.09 }),
		"icon-maskable-512.png": await renderMarkPng(512, { weight: "regular", glyph: 0.67, dot: 0.14, dotInset: 0.2 }),
	};
	await mkdir(OUT_DIR, { recursive: true });
	for (const { name } of FILES)
		await writeFile(join(OUT_DIR, name), rendered[name]);
	await writeFile(join(ROOT, "public/favicon.ico"), pngToIco(png32, 32));
	for (const name of PUBLIC_ICONS)
		await writeFile(join(ROOT, "public", name), rendered[name]);
	console.log(
		`rendered ${FILES.length} assets to .brand/ (${facts.films}, ${facts.years}); og.png ${Math.round(og.length / 1024)} KB`,
	);
}

async function publish() {
	const assets: Asset[] = await Promise.all(
		FILES.map(async ({ name, type }) => ({
			name,
			type,
			body: new Uint8Array(await readFile(join(OUT_DIR, name))),
		})),
	);
	const urls = await uploadAssets(assets);
	const brand = {
		site: SITE,
		og: {
			url: urls["og.png"],
			width: OG_WIDTH,
			height: OG_HEIGHT,
			type: "image/png",
			alt: OG_ALT,
		},
		icons: {
			svg: urls["icon.svg"],
			png32: urls["icon-32.png"],
			apple180: urls["apple-touch-icon.png"],
			png192: urls["icon-192.png"],
			png512: urls["icon-512.png"],
		},
	};
	await writeFile(
		join(ROOT, "src/lib/brand-assets.json"),
		`${JSON.stringify(brand, null, 2)}\n`,
	);
	const manifest = {
		id: "/",
		name: "MovieTable",
		short_name: "MovieTable",
		description: LEDE,
		lang: "en",
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#ffffff",
		icons: [
			{ src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
			{ src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
			{ src: "/icon-maskable-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
		],
	};
	await writeFile(
		join(ROOT, "public/manifest.json"),
		`${JSON.stringify(manifest, null, 2)}\n`,
	);
	console.log("wrote src/lib/brand-assets.json and public/manifest.json");
}

if (process.argv.includes("--upload")) {
	await publish();
} else {
	await render();
}
