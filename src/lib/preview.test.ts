import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { GET } from "@/app/api/film/[slug]/route";
import {
  fetchCatalogue, fetchFilmDetail, fetchProviders, fetchSignals, fetchTasteData,
  toFilmDetail, toRawMovies, toSignals, toTasteCatalogue,
} from "@/lib/catalogue";
import { previewData, previewFilms, previewProviders } from "@/lib/preview-data";
import { isV0Sandbox } from "@/lib/preview-environment";
import { isV0Preview, tasteStorageKey } from "@/lib/preview-mode";
import { buildProfile, explainMatch } from "@/lib/taste";

const sandbox = "/vercel/share/v0-project";

describe("sandbox detection", () => {
  test("recognizes only the normalized editor workspace without deployment markers", () => {
    expect(isV0Sandbox(sandbox, {})).toBe(true);
    expect(isV0Sandbox(`${sandbox}/`, {})).toBe(true);
    expect(isV0Sandbox(`${sandbox}/src/..`, {})).toBe(true);
  });

  test.each(["/home/developer/movietable", "/vercel/path0", `${sandbox}-copy`, `${sandbox}/src`])("keeps %s on real data", (directory) => {
    expect(isV0Sandbox(directory, {})).toBe(false);
  });

  test.each(["production", "preview", "development"])("does not enable fixtures for a Vercel %s deployment", (VERCEL_ENV) => {
    expect(isV0Sandbox(sandbox, { VERCEL_ENV })).toBe(false);
    expect(isV0Sandbox(sandbox, { VERCEL: "1", VERCEL_ENV })).toBe(false);
  });

  test("fails closed for any deployment marker, even empty or unexpected values", () => {
    for (const value of ["1", "0", "", "unknown"]) {
      expect(isV0Sandbox(sandbox, { VERCEL: value })).toBe(false);
      expect(isV0Sandbox(sandbox, { VERCEL_ENV: value })).toBe(false);
    }
  });
});

describe("coherent preview fixtures", () => {
  test("uses unique valid slugs for every representation of 30–40 films", () => {
    const slugs = previewFilms.map((film) => film.slug).sort();
    expect(slugs.length).toBeGreaterThanOrEqual(30);
    expect(slugs.length).toBeLessThanOrEqual(40);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9][a-z0-9-]{0,199}$/);
    for (const rows of [previewData.movies, previewData.taste, previewData.signals]) {
      expect(rows.map((row) => row.slug).sort()).toEqual(slugs);
    }
    expect([...previewData.details.keys()].sort()).toEqual(slugs);
    expect(toRawMovies(previewData.movies).dropped).toBe(0);
  });

  test("spans decades, languages, genres, and score ranges", () => {
    expect(new Set(previewFilms.map((film) => Math.floor(film.year / 10))).size).toBeGreaterThanOrEqual(8);
    expect(new Set(previewFilms.map((film) => film.language)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(previewFilms.flatMap((film) => film.genres)).size).toBeGreaterThanOrEqual(10);
    const scores = previewFilms.flatMap((film) => film.scores[0] === null ? [] : [film.scores[0]]);
    expect(Math.min(...scores)).toBeLessThan(50);
    expect(Math.max(...scores)).toBe(100);
  });

  test("shares people across taste films to produce useful recommendation explanations", () => {
    const taste = toTasteCatalogue(previewData.taste);
    for (const film of taste.films) {
      for (const index of [...film.directors, ...film.writers, ...film.cast]) {
        expect(taste.people[index]).toBeString();
      }
    }
    const profile = buildProfile(taste, { "the-godfather": 5 });
    const sequel = taste.films.find((film) => film.slug === "the-godfather-part-ii")!;
    expect(explainMatch(profile, sequel, taste.people)).toContainEqual({ kind: "director", label: "Francis Ford Coppola" });
  });

  test("keeps providers, offers, awards, credits, and detail links consistent without remote images", () => {
    const providers = new Map(previewProviders.map((provider) => [provider.id, provider]));
    const signals = toSignals(previewData.signals);
    expect(providers.size).toBe(previewProviders.length);
    expect(previewProviders.every((provider) => provider.icon_url === null)).toBe(true);
    for (const movie of previewData.movies) {
      const { row, awards } = previewData.details.get(movie.slug)!;
      const detail = toFilmDetail(row, awards);
      const signal = signals[movie.slug]!;
      expect(detail.genres).toEqual(signal.genres);
      expect(detail.directors).toEqual(signal.directors);
      expect(detail.writers).toEqual(signal.writers);
      expect(detail.summary).toBeTruthy();
      expect(detail.imdbUrl).toMatch(/^https:\/\/www\.imdb\.com\/title\/tt\d+\/$/);
      expect(new URL(movie.link).protocol).toBe("https:");
      expect(movie.movie_imdb?.oscar_wins).toBe(awards.filter((award) => award.result === "win").length);
      expect(movie.movie_imdb?.oscar_nominations).toBe(awards.length);
      expect(signal.streamOn).toEqual(detail.offers.filter((offer) => offer.monetization === "flatrate").map((offer) => offer.providerId).sort((a, b) => a - b));
      expect(signal.free).toBe(detail.offers.some((offer) => offer.monetization === "free" || offer.monetization === "ads"));
      for (const offer of detail.offers) {
        expect(providers.get(offer.providerId)?.name).toBe(offer.provider);
        expect(offer.iconUrl).toBeNull();
        expect(new URL(offer.url).hostname).toBe("www.justwatch.com");
        expect(offer.url).toBe(detail.justwatchUrl!);
        expect(offer.price === null || offer.price >= 0).toBe(true);
      }
    }
  });
});

const envKeys = ["MOVIETABLE_V0_PREVIEW", "SUPABASE_URL", "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const loaders = [fetchCatalogue, fetchTasteData, fetchSignals, fetchProviders, () => fetchFilmDetail("the-godfather")];

type FetchTarget = { fetch: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch> };

describe("preview boundaries", () => {
  let saved: (string | undefined)[];
  let fetchSpy: ReturnType<typeof spyOn<FetchTarget, "fetch">>;

  beforeEach(() => {
    saved = envKeys.map((key) => process.env[key]);
    process.env.MOVIETABLE_V0_PREVIEW = "true";
    process.env.SUPABASE_URL = "https://preview-test.invalid";
    process.env.SUPABASE_ANON_KEY = "test-only-anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://preview-test.invalid";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-only-anon-key";
    fetchSpy = spyOn<FetchTarget, "fetch">(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Preview attempted an external fetch.");
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    for (const [index, key] of envKeys.entries()) {
      const value = saved[index];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  test("enables only the explicit compiled true value and isolates the storage namespace", () => {
    expect(isV0Preview()).toBe(true);
    expect(tasteStorageKey()).toBe("movietable.v0-preview.taste.v1");
    for (const value of ["false", "1", "TRUE", ""]) {
      process.env.MOVIETABLE_V0_PREVIEW = value;
      expect(isV0Preview()).toBe(false);
      expect(tasteStorageKey()).toBe("movietable.taste.v1");
    }
    delete process.env.MOVIETABLE_V0_PREVIEW;
    expect(isV0Preview()).toBe(false);
    expect(tasteStorageKey()).toBe("movietable.taste.v1");
  });

  test("every loader returns the shared transformed fixtures with zero fetches even with credentials", async () => {
    expect(await fetchCatalogue()).toEqual(toRawMovies(previewData.movies).movies);
    expect(await fetchTasteData()).toEqual(toTasteCatalogue(previewData.taste));
    expect(await fetchSignals()).toEqual(toSignals(previewData.signals));
    expect(await fetchProviders()).toEqual(previewProviders);
    for (const [slug, detail] of previewData.details) {
      expect(await fetchFilmDetail(slug)).toEqual(toFilmDetail(detail.row, detail.awards));
    }
    expect(await fetchFilmDetail("not-a-real-preview-film")).toBeNull();
    expect(await fetchFilmDetail("__proto__")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("works without Supabase credentials and returns fresh transformed objects", async () => {
    for (const key of envKeys.slice(1)) delete process.env[key];
    for (const load of loaders) expect(await load()).toBeTruthy();
    const providers = await fetchProviders();
    providers[0]!.name = "Changed by caller";
    expect((await fetchProviders())[0]!.name).toBe("Netflix");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("the film route preserves successful details, unknown 404s, and invalid-slug 400s", async () => {
    const request = new Request("https://preview-test.invalid/api/film/the-godfather");
    const known = await GET(request, { params: Promise.resolve({ slug: "the-godfather" }) });
    expect(known.status).toBe(200);
    expect((await known.json()).slug).toBe("the-godfather");
    const unknown = await GET(request, { params: Promise.resolve({ slug: "unknown-preview-film" }) });
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({ error: "Unknown film." });
    const invalid = await GET(request, { params: Promise.resolve({ slug: "../invalid" }) });
    expect(invalid.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("disables account availability and client construction even with browser credentials", async () => {
    const { getSupabase, isSupabaseConfigured } = await import("@/lib/supabase-browser");
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(isSupabaseConfigured()).toBe(false);
      expect(getSupabase).toThrow("Accounts and cloud sync are disabled in v0 preview");
      expect(errorSpy).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
      process.env.MOVIETABLE_V0_PREVIEW = "false";
      expect(isSupabaseConfigured()).toBe(true);
    } finally {
      errorSpy.mockRestore();
    }
  });

  test("saves and clears only preview ratings, leaving the existing production data untouched", async () => {
    const productionRatings = JSON.stringify({ verdicts: { "the-godfather": 1 }, updatedAt: { "the-godfather": 1 } });
    const storage = new Map([["movietable.taste.v1", productionRatings]]);
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } },
    });
    try {
      const store = await import("@/components/taste/taste-store");
      expect(store.getStampedVerdicts()).toEqual({});
      store.setVerdict("the-godfather", 5);
      expect(store.getStampedVerdicts()["the-godfather"]?.verdict).toBe(5);
      expect(JSON.parse(storage.get(tasteStorageKey())!).verdicts).toEqual({ "the-godfather": 5 });
      store.clearVerdicts();
      expect(JSON.parse(storage.get(tasteStorageKey())!).verdicts).toEqual({});
      expect(storage.get("movietable.taste.v1")).toBe(productionRatings);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });

  test("outside preview every loader still rejects missing credentials rather than returning fixtures", async () => {
    process.env.MOVIETABLE_V0_PREVIEW = "false";
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_URL;
    for (const load of loaders) {
      await expect(load()).rejects.toThrow("SUPABASE_ANON_KEY is not set");
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("outside preview upstream failures propagate without a catch-and-mock fallback", async () => {
    process.env.MOVIETABLE_V0_PREVIEW = "false";
    fetchSpy.mockImplementation(async () => new Response("Access denied", { status: 401, statusText: "Unauthorized" }));
    for (const load of loaders) await expect(load()).rejects.toThrow("returned 401 Unauthorized");
    expect(fetchSpy).toHaveBeenCalledTimes(6);
    for (const [url] of fetchSpy.mock.calls) {
      expect(String(url)).toStartWith("https://preview-test.invalid/rest/v1/");
    }
  });

  test("outside preview an empty catalogue remains an error and missing details remain null", async () => {
    delete process.env.MOVIETABLE_V0_PREVIEW;
    fetchSpy.mockImplementation(async () => Response.json([]));
    await expect(fetchCatalogue()).rejects.toThrow("The Supabase movies table returned no films");
    expect(await fetchFilmDetail("the-godfather")).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
