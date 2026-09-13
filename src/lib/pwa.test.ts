import { describe, expect, mock, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { resolve } from "node:path";

const publicDir = resolve(import.meta.dir, "../../public");
const source = readFileSync(resolve(publicDir, "sw.js"), "utf8");
const cacheName = "movietable-offline-v1";
const offline = () => new Response("offline", { headers: { "content-type": "text/html" } });
type WorkerEvent = { request?: object; waitUntil: (promise: Promise<unknown>) => void; respondWith: (promise: Promise<Response>) => void };

function worker() {
  const handlers: Record<string, (event: WorkerEvent) => void> = {};
  const stores = new Map<string, Map<string, Response>>();
  const fetch = mock(async (_request: unknown, _options?: unknown): Promise<Response> => offline());
  const claim = mock(async () => undefined);
  const skipWaiting = mock(() => undefined);
  runInNewContext(source, {
    URL, Response,
    fetch,
    self: { location: { origin: "https://movies.example" }, clients: { claim }, skipWaiting, addEventListener: (name: string, handler: (event: WorkerEvent) => void) => { handlers[name] = handler; } },
    caches: {
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
      open: async (name: string) => {
        if (!stores.has(name)) stores.set(name, new Map());
        const entries = stores.get(name)!;
        return { put: async (url: string, response: Response) => { entries.set(url, response); }, match: async (url: string) => entries.get(url)?.clone() };
      },
    },
  });
  function dispatch(name: string, request?: object) {
    let result: Promise<Response> | undefined;
    let pending: Promise<unknown> = Promise.resolve();
    handlers[name]!({ request, waitUntil: (promise) => { pending = promise; }, respondWith: (promise) => { result = promise; } });
    return { result, pending };
  }
  return { dispatch, fetch, stores, claim, skipWaiting };
}

function navigation(path = "/", overrides: object = {}) {
  return { url: new URL(path, "https://movies.example").href, method: "GET", mode: "navigate", headers: new Headers(), ...overrides };
}

describe("MovieTable install identity", () => {
  test("manifest has a stable root identity and separate maskable artwork", () => {
    const manifest = JSON.parse(readFileSync(resolve(publicDir, "manifest.json"), "utf8"));
    expect(manifest).toMatchObject({ id: "/", name: "MovieTable", short_name: "MovieTable", start_url: "/", scope: "/", display: "standalone" });
    expect(manifest.orientation).toBeUndefined();
    expect(manifest.icons.filter((icon: { purpose: string }) => icon.purpose === "any")).toHaveLength(2);
    expect(manifest.icons.find((icon: { purpose: string }) => icon.purpose === "maskable").src).toBe("/icon-maskable-512.png");
    for (const icon of manifest.icons) expect(existsSync(resolve(publicDir, icon.src.slice(1)))).toBe(true);
    expect(existsSync(resolve(publicDir, "apple-touch-icon.png"))).toBe(true);
  });
});

describe("offline worker", () => {
  test("precaches only the offline page without credentials and does not force activation", async () => {
    const w = worker();
    await w.dispatch("install").pending;
    expect(w.fetch).toHaveBeenCalledWith("/offline.html", { cache: "reload", credentials: "omit", redirect: "error" });
    expect([...w.stores.get(cacheName)!.keys()]).toEqual(["/offline.html"]);
    expect(w.skipWaiting).not.toHaveBeenCalled();
  });

  test("installation fails when the offline document is unavailable", async () => {
    const w = worker();
    w.fetch.mockImplementation(async () => new Response("Unavailable", { status: 503 }));
    await expect(w.dispatch("install").pending).rejects.toThrow();
    expect(w.stores.size).toBe(0);
  });

  test("activation removes only obsolete owned caches and claims clients", async () => {
    const w = worker();
    w.stores.set("movietable-offline-v0", new Map());
    w.stores.set("another-app-cache", new Map());
    await w.dispatch("install").pending;
    await w.dispatch("activate").pending;
    expect([...w.stores.keys()].sort()).toEqual(["another-app-cache", cacheName].sort());
    expect(w.claim).toHaveBeenCalledTimes(1);
  });

  test("successful navigation and HTTP errors are returned without caching", async () => {
    for (const status of [200, 401, 404, 500]) {
      const w = worker();
      const response = new Response("network document", { status });
      w.fetch.mockImplementation(async () => response);
      expect(await w.dispatch("fetch", navigation()).result).toBe(response);
      expect(w.stores.size).toBe(0);
    }
  });

  test("failed document navigation uses only the precached fallback", async () => {
    const w = worker();
    await w.dispatch("install").pending;
    w.fetch.mockImplementation(async () => { throw new TypeError("offline"); });
    const response = await w.dispatch("fetch", navigation("/?search=alien")).result;
    expect(await response?.text()).toBe("offline");
    expect([...w.stores.get(cacheName)!.keys()]).toEqual(["/offline.html"]);
  });

  test("missing fallback returns a network error instead of cached private content", async () => {
    const w = worker();
    w.fetch.mockImplementation(async () => { throw new TypeError("offline"); });
    expect((await w.dispatch("fetch", navigation()).result)?.type).toBe("error");
  });

  test("bypasses APIs, auth callbacks, RSC, mutations, assets and cross-origin traffic", () => {
    const w = worker();
    const requests = [
      navigation("/api/movies"), navigation("/auth/callback"), navigation("/_next/static/chunk.js"),
      navigation("/?code=private-code"), navigation("/?token_hash=private-token"), navigation("/?_rsc=1"),
      navigation("/", { headers: new Headers({ rsc: "1" }) }),
      navigation("/", { headers: new Headers({ "next-action": "action-id" }) }),
      navigation("/", { headers: new Headers({ authorization: "Bearer test" }) }),
      navigation("/", { method: "POST" }), navigation("/api/ratings", { method: "DELETE" }),
      navigation("/logo192.png", { mode: "no-cors" }),
      navigation("/", { mode: "cors" }), navigation("https://accounts.example/auth"),
    ];
    for (const request of requests) expect(w.dispatch("fetch", request).result).toBeUndefined();
    expect(w.fetch).not.toHaveBeenCalled();
    expect(w.stores.size).toBe(0);
  });
});
