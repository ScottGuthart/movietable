import type { CreditRow, DetailRow, Monetization, MovieRow, Provider, SignalRow, TasteRow } from "@/lib/catalogue";
import type { AwardRow } from "@/lib/film-detail";

interface PreviewFilm {
  slug: string;
  title: string;
  year: number;
  scores: [critics: number | null, audience: number | null, votes: number | null];
  language: string;
  genres: string[];
  subgenres: string[];
  director: string;
  writer?: string;
  cast: string[];
  summary: string;
  imdbId: string;
  wins?: string[];
  nominations?: string[];
}

/** Illustrative scores, awards and US availability, not a snapshot of live catalogue data. */
export const previewFilms: PreviewFilm[] = [
  { slug: "casablanca", title: "Casablanca", year: 1942, scores: [100, 92, 1800], language: "English", genres: ["Drama", "Romance"], subgenres: ["romantic drama film"], director: "Michael Curtiz", writer: "Julius J. Epstein", cast: ["Humphrey Bogart", "Ingrid Bergman"], summary: "An expatriate café owner must choose between an old love and helping her escape wartime Casablanca.", imdbId: "tt0034583", wins: ["Best Picture", "Best Director", "Best Adapted Screenplay"], nominations: ["Best Actor"] },
  { slug: "seven-samurai", title: "Seven Samurai", year: 1954, scores: [98, 94, 1500], language: "Japanese", genres: ["Action", "Drama"], subgenres: ["samurai film", "epic film"], director: "Akira Kurosawa", cast: ["Toshiro Mifune", "Takashi Shimura"], summary: "Farmers hire a band of wandering samurai to protect their village from a returning group of bandits.", imdbId: "tt0047478", nominations: ["Best Costume Design"] },
  { slug: "vertigo", title: "Vertigo", year: 1958, scores: [100, 87, 1600], language: "English", genres: ["Mystery", "Thriller"], subgenres: ["psychological thriller film"], director: "Alfred Hitchcock", writer: "Alec Coppel", cast: ["James Stewart", "Kim Novak"], summary: "A former detective follows a mysterious woman through San Francisco and becomes caught in an obsession.", imdbId: "tt0052357" },
  { slug: "2001-a-space-odyssey", title: "2001: A Space Odyssey", year: 1968, scores: [84, 91, 2800], language: "English", genres: ["Sci-Fi", "Adventure"], subgenres: ["space exploration film"], director: "Stanley Kubrick", writer: "Arthur C. Clarke", cast: ["Keir Dullea", "Gary Lockwood"], summary: "A voyage toward Jupiter becomes a confrontation with an intelligent computer and a mystery older than humanity.", imdbId: "tt0062622", wins: ["Best Visual Effects"], nominations: ["Best Director"] },
  { slug: "the-godfather", title: "The Godfather", year: 1972, scores: [100, 95, 14000], language: "English", genres: ["Crime", "Drama"], subgenres: ["gangster film", "epic film"], director: "Francis Ford Coppola", writer: "Mario Puzo", cast: ["Marlon Brando", "Al Pacino", "Diane Keaton"], summary: "The reluctant son of a powerful crime family is drawn into its business as his father's influence begins to fade.", imdbId: "tt0068646", wins: ["Best Picture", "Best Actor", "Best Adapted Screenplay"], nominations: ["Best Director"] },
  { slug: "the-godfather-part-ii", title: "The Godfather Part II", year: 1974, scores: [90, 94, 8500], language: "English", genres: ["Crime", "Drama"], subgenres: ["gangster film", "epic film"], director: "Francis Ford Coppola", writer: "Mario Puzo", cast: ["Al Pacino", "Robert De Niro", "Diane Keaton"], summary: "Michael expands his family's empire while the story returns to his father's arrival in New York.", imdbId: "tt0071562", wins: ["Best Picture", "Best Director", "Best Supporting Actor"] },
  { slug: "alien", title: "Alien", year: 1979, scores: [89, 91, 9500], language: "English", genres: ["Horror", "Sci-Fi"], subgenres: ["space horror film"], director: "Ridley Scott", writer: "Dan O'Bannon", cast: ["Sigourney Weaver", "Tom Skerritt"], summary: "A commercial spaceship answers a distress signal and brings a deadly organism aboard.", imdbId: "tt0078748", wins: ["Best Visual Effects"] },
  { slug: "blade-runner", title: "Blade Runner", year: 1982, scores: [84, 88, 7300], language: "English", genres: ["Sci-Fi", "Thriller"], subgenres: ["cyberpunk film", "neo-noir film"], director: "Ridley Scott", writer: "Hampton Fancher", cast: ["Harrison Ford", "Rutger Hauer"], summary: "A weary investigator hunts escaped replicants through a rain-soaked future Los Angeles.", imdbId: "tt0083658", nominations: ["Best Visual Effects"] },
  { slug: "my-neighbor-totoro", title: "My Neighbor Totoro", year: 1988, scores: [86, 92, 2600], language: "Japanese", genres: ["Animation", "Fantasy", "Family"], subgenres: ["anime", "coming-of-age film"], director: "Hayao Miyazaki", cast: ["Noriko Hidaka", "Chika Sakamoto"], summary: "Two sisters move to the countryside and discover gentle forest spirits near their new home.", imdbId: "tt0096283" },
  { slug: "goodfellas", title: "Goodfellas", year: 1990, scores: [92, 93, 6800], language: "English", genres: ["Crime", "Drama"], subgenres: ["gangster film"], director: "Martin Scorsese", writer: "Nicholas Pileggi", cast: ["Ray Liotta", "Robert De Niro", "Joe Pesci"], summary: "An ambitious young man enters the mob and discovers the instability behind its promises of wealth and belonging.", imdbId: "tt0099685", wins: ["Best Supporting Actor"], nominations: ["Best Picture", "Best Director"] },
  { slug: "jurassic-park", title: "Jurassic Park", year: 1993, scores: [68, 89, 9800], language: "English", genres: ["Adventure", "Sci-Fi"], subgenres: ["dinosaur film"], director: "Steven Spielberg", writer: "Michael Crichton", cast: ["Sam Neill", "Laura Dern", "Jeff Goldblum"], summary: "Visitors to a remote wildlife park must survive when its genetically revived dinosaurs break loose.", imdbId: "tt0107290", wins: ["Best Visual Effects", "Best Sound"] },
  { slug: "the-shawshank-redemption", title: "The Shawshank Redemption", year: 1994, scores: [82, 96, 21000], language: "English", genres: ["Drama"], subgenres: ["prison film"], director: "Frank Darabont", writer: "Stephen King", cast: ["Tim Robbins", "Morgan Freeman"], summary: "Two prisoners build a lasting friendship through years of hardship, small acts of resistance, and hope.", imdbId: "tt0111161", nominations: ["Best Picture", "Best Actor", "Best Adapted Screenplay"] },
  { slug: "pulp-fiction", title: "Pulp Fiction", year: 1994, scores: [94, 92, 18000], language: "English", genres: ["Crime", "Drama"], subgenres: ["black comedy film", "neo-noir film"], director: "Quentin Tarantino", cast: ["John Travolta", "Samuel L. Jackson", "Uma Thurman"], summary: "Interlocking stories follow two hitmen, a boxer, and a crime boss's wife through a series of disastrous encounters.", imdbId: "tt0110912", wins: ["Best Original Screenplay"], nominations: ["Best Picture"] },
  { slug: "heat", title: "Heat", year: 1995, scores: [76, 90, 5100], language: "English", genres: ["Crime", "Action"], subgenres: ["heist film", "neo-noir film"], director: "Michael Mann", cast: ["Al Pacino", "Robert De Niro", "Val Kilmer"], summary: "A meticulous thief and an obsessive detective recognize themselves in each other as a final heist approaches.", imdbId: "tt0113277" },
  { slug: "fargo", title: "Fargo", year: 1996, scores: [86, 86, 4100], language: "English", genres: ["Crime", "Thriller"], subgenres: ["black comedy film"], director: "Joel Coen", writer: "Ethan Coen", cast: ["Frances McDormand", "William H. Macy"], summary: "A small-town police chief investigates the violent consequences of a car salesman's poorly planned kidnapping.", imdbId: "tt0116282", wins: ["Best Actress", "Best Original Screenplay"] },
  { slug: "princess-mononoke", title: "Princess Mononoke", year: 1997, scores: [76, 93, 3100], language: "Japanese", genres: ["Animation", "Fantasy", "Adventure"], subgenres: ["anime", "epic film"], director: "Hayao Miyazaki", cast: ["Yoji Matsuda", "Yuriko Ishida"], summary: "A young traveler is caught between an expanding ironworks and the ancient spirits defending their forest.", imdbId: "tt0119698" },
  { slug: "the-matrix", title: "The Matrix", year: 1999, scores: [73, 92, 16000], language: "English", genres: ["Action", "Sci-Fi"], subgenres: ["cyberpunk film"], director: "Lana Wachowski", writer: "Lilly Wachowski", cast: ["Keanu Reeves", "Carrie-Anne Moss", "Laurence Fishburne"], summary: "A programmer discovers that the world he knows is a simulation and joins a resistance fighting to free humanity.", imdbId: "tt0133093", wins: ["Best Visual Effects", "Best Film Editing"] },
  { slug: "memento", title: "Memento", year: 2000, scores: [83, 91, 7000], language: "English", genres: ["Mystery", "Thriller"], subgenres: ["psychological thriller film", "neo-noir film"], director: "Christopher Nolan", writer: "Jonathan Nolan", cast: ["Guy Pearce", "Carrie-Anne Moss"], summary: "A man unable to form new memories uses notes and tattoos to investigate his wife's death.", imdbId: "tt0209144", nominations: ["Best Original Screenplay"] },
  { slug: "amelie", title: "Amélie", year: 2001, scores: [69, 90, 4100], language: "French", genres: ["Romance", "Comedy"], subgenres: ["romantic comedy film"], director: "Jean-Pierre Jeunet", writer: "Guillaume Laurant", cast: ["Audrey Tautou", "Mathieu Kassovitz"], summary: "A shy Parisian waitress secretly improves the lives of strangers while learning to take a chance on her own happiness.", imdbId: "tt0211915", nominations: ["Best Original Screenplay"] },
  { slug: "spirited-away", title: "Spirited Away", year: 2001, scores: [96, 95, 8400], language: "Japanese", genres: ["Animation", "Fantasy", "Adventure"], subgenres: ["anime", "coming-of-age film"], director: "Hayao Miyazaki", cast: ["Rumi Hiiragi", "Miyu Irino"], summary: "A girl enters a spirit world and takes a job in a bathhouse to save her parents and find her way home.", imdbId: "tt0245429", wins: ["Best Animated Feature"] },
  { slug: "before-sunset", title: "Before Sunset", year: 2004, scores: [90, 88, 2200], language: "English", genres: ["Romance", "Drama"], subgenres: ["romantic drama film"], director: "Richard Linklater", writer: "Julie Delpy", cast: ["Ethan Hawke", "Julie Delpy"], summary: "Two people who once shared a night together reconnect in Paris and walk through the lives they might have led.", imdbId: "tt0381681", nominations: ["Best Adapted Screenplay"] },
  { slug: "eternal-sunshine-of-the-spotless-mind", title: "Eternal Sunshine of the Spotless Mind", year: 2004, scores: [89, 91, 7800], language: "English", genres: ["Romance", "Sci-Fi", "Drama"], subgenres: ["romantic drama film"], director: "Michel Gondry", writer: "Charlie Kaufman", cast: ["Jim Carrey", "Kate Winslet", "Mark Ruffalo"], summary: "A man undergoing a procedure to erase a relationship begins trying to preserve the memories he wanted to lose.", imdbId: "tt0338013", wins: ["Best Original Screenplay"] },
  { slug: "children-of-men", title: "Children of Men", year: 2006, scores: [84, 87, 6000], language: "English", genres: ["Sci-Fi", "Thriller"], subgenres: ["dystopian film"], director: "Alfonso Cuarón", cast: ["Clive Owen", "Julianne Moore", "Michael Caine"], summary: "In a world without new births, a disillusioned man must escort a pregnant woman to safety.", imdbId: "tt0206634", nominations: ["Best Cinematography"] },
  { slug: "the-dark-knight", title: "The Dark Knight", year: 2008, scores: [84, 92, 24000], language: "English", genres: ["Action", "Crime"], subgenres: ["superhero film"], director: "Christopher Nolan", writer: "Jonathan Nolan", cast: ["Christian Bale", "Heath Ledger", "Michael Caine"], summary: "Batman faces an adversary who seeks to unravel Gotham by turning its rules and moral choices against it.", imdbId: "tt0468569", wins: ["Best Supporting Actor", "Best Sound Editing"] },
  { slug: "speed-racer", title: "Speed Racer", year: 2008, scores: [37, 82, 2500], language: "English", genres: ["Action", "Family"], subgenres: ["sports film"], director: "Lana Wachowski", writer: "Lilly Wachowski", cast: ["Emile Hirsch", "Christina Ricci"], summary: "A young racing driver and his family challenge the corporate interests controlling their sport.", imdbId: "tt0811080" },
  { slug: "fantastic-mr-fox", title: "Fantastic Mr. Fox", year: 2009, scores: [83, 87, 3400], language: "English", genres: ["Animation", "Comedy", "Adventure"], subgenres: ["stop-motion film", "heist film"], director: "Wes Anderson", writer: "Noah Baumbach", cast: ["George Clooney", "Meryl Streep", "Bill Murray"], summary: "A fox's return to his old thieving habits puts his family and neighbors in conflict with three farmers.", imdbId: "tt0432283", nominations: ["Best Animated Feature"] },
  { slug: "inception", title: "Inception", year: 2010, scores: [74, 92, 20000], language: "English", genres: ["Sci-Fi", "Thriller", "Action"], subgenres: ["heist film"], director: "Christopher Nolan", cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Marion Cotillard"], summary: "A team of specialists enters shared dreams to plant an idea, but their leader's memories threaten the mission.", imdbId: "tt1375666", wins: ["Best Cinematography", "Best Visual Effects"], nominations: ["Best Picture"] },
  { slug: "the-grand-budapest-hotel", title: "The Grand Budapest Hotel", year: 2014, scores: [88, 88, 5900], language: "English", genres: ["Comedy", "Adventure"], subgenres: ["black comedy film"], director: "Wes Anderson", cast: ["Ralph Fiennes", "Tony Revolori", "Bill Murray"], summary: "A concierge and his young protégé become entangled in a stolen painting, a disputed inheritance, and a changing Europe.", imdbId: "tt2278388", wins: ["Best Production Design", "Best Costume Design"], nominations: ["Best Picture"] },
  { slug: "interstellar", title: "Interstellar", year: 2014, scores: [74, 93, 22000], language: "English", genres: ["Sci-Fi", "Adventure", "Drama"], subgenres: ["space exploration film", "epic film"], director: "Christopher Nolan", writer: "Jonathan Nolan", cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"], summary: "Explorers travel through a wormhole in search of a future for humanity while time separates them from their families.", imdbId: "tt0816692", wins: ["Best Visual Effects"] },
  { slug: "mad-max-fury-road", title: "Mad Max: Fury Road", year: 2015, scores: [90, 84, 14000], language: "English", genres: ["Action", "Adventure"], subgenres: ["post-apocalyptic film"], director: "George Miller", cast: ["Tom Hardy", "Charlize Theron"], summary: "Two survivors join forces to escape a desert tyrant in a relentless chase across a wasteland.", imdbId: "tt1392190", wins: ["Best Film Editing", "Best Costume Design"], nominations: ["Best Picture"] },
  { slug: "arrival", title: "Arrival", year: 2016, scores: [81, 86, 8300], language: "English", genres: ["Sci-Fi", "Drama"], subgenres: ["first contact film"], director: "Denis Villeneuve", writer: "Eric Heisserer", cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker"], summary: "A linguist tries to communicate with alien visitors as nations struggle to understand their intentions.", imdbId: "tt2543164", wins: ["Best Sound Editing"], nominations: ["Best Picture"] },
  { slug: "moonlight", title: "Moonlight", year: 2016, scores: [99, 78, 5000], language: "English", genres: ["Drama"], subgenres: ["coming-of-age film"], director: "Barry Jenkins", writer: "Tarell Alvin McCraney", cast: ["Trevante Rhodes", "Mahershala Ali", "Naomie Harris"], summary: "Three chapters trace a young man's search for identity and connection while growing up in Miami.", imdbId: "tt4975722", wins: ["Best Picture", "Best Supporting Actor", "Best Adapted Screenplay"] },
  { slug: "parasite", title: "Parasite", year: 2019, scores: [97, 91, 18000], language: "Korean", genres: ["Thriller", "Drama"], subgenres: ["black comedy film"], director: "Bong Joon Ho", writer: "Han Jin Won", cast: ["Song Kang Ho", "Choi Woo Shik", "Park So Dam"], summary: "A struggling family works its way into a wealthy household, setting off an increasingly dangerous collision of worlds.", imdbId: "tt6751668", wins: ["Best Picture", "Best Director", "Best Original Screenplay", "Best International Feature"] },
  { slug: "portrait-of-a-lady-on-fire", title: "Portrait of a Lady on Fire", year: 2019, scores: [95, 89, 3100], language: "French", genres: ["Romance", "Drama"], subgenres: ["romantic drama film", "period film"], director: "Céline Sciamma", cast: ["Noémie Merlant", "Adèle Haenel"], summary: "An artist commissioned to paint a reluctant bride forms a connection with her subject on an isolated coast.", imdbId: "tt8613070" },
  { slug: "everything-everywhere-all-at-once", title: "Everything Everywhere All at Once", year: 2022, scores: [81, 85, 11500], language: "English", genres: ["Action", "Comedy", "Sci-Fi"], subgenres: ["absurdist film"], director: "Daniel Kwan", writer: "Daniel Scheinert", cast: ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan"], summary: "A laundromat owner is pulled into alternate lives while trying to hold her family and business together.", imdbId: "tt6710474", wins: ["Best Picture", "Best Actress", "Best Supporting Actor"] },
  { slug: "past-lives", title: "Past Lives", year: 2023, scores: [94, 84, 2600], language: "Korean", genres: ["Romance", "Drama"], subgenres: ["romantic drama film"], director: "Celine Song", cast: ["Greta Lee", "Teo Yoo", "John Magaro"], summary: "Childhood friends reunite in New York and contemplate the choices and distances that shaped their lives.", imdbId: "tt13238346", nominations: ["Best Picture", "Best Original Screenplay"] },
];

export const previewProviders: Provider[] = [
  { id: 8, name: "Netflix", icon_url: null },
  { id: 9, name: "Prime Video", icon_url: null },
  { id: 11, name: "MUBI", icon_url: null },
  { id: 73, name: "Tubi", icon_url: null },
  { id: 1899, name: "HBO Max", icon_url: null },
];

function personSlug(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function creditsFor(film: PreviewFilm): DetailRow["credits"] {
  const credit = (name: string, role: CreditRow["role"], billing: number) => ({
    role, billing, person_slug: personSlug(name), people: { name }, character: null,
  });
  return [credit(film.director, "director", 1), credit(film.writer ?? film.director, "writer", 1), ...film.cast.map((name, index) => credit(name, "cast", index + 1))];
}

function awardsFor(film: PreviewFilm): AwardRow[] {
  const award = (category: string, result: AwardRow["result"]): AwardRow => ({
    award_name: `Academy Award for ${category}`, result, year: film.year + 1, person_name: null, person_slug: null,
  });
  return [...(film.wins ?? []).map((category) => award(category, "win")), ...(film.nominations ?? []).map((category) => award(category, "nominee"))];
}

function offersFor(index: number, justwatchUrl: string): DetailRow["streaming_offers"] {
  const offer = (provider: Provider, monetization: Monetization, price: number | null): DetailRow["streaming_offers"][number] => ({
    providers: provider, monetization, quality: "hd", url: justwatchUrl, price, currency_code: price === null ? null : "USD",
  });
  const subscriptions = [previewProviders[0]!, previewProviders[1]!, previewProviders[2]!, previewProviders[4]!];
  const offers = [offer(subscriptions[index % subscriptions.length]!, "flatrate", null), offer(previewProviders[1]!, "rent", 3.99)];
  if (index % 4 === 0) offers.push(offer(previewProviders[3]!, "ads", null));
  if (index % 3 === 0) offers.push(offer(previewProviders[1]!, "buy", 12.99));
  return offers;
}

function buildPreviewData() {
  const movies: MovieRow[] = [];
  const taste: TasteRow[] = [];
  const signals: SignalRow[] = [];
  const details = new Map<string, { row: DetailRow; awards: AwardRow[] }>();
  for (const [index, film] of previewFilms.entries()) {
    const movie_genres = film.genres.map((genre_name) => ({ genre_name }));
    const movie_subgenres = film.subgenres.map((subgenre_name) => ({ subgenre_name }));
    const movie_imdb = { language: film.language, imdb_id: film.imdbId, oscar_wins: film.wins?.length ?? 0, oscar_nominations: (film.wins?.length ?? 0) + (film.nominations?.length ?? 0) };
    const credits = creditsFor(film);
    const justwatch_url = `https://www.justwatch.com/us/search?q=${encodeURIComponent(film.title)}`;
    const streaming_offers = offersFor(index, justwatch_url);
    movies.push({ slug: film.slug, title: film.title, year: film.year, metascore: film.scores[0], userscore: film.scores[1], users_rated: film.scores[2], link: `https://www.metacritic.com/movie/${film.slug}/`, justwatch_url, movie_imdb, movie_genres, movie_subgenres });
    taste.push({ slug: film.slug, year: film.year, summary: film.summary, movie_imdb, movie_genres, movie_subgenres, credits });
    signals.push({ slug: film.slug, movie_genres, credits, streaming_offers: streaming_offers.map((offer) => ({ provider_id: offer.providers.id, monetization: offer.monetization })) });
    details.set(film.slug, { row: { slug: film.slug, summary: film.summary, justwatch_url, movie_imdb, movie_genres, credits, streaming_offers }, awards: awardsFor(film) });
  }
  return { movies, taste, signals, details };
}

export const previewData = buildPreviewData();
