import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Playfair_Display } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme/theme-provider";
import brand from "@/lib/brand-assets.json";
import { cn } from "@/lib/utils";
import { isV0Preview } from "@/lib/preview-mode";

const playfairDisplay = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-serif",
});

const title = "MovieTable — Find your next great film";
const description =
	"Compare audience and critic scores, rate a few films to build your own ranking, and find your next great film.";

export const metadata: Metadata = {
	...(isV0Preview() ? { robots: { index: false, follow: false } } : {}),
	metadataBase: new URL(brand.site),
	title,
	description,
	authors: [{ name: "Scott Guthart", url: "https://guth.art" }],
	creator: "Scott Guthart",
	openGraph: {
		type: "website",
		url: "/",
		siteName: "MovieTable",
		title,
		description,
		images: [
			{
				url: brand.og.url,
				width: brand.og.width,
				height: brand.og.height,
				type: brand.og.type,
				alt: brand.og.alt,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title,
		description,
		images: [{ url: brand.og.url, alt: brand.og.alt }],
	},
	icons: {
		icon: [
			{ url: brand.icons.svg, type: "image/svg+xml" },
			{ url: brand.icons.png32, type: "image/png", sizes: "32x32" },
			{ url: brand.icons.png192, type: "image/png", sizes: "192x192" },
		],
		apple: [{ url: brand.icons.apple180, type: "image/png", sizes: "180x180" }],
	},
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#141414" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn("bg-background", "font-serif", playfairDisplay.variable)}
		>
			<body className="font-serif text-foreground antialiased">
				<ThemeProvider>
					<NuqsAdapter>{children}</NuqsAdapter>
				</ThemeProvider>
			</body>
		</html>
	);
}
