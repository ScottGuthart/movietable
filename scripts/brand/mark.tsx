/** The favicon mark: Phosphor film reel in Ink with the wordmark's crimson period at the corner. */
import { ImageResponse } from "next/og";
import { Icon, type IconWeight, phosphorPaths } from "./phosphor";
import { color } from "./tokens";

/**
 * All fractions of the canvas size. `dotInset` places the period's outer edge
 * from the canvas edge; it defaults to the glyph's own inset, and maskable
 * icons pull it inward so the period stays inside the 80% safe circle.
 */
export type MarkOptions = {
	weight: IconWeight;
	glyph: number;
	dot: number;
	dotInset?: number;
};

export async function renderMarkPng(
	size: number,
	options: MarkOptions,
): Promise<Buffer> {
	const reel = await phosphorPaths("film-reel", options.weight);
	const glyph = Math.round(size * options.glyph);
	const dot = Math.round(size * options.dot);
	const inset = Math.round(
		size * (options.dotInset ?? (1 - options.glyph) / 2),
	);
	const image = new ImageResponse(
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				background: color.paper,
			}}
		>
			<Icon paths={reel} size={glyph} fill={color.ink} />
			<div
				style={{
					display: "flex",
					position: "absolute",
					right: inset,
					bottom: inset,
					width: dot,
					height: dot,
					borderRadius: 9999,
					background: color.crimson,
				}}
			/>
		</div>,
		{ width: size, height: size },
	);
	return Buffer.from(await image.arrayBuffer());
}

/** Transparent SVG favicon in the bold weight for 16px tabs; dark colour schemes get Chalk and Lit Crimson. */
export async function renderMarkSvg(): Promise<string> {
	const reel = await phosphorPaths("film-reel", "bold");
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">`,
		`<style>.g{fill:${color.ink}}.p{fill:${color.crimson}}@media (prefers-color-scheme:dark){.g{fill:${color.chalk}}.p{fill:${color.litCrimson}}}</style>`,
		...reel.map((p) => `<path class="g" d="${p.d}"/>`),
		`<circle class="p" cx="220" cy="220" r="32"/>`,
		`</svg>`,
		"",
	].join("\n");
}

/** Wraps one PNG in the ICO container so /favicon.ico keeps answering the browsers that still request it. */
export function pngToIco(png: Buffer, size: number): Buffer {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(1, 4);
	const entry = Buffer.alloc(16);
	const dimension = size === 256 ? 0 : size;
	entry.writeUInt8(dimension, 0);
	entry.writeUInt8(dimension, 1);
	entry.writeUInt8(0, 2);
	entry.writeUInt8(0, 3);
	entry.writeUInt16LE(1, 4);
	entry.writeUInt16LE(32, 6);
	entry.writeUInt32LE(png.length, 8);
	entry.writeUInt32LE(header.length + entry.length, 12);
	return Buffer.concat([header, entry, png]);
}
