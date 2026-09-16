import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Read mode: the ledger's quietest register for long-form pages — the wordmark as the
 * way home, one Playfair heading, dated copy, and a hairline footer with the other
 * read pages. No cards, no hero, no icons.
 */
export function ReadPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 font-serif sm:px-8 sm:py-12 lg:py-16">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-5">
          <Link href="/" className="text-lg font-semibold tracking-tight underline-offset-4 hover:underline">
            MovieTable<span className="text-primary">.</span>
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
            <p className="text-muted-foreground text-sm">Last updated {updated}</p>
          </div>
        </header>
        <article className="flex flex-col gap-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_section]:flex [&_section]:flex-col [&_section]:gap-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_ul]:leading-relaxed [&_a]:text-foreground [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline">
          {children}
        </article>
        <footer className="border-border flex flex-col gap-2 border-t pt-6 text-sm">
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Read pages">
            <Link href="/privacy" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Privacy policy</Link>
            <Link href="/support" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Support</Link>
            <Link href="/" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Back to the table</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
