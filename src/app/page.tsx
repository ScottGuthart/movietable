import { IconArrowUpRight, IconMovie } from "@tabler/icons-react";
import MovieTable from "@/components/MovieTable";
import data from "@/components/data.json";
import { getMovieBounds, normalizeMovie, numberFormat } from "@/lib/movies";

const movies = data.map(normalizeMovie);
const bounds = getMovieBounds(movies);

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 font-serif sm:px-8 sm:py-12 lg:py-16">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="text-primary flex items-center gap-2 text-sm font-medium"><IconMovie className="size-5" aria-hidden="true" /><span>A film for every point of view</span></div>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">MovieTable<span className="text-primary">.</span></h1>
            <p className="text-muted-foreground max-w-lg leading-relaxed text-pretty">Find your next great film. Let the audience, the critics, or a little of both be your guide.</p>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-right">{numberFormat.format(movies.length)} films to explore<br />{bounds.earliestYear}–{bounds.latestYear} · Metacritic dataset</p>
        </header>
        <MovieTable movies={movies} />
        <footer className="text-muted-foreground flex flex-col gap-3 text-sm leading-relaxed sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
          <p>A curated dataset, not live ratings. Select any film to see its current scores on Metacritic.</p>
          <p className="shrink-0">
            Made by{" "}
            <a className="group text-foreground inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              href="https://guth.art" target="_blank" rel="noopener noreferrer author">
              Scott Guthart
              <IconArrowUpRight aria-hidden="true" className="text-muted-foreground size-4 opacity-40 group-hover:opacity-100" />
              <span className="sr-only"> (resume, opens in a new tab)</span>
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
