const CACHE = "wordvista-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(["./", "./index.html", "./manifest.webmanifest", "./levels/index.json", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"]);
      const res = await fetch("./levels/index.json");
      const index = await res.json();
      await cache.addAll(index.packs.map((p) => "./" + p.file));
      // Cache the hashed build assets (and the fonts the CSS references) so the first visit works offline.
      const html = await (await fetch("./")).text();
      const assets = [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map((m) => new URL(m[1], self.registration.scope).href);
      const fonts = [];
      for (const url of assets.filter((u) => u.endsWith(".css"))) {
        const css = await (await fetch(url)).text();
        for (const m of css.matchAll(/url\(([^)]+\.woff2)\)/g)) fonts.push(new URL(m[1].replace(/["']/g, ""), url).href);
      }
      await cache.addAll([...new Set([...assets, ...fonts])]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// Stale-while-revalidate for same-origin GET requests.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
