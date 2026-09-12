import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

const playfairDisplay = Playfair_Display({subsets:['latin'],variable:'--font-serif'});

export const metadata: Metadata = {
  title: "MovieTable — Find your next great film",
  description: "Compare audience and critic scores, rate a few films to build your own ranking, and find your next great film.",
  authors: [{ name: "Scott Guthart", url: "https://guth.art" }],
  creator: "Scott Guthart",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={cn("bg-background", "font-serif", playfairDisplay.variable)}><body className="font-serif text-foreground antialiased">{children}</body></html>;
}
