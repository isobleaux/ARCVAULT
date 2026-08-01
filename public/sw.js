/*
 * A deliberately small service worker.
 *
 * It exists to make the app installable and to keep the shell usable when the
 * connection drops. It never caches API responses or meal photos: a stale
 * calorie total is worse than no calorie total.
 */
const CACHE = "macrosnap-shell-v1";
const SHELL = ["/", "/offline", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Diary data must always be live.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) return;

  // Network-first for pages so you never read yesterday's numbers.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(request)) ?? (await cache.match("/offline")) ?? Response.error();
      }),
    );
    return;
  }

  // Cache-first for immutable build assets.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
