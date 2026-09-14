import { toRawMovies, toTasteCatalogue, toSignals, type CreditRow, type MovieRow, type Provider, type SignalRow, type TasteRow } from "@/lib/catalogue";

type SeedMovie = {
  slug: string;
  title: string;
  year: number | null;
  metascore: number | null;
  userscore: number | null;
  users_rated: number | null;
  link: string;
  justwatch_url: string | null;
  summary: string | null;
};
type SeedPerson = { slug: string; name: string };
type SeedCredit = { movie_slug: string; person_slug: string; role: "director" | "writer" | "cast"; billing: number; character: string | null };
type SeedGenre = { movie_slug: string; genre_name: string };
type SeedSubgenre = { movie_slug: string; subgenre_name: string };
type SeedImdb = { movie_slug: string; imdb_id: string; language: string | null; oscar_wins: number | null; oscar_nominations: number | null };
type SeedOffer = {
  movie_slug: string;
  provider_id: number;
  monetization: "flatrate" | "free" | "ads" | "rent" | "buy";
  quality: string;
  url: string;
  price: number | string | null;
  currency_code: string | null;
};
type SeedProvider = { id: number; name: string; icon_url: string | null };

async function readSeed<T>(name: string): Promise<T[]> {
  return Bun.file(`seed/${name}.json`).json() as Promise<T[]>;
}

function byMovie<T extends { movie_slug: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const group = map.get(row.movie_slug);
    if (group) group.push(row);
    else map.set(row.movie_slug, [row]);
  }
  return map;
}

async function main() {
  const [movies, people, credits, genres, subgenres, imdb, providers, offers] = await Promise.all([
    readSeed<SeedMovie>("movies"),
    readSeed<SeedPerson>("people"),
    readSeed<SeedCredit>("credits"),
    readSeed<SeedGenre>("movie_genres"),
    readSeed<SeedSubgenre>("movie_subgenres"),
    readSeed<SeedImdb>("movie_imdb"),
    readSeed<SeedProvider>("providers"),
    readSeed<SeedOffer>("streaming_offers"),
  ]);

  const peopleBySlug = new Map(people.map((person) => [person.slug, person]));
  const creditsByMovie = byMovie(credits);
  const genresByMovie = byMovie(genres);
  const subgenresByMovie = byMovie(subgenres);
  const imdbByMovie = new Map(imdb.map((row) => [row.movie_slug, row]));
  const offersByMovie = byMovie(offers);

  const creditRows = (slug: string): CreditRow[] =>
    (creditsByMovie.get(slug) ?? []).map((credit) => ({
      role: credit.role,
      billing: credit.billing,
      person_slug: credit.person_slug,
      people: { name: peopleBySlug.get(credit.person_slug)?.name ?? credit.person_slug },
      character: credit.character,
    }));
  const movieGenres = (slug: string) => (genresByMovie.get(slug) ?? []).map((row) => ({ genre_name: row.genre_name }));
  const movieSubgenres = (slug: string) => (subgenresByMovie.get(slug) ?? []).map((row) => ({ subgenre_name: row.subgenre_name }));
  const movieImdb = (slug: string) => {
    const row = imdbByMovie.get(slug);
    return row ? { language: row.language, oscar_wins: row.oscar_wins, oscar_nominations: row.oscar_nominations, imdb_id: row.imdb_id } : null;
  };

  const movieRows: MovieRow[] = movies.map((movie) => ({
    slug: movie.slug,
    title: movie.title,
    year: movie.year,
    metascore: movie.metascore,
    userscore: movie.userscore,
    users_rated: movie.users_rated,
    link: movie.link,
    justwatch_url: movie.justwatch_url,
    movie_imdb: movieImdb(movie.slug),
    movie_genres: movieGenres(movie.slug),
    movie_subgenres: movieSubgenres(movie.slug),
  }));
  const tasteRows: TasteRow[] = movies.map((movie) => ({
    slug: movie.slug,
    year: movie.year,
    summary: movie.summary,
    movie_imdb: movieImdb(movie.slug),
    movie_genres: movieGenres(movie.slug),
    movie_subgenres: movieSubgenres(movie.slug),
    credits: creditRows(movie.slug),
  }));
  const signalRows: SignalRow[] = movies.map((movie) => ({
    slug: movie.slug,
    movie_genres: movieGenres(movie.slug),
    credits: creditRows(movie.slug).filter((credit) => credit.role === "director" || credit.role === "writer"),
    streaming_offers: (offersByMovie.get(movie.slug) ?? [])
      .filter((offer) => offer.monetization === "flatrate" || offer.monetization === "free" || offer.monetization === "ads")
      .map((offer) => ({ provider_id: offer.provider_id, monetization: offer.monetization })),
  }));
  const providerRows: Provider[] = providers.map(({ id, name, icon_url }) => ({ id, name, icon_url }));

  const snapshot = {
    movies: toRawMovies(movieRows).movies,
    signals: toSignals(signalRows),
    taste: toTasteCatalogue(tasteRows),
    providers: providerRows,
    fetchedAt: "2026-09-14T00:00:00.000Z",
  };

  const output = "apple/Packages/MovieTableData/Sources/MovieTableData/Resources/seed/snapshot.json";
  await Bun.write(output, JSON.stringify(snapshot));
  console.error(`wrote ${snapshot.movies.length} films, ${snapshot.taste.people.length} people, ${providerRows.length} providers to ${output}`);
}

if (import.meta.main) await main();
