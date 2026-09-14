/** The social card: the ledger's own title block on Paper, 1200 by 630. */
import { ImageResponse } from "next/og";
import { AvatarGroup, Icon, phosphorPaths } from "./phosphor";
import { color, FONT_FAMILY } from "./tokens";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const CTA = "Find your next film";
export const LEDE =
	"The all-time top films on Metacritic, ranked by how much you trust critics versus crowds.";
export const OG_ALT = `MovieTable. ${LEDE} ${CTA}.`;

export type Font = {
	name: string;
	data: Buffer;
	weight: 400 | 500 | 600;
	style: "normal";
};
export type CatalogueFacts = { films: string; years: string };

function ScoreBiasSlider() {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 18,
				fontSize: 26,
				fontWeight: 400,
				color: color.fadedInk,
			}}
		>
			Users
			<div
				style={{
					display: "flex",
					alignItems: "center",
					width: 300,
					height: 8,
					borderRadius: 9999,
					background: color.paperTint,
				}}
			>
				<div
					style={{
						display: "flex",
						width: 150,
						height: 8,
						borderRadius: 9999,
						background: color.crimson,
					}}
				/>
				<div
					style={{
						display: "flex",
						width: 22,
						height: 22,
						marginLeft: -11,
						borderRadius: 9999,
						background: color.paper,
						border: `2px solid ${color.pencilGray}`,
					}}
				/>
			</div>
			Critics
		</div>
	);
}

export async function renderOgCard(
	fonts: Font[],
	facts: CatalogueFacts,
): Promise<Buffer> {
	const icons = await Promise.all([
		phosphorPaths("popcorn", "duotone"),
		phosphorPaths("film-strip", "duotone"),
		phosphorPaths("film-reel", "duotone"),
	]);
	const arrow = await phosphorPaths("arrow-right", "regular");
	const image = new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				width: "100%",
				height: "100%",
				padding: "64px 72px 56px",
				background: color.paper,
				color: color.ink,
				fontFamily: FONT_FAMILY,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
				}}
			>
				<AvatarGroup icons={icons} size={104} />
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						gap: 6,
						paddingTop: 14,
					}}
				>
					<div style={{ display: "flex", fontSize: 30, fontWeight: 500 }}>
						movietable.ai
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 26,
							fontWeight: 400,
							color: color.fadedInk,
						}}
					>
						{facts.films} · {facts.years}
					</div>
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
				<div
					style={{
						display: "flex",
						fontSize: 136,
						fontWeight: 600,
						lineHeight: 1,
						letterSpacing: "-0.025em",
					}}
				>
					MovieTable<span style={{ color: color.crimson }}>.</span>
				</div>
				<div
					style={{
						display: "flex",
						maxWidth: 900,
						fontSize: 36,
						fontWeight: 400,
						lineHeight: 1.35,
						color: color.fadedInk,
					}}
				>
					{LEDE}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderTop: `2px solid ${color.hairline}`,
					paddingTop: 30,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 14,
						height: 76,
						padding: "0 32px",
						background: color.crimson,
						color: color.blushWhite,
						fontSize: 32,
						fontWeight: 500,
					}}
				>
					{CTA}
					<Icon paths={arrow} size={30} fill={color.blushWhite} />
				</div>
				<ScoreBiasSlider />
			</div>
		</div>,
		{ width: OG_WIDTH, height: OG_HEIGHT, fonts },
	);
	return Buffer.from(await image.arrayBuffer());
}
