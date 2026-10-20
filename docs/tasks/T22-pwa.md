# T22 — PWA: manifest & offline

**Goal:** installable on a phone home screen and playable offline.
**Read first:** `docs/03-architecture.md` (§Build & deploy).
**Depends on:** T21.

## Files
- create `public/manifest.webmanifest`
- create `public/sw.js`
- edit `index.html` — add `<link rel="manifest" href="./manifest.webmanifest" />` after the apple-touch-icon link.
- edit `src/main.ts` — register the service worker (production only).

Icons already exist in `public/icons/` — do not modify them.

### `public/manifest.webmanifest` (exact)
```json
{
  "name": "Word Vista",
  "short_name": "Word Vista",
  "description": "Swipe letters, fill the crossword, relax.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1d1f2b",
  "theme_color": "#6c7bd0",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "icons/icon.svg", "sizes": "any", "type": "image/svg+xml" }
  ]
}
```

### `public/sw.js` (exact; plain JS, not processed by Vite)
```js
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
```
When levels change in a future release, bump `CACHE` (`wordvista-v2`).

### `src/main.ts` addition (end of `boot()`)
```ts
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((err) => console.warn("SW registration failed", err));
}
```

## Verify
```
npm run typecheck
npm run build
npm run preview
```
Open http://localhost:4173: DevTools → Application → Manifest shows name and icons with no errors; Service Workers shows `sw.js` activated. Check "Offline" in the Network tab, reload: the game loads and levels from any pack open.

## Done when
PWA checklist items in `docs/06-testing-and-qa.md` pass.
