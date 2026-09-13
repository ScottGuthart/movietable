"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Applies `.dark` on <html> from the visitor's choice, defaulting to the system setting. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="movietable.theme">
      {children}
    </NextThemesProvider>
  );
}
