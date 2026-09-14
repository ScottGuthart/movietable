/**
 * Phosphor glyphs for satori. The React components wrap their paths in a
 * Fragment, which satori cannot serialise inside <svg>, so the paths are read
 * straight from the SVG files in @phosphor-icons/core.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { color } from "./tokens";

export type IconWeight = "regular" | "bold" | "duotone";
export type IconPath = { d: string; opacity?: string };

export async function phosphorPaths(
	name: string,
	weight: IconWeight,
): Promise<IconPath[]> {
	const file = join(
		process.cwd(),
		"node_modules/@phosphor-icons/core/assets",
		weight,
		`${name}${weight === "regular" ? "" : `-${weight}`}.svg`,
	);
	const svg = await readFile(file, "utf8");
	const paths = [
		...svg.matchAll(/<path d="([^"]+)"(?: opacity="([^"]+)")?/g),
	].map(([, d, opacity]) => ({ d, opacity }));
	if (paths.length === 0) throw new Error(`no paths found in ${file}`);
	return paths;
}

export function Icon({
	paths,
	size,
	fill,
}: {
	paths: IconPath[];
	size: number;
	fill: string;
}) {
	return (
		<svg viewBox="0 0 256 256" width={size} height={size} fill={fill}>
			{paths.map((p, i) => (
				<path key={i} d={p.d} opacity={p.opacity} />
			))}
		</svg>
	);
}

/**
 * Three glyphs stacked the way the ReUI avatar group stacks avatars
 * (src/components/examples/c-avatar-10.tsx): overlapping circles on Paper Tint,
 * each separated from the next by a Paper ring.
 */
export function AvatarGroup({
	icons,
	size,
}: {
	icons: IconPath[][];
	size: number;
}) {
	return (
		<div style={{ display: "flex" }}>
			{icons.map((paths, i) => (
				<div
					key={i}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: size,
						height: size,
						borderRadius: 9999,
						background: color.paperTint,
						boxShadow: `0 0 0 3px ${color.paper}, 0 0 0 4px ${color.hairline}`,
						marginLeft: i === 0 ? 0 : -Math.round(size * 0.22),
					}}
				>
					<Icon paths={paths} size={Math.round(size * 0.56)} fill={color.ink} />
				</div>
			))}
		</div>
	);
}
