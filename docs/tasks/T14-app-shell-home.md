# T14 — App shell, router, overlay base, Home screen

**Goal:** the real app boot: load levels + save, persistent scene, screen router, overlays host, and the Home screen.
**Read first:** `docs/03-architecture.md` (§Runtime flow, §App context, §View module pattern); `docs/02-visual-design.md` (§Home screen, §Overlays first paragraph); `design/mockup.html` frame 1.
**Depends on:** T07, T09, T12, T13.

## Files
- create `src/ui/appTypes.ts`
- create `src/ui/app.ts`
- create `src/ui/coinPill.ts`
- create `src/ui/overlays/overlay.ts`
- create `src/ui/screens/homeScreen.ts`
- create `src/ui/screens/gameScreen.ts` — **temporary stub** (grown in T15–T17, finished in T19)
- create `src/ui/screens/mapScreen.ts` — **temporary stub** (finished in T21)
- replace `src/main.ts`

Stubs are allowed **only** for the two files marked above.

## Spec

### `src/ui/appTypes.ts`
Copy `Route`, `Screen`, `AppContext` from docs/03 §App context (types only, use `import type`).

### `src/ui/app.ts`
```ts
export function createApp(root: HTMLElement, deps: { index: LevelIndex; repo: LevelRepo; save: SaveData }): AppContext;
```
- `clear(root)`; append `scene.el`, `div.screen-host`, `div.overlay-host` in that order.
- `sfx = createSfx(save.settings.sound)`; on the first `pointerdown` or `keydown` on `window` call `sfx.unlock()` (listeners with `{ once: true }`).
- `getSave()` returns the in-memory save; `setSave(next)` replaces it and calls `writeSave(next)`.
- `navigate(route)`: remove all children of overlay-host; `current?.destroy()`; remove old `el`; build the new screen:
  `home → createHomeScreen(ctx)`, `map → createMapScreen(ctx)`, `game → createGameScreen(ctx, route.levelId)`;
  append to screen-host; fade in with `play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 })`.

### `src/ui/coinPill.ts`
```ts
export interface CoinPill { el: HTMLElement; set(coins: number, animate?: boolean): void; shake(): Promise<void>; rect(): DOMRect; }
export function createCoinPill(coins: number): CoinPill;
```
Markup `<div class="coin-pill"><span class="coin"></span><span class="coin-count">125</span></div>`.
`set(n, true)`: pulse `scale 1→1.2→1` (250 ms) and count up the number over 400 ms with `requestAnimationFrame`. `shake()` uses `SHAKE_KEYFRAMES` (320 ms).

### `src/ui/overlays/overlay.ts`
```ts
export interface OverlayHandle { el: HTMLElement; close(): Promise<void>; }
export function openOverlay(host: HTMLElement, card: HTMLElement,
  opts?: { dismissOnScrim?: boolean; onClose?: () => void }): OverlayHandle;
```
Wrap `card` (should have class `card`) in `div.scrim`, append to host. Animate scrim opacity 0→1 (200 ms) and card `translateY(40px)/opacity 0 → none/1` (300 ms, `var(--ease-pop)` → use `"cubic-bezier(0.34, 1.56, 0.64, 1)"`). `close()` fades out (150 ms), removes, calls `onClose` once; calling it twice is safe. If `dismissOnScrim`, a click whose `target === scrim` closes.

### `src/ui/screens/homeScreen.ts`
```ts
export function createHomeScreen(ctx: AppContext): Screen;
```
Layout like mockup frame 1 (classes `screen home`, `.top`, `.logo`, `.pack-label`, `.play-btn`, `.bottom`):
- `save = ctx.getSave()`; `allDone = save.currentLevel > ctx.index.totalLevels`; `levelId = Math.min(save.currentLevel, ctx.index.totalLevels)`; `pack = packForLevel(index, levelId)`; `ctx.scene.show(pack)`.
- Logo: `WORD` + tiles `V I S T A` (from `APP_NAME`).
- Pack label: `` `${pack.areaName} · ${pack.packName}`.toUpperCase() ``.
- Play button: `PLAY` + `<small>LEVEL n</small>`; click → `navigate({ name: "game", levelId })`. If `allDone`, show `<div class="all-done">All levels complete!</div>` above and the button text `LEVELS` → navigate to map.
- Bottom: `iconButton(ICONS.map, "Levels")` → map; `iconButton(ICONS.gear, "Settings")` with class `round-btn disabled` (enabled in T18).
- Coin pill top-right.

### Stubs
- `gameScreen.ts`: `export function createGameScreen(ctx: AppContext, levelId: number): Screen` → a `.screen` with a top bar `button.back` (→ home) and text `Level ${levelId}`.
- `mapScreen.ts`: `export function createMapScreen(ctx: AppContext): Screen` → a `.screen` with a back button (→ home) and text `Levels`.

### `src/main.ts` (final structure; T22 adds service worker registration)
```ts
// CSS imports from T10 stay at the top
import { createLevelRepo } from "./data/levelRepo";
import { clearSave, loadSave } from "./data/storage";
import { createApp } from "./ui/app";
import type { LevelIndex } from "./core/types";

async function boot(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app missing");
  const params = new URLSearchParams(location.search);
  if (import.meta.env.DEV && params.has("reset")) clearSave();
  const repo = createLevelRepo(import.meta.env.BASE_URL);
  let index: LevelIndex;
  try {
    index = await repo.getIndex();
  } catch (err) {
    console.error(err);
    root.textContent = "Could not load levels. Please reload.";
    return;
  }
  const app = createApp(root, { index, repo, save: loadSave() });
  const devLevel = Number(params.get("level"));
  if (import.meta.env.DEV && devLevel >= 1 && devLevel <= index.totalLevels) {
    app.navigate({ name: "game", levelId: devLevel });
  } else {
    app.navigate({ name: "home" });
  }
}

void boot();
```

## Verify
```
npm run typecheck
npm test
npm run build
npm run dev
```
Browser at 390×844: Home looks like mockup frame 1 but with the Meadow · Dawn scene, `LEVEL 1`, 100 coins. PLAY opens the stub and back returns. Map button opens the map stub. `?level=301` opens the game stub for level 301. No console errors.

## Done when
All of the above works.
