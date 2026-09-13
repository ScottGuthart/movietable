import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Playfair_Display } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { PwaRuntime } from "@/components/pwa/pwa-runtime";

const playfairDisplay = Playfair_Display({subsets:['latin'],variable:'--font-serif'});

export const metadata: Metadata = {
  title: "MovieTable — Find your next great film",
  description: "Compare audience and critic scores, rate a few films to build your own ranking, and find your next great film.",
  authors: [{ name: "Scott Guthart", url: "https://guth.art" }],
  creator: "Scott Guthart",
  applicationName: "MovieTable",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "MovieTable", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/logo192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("bg-background", "font-serif", playfairDisplay.variable)}>
      <body className="font-serif text-foreground antialiased">
        <ThemeProvider>
          <PwaRuntime />
          <NuqsAdapter><div className="app-safe-area">{children}</div></NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
