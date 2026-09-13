// Bump the version whenever offline.html changes. Updates wait for existing clients to close.
const CACHE_PREFIX = "movietable-offline-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const response = await fetch(OFFLINE_URL, { cache: "reload", credentials: "omit", redirect: "error" });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      throw new Error("The offline document could not be installed.");
    }
    const cache = await caches.open(CACHE_NAME);
    await cache.put(OFFLINE_URL, response);
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" || request.mode !== "navigate" ||
    url.origin !== self.location.origin ||
    /^\/(?:api|auth|_next)(?:\/|$)/.test(url.pathname) ||
    url.searchParams.has("code") || url.searchParams.has("token_hash") ||
    url.searchParams.has("_rsc") || request.headers.has("rsc") ||
    request.headers.has("next-action") || request.headers.has("authorization")
  ) return;

  event.respondWith((async () => {
    try {
      // Preserve real server errors and never cache normal documents or account data.
      return await fetch(request);
    } catch {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(OFFLINE_URL)) ?? Response.error();
    }
  })());
});
