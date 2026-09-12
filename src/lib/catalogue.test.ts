import { describe, expect, test } from "bun:test";
import { fetchWithRetry, pageAll, toRawMovies, toTasteCatalogue, truncateSummary, type MovieRow, type TasteRow } from "@/lib/catalogue";

const row = (overrides: Partial<MovieRow> & Pick<MovieRow, "id" | "slug">): MovieRow => ({
  title: overrides.slug, year: 2000, metascore: 80, userscore: 75, users_rated: 400,
  link: `https://www.metacritic.com/movie/${overrides.slug}/`, ...overrides,
});

describe("movie rows", () => {
  test("maps database rows onto the app's raw movie shape", () => {
    const { movies, dropped } = toRawMovies([row({ id: 1, slug: "heat", title: "Heat", year: 1995, userscore: 88.5 })]);
    expect(movies).toEqual([{ slug: "heat", title: "Heat", year: 1995, metascore: 80, userscore: 88.5, users_rated: 400, link: "https://www.metacritic.com/movie/heat/" }]);
    expect(dropped).toBe(0);
  });
  test("drops films without a release year and counts them", () => {
    const { movies, dropped } = toRawMovies([row({ id: 1, slug: "a" }), row({ id: 2, slug: "b", year: null })]);
    expect(movies.map((movie) => movie.slug)).toEqual(["a"]);
    expect(dropped).toBe(1);
  });
});

describe("taste rows", () => {
  const person = (slug: string, name = slug) => ({ slug, name });
  const taste: TasteRow = {
    id: 1, slug: "the-godfather", year: 1972, summary: "Aging patriarch.",
    movie_genres: [{ genres: { name: "Crime" } }, { genres: { name: "Drama" } }],
    credits: [
      { role: "cast", billing: 2, people: person("al-pacino", "Al Pacino") },
      { role: "director", billing: 1, people: person("francis-ford-coppola", "Francis Ford Coppola") },
      { role: "cast", billing: 1, people: person("marlon-brando", "Marlon Brando") },
      { role: "writer", billing: 1, people: person("mario-puzo", "Mario Puzo") },
      ...Array.from({ length: 12 }, (_, index) => ({ role: "cast" as const, billing: index + 3, people: person(`extra-${index}`) })),
    ],
  };

  test("splits credits by role in billing order, caps cast at eight, and indexes people by slug order", () => {
    const { films, people } = toTasteCatalogue([taste]);
    expect(films).toHaveLength(1);
    expect(people).toEqual(["Al Pacino", "extra-0", "extra-1", "extra-2", "extra-3", "extra-4", "extra-5", "Francis Ford Coppola", "Mario Puzo", "Marlon Brando"]);
    expect(films[0]).toMatchObject({ slug: "the-godfather", year: 1972, summary: "Aging patriarch.", genres: ["Crime", "Drama"],
      directors: [7], writers: [8], cast: [9, 0, 1, 2, 3, 4, 5, 6] });
  });
  test("shares one index for a person credited on several films", () => {
    const second: TasteRow = { ...taste, id: 2, slug: "the-godfather-part-ii", credits: [{ role: "director", billing: 1, people: person("francis-ford-coppola", "Francis Ford Coppola") }] };
    const { films, people } = toTasteCatalogue([taste, second]);
    expect(films[1]!.directors).toEqual(films[0]!.directors);
    expect(people.filter((name) => name === "Francis Ford Coppola")).toHaveLength(1);
  });
  test("tolerates films with no genres or credits", () => {
    const { films } = toTasteCatalogue([{ ...taste, movie_genres: [], credits: [] }]);
    expect(films[0]).toMatchObject({ genres: [], directors: [], writers: [], cast: [] });
  });
});

describe("keyset paging", () => {
  test("asks for the page after the last id until a short page arrives", async () => {
    const calls: number[] = [];
    const rows = Array.from({ length: 2500 }, (_, index) => ({ id: index + 1 }));
    const all = await pageAll(async (afterId, limit) => {
      calls.push(afterId);
      return rows.filter((entry) => entry.id > afterId).slice(0, limit);
    }, 1000);
    expect(all).toHaveLength(2500);
    expect(calls).toEqual([0, 1000, 2000]);
  });
  test("stops after one empty page", async () => {
    const all = await pageAll(async () => [], 1000);
    expect(all).toEqual([]);
  });
});

describe("summary trimming", () => {
  const long = "A harried film director, unable to finish his next picture, retreats into a swirl of memories and fantasies while producers, lovers, and critics press in from every side of the set.";
  test("keeps short summaries and nulls untouched", () => {
    expect(truncateSummary("Short.")).toBe("Short.");
    expect(truncateSummary(null)).toBeNull();
  });
  test("ends at the last full sentence when one fits", () => {
    const text = "A harried film director retreats into his memories and fantasies while the whole production waits. Then a great deal more happens over the following two hours that nobody needs to read on a small card.";
    expect(truncateSummary(text, 160)).toBe("A harried film director retreats into his memories and fantasies while the whole production waits.");
  });
  test("otherwise cuts at a word boundary with an ellipsis", () => {
    const cut = truncateSummary(long, 160)!;
    expect(cut.length).toBeLessThanOrEqual(160);
    expect(cut.endsWith("…")).toBe(true);
    expect(long.startsWith(cut.slice(0, -1))).toBe(true);
    expect(cut.slice(0, -1).endsWith(" ")).toBe(false);
  });
});

describe("retrying fetch", () => {
  const respond = (codes: number[], calls: number[]) => async () => {
    const code = codes.shift();
    if (code === undefined) throw new Error("no more responses");
    calls.push(code);
    return new Response(code === 200 ? "[]" : "down", { status: code });
  };
  const noSleep = (waits: number[]) => async (ms: number) => { waits.push(ms); };

  test("retries 5xx responses with doubling waits and returns the first success", async () => {
    const calls: number[] = [];
    const waits: number[] = [];
    const response = await fetchWithRetry(respond([503, 502, 200], calls), "https://db.test/rest", {}, { attempts: 4, baseDelayMs: 10, sleep: noSleep(waits) });
    expect(response.status).toBe(200);
    expect(calls).toEqual([503, 502, 200]);
    expect(waits).toEqual([10, 20]);
  });
  test("returns the last failing response once attempts run out", async () => {
    const calls: number[] = [];
    const response = await fetchWithRetry(respond([503, 503, 503], calls), "https://db.test/rest", {}, { attempts: 2, baseDelayMs: 1, sleep: noSleep([]) });
    expect(response.status).toBe(503);
    expect(calls).toEqual([503, 503]);
  });
  test("does not retry client errors", async () => {
    const calls: number[] = [];
    const response = await fetchWithRetry(respond([404, 200], calls), "https://db.test/rest", {}, { attempts: 3, baseDelayMs: 1, sleep: noSleep([]) });
    expect(response.status).toBe(404);
    expect(calls).toEqual([404]);
  });
  test("retries a thrown network error and rethrows when attempts run out", async () => {
    let calls = 0;
    const flaky = async () => {
      calls += 1;
      if (calls === 1) throw new TypeError("fetch failed");
      return new Response("[]", { status: 200 });
    };
    expect((await fetchWithRetry(flaky, "https://db.test/rest", {}, { attempts: 2, baseDelayMs: 1, sleep: noSleep([]) })).status).toBe(200);
    const dead = async () => { throw new TypeError("fetch failed"); };
    await expect(fetchWithRetry(dead, "https://db.test/rest", {}, { attempts: 2, baseDelayMs: 1, sleep: noSleep([]) })).rejects.toThrow("fetch failed");
  });
});
