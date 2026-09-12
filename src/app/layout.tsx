import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

const playfairDisplay = Playfair_Display({subsets:['latin'],variable:'--font-playfair'});

export const metadata: Metadata = {
  title: "MovieTable — Find your next great film",
  description: "Explore 3,963 movies. Compare audience and critic scores, build your own filters, and find your next great film with a ranking that reflects your taste.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={cn("bg-background", "font-serif", playfairDisplay.variable)}><body className="font-serif text-foreground antialiased">{children}</body></html>;
}
