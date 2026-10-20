# T12 — Themes & scene background

**Goal:** the generated landscape background and per-area accent color.
**Read first:** `docs/02-visual-design.md` (§Areas, §Skies, §Scene generation); `renderScene` and `ridge` in `design/mockup.html` `<script>`.
**Depends on:** T11.

## Files
- create `src/data/themes.ts`
- create `src/ui/scene.ts`
- edit `src/main.ts` (temporary scene preview; replaced in T14)

## Spec

### `src/data/themes.ts` (pure data, no DOM)
```ts
export type LayerShape = "hills" | "dunes" | "pines" | "water" | "mountains" | "mesas";
export interface AreaTheme {
  id: string; name: string; accent: string;
  shapes: [LayerShape, LayerShape, LayerShape];
  colors: [string, string, string];
}
export interface SkyTheme {
  top: string; bottom: string; body: "sun" | "moon"; bodyColor: string;
  x: number; y: number; r: number; darkness: number;
}
export const AREAS: Record<string, AreaTheme>;      // all 10 rows of the Areas table
export const SKIES: Record<TimeOfDay, SkyTheme>;   // all 4 rows of the Skies table
export function getAreaTheme(areaId: string): AreaTheme; // fallback: AREAS.meadow
```

### `src/ui/scene.ts`
```ts
export interface Scene {
  el: SVGSVGElement;
  show(pack: PackMeta): void;
}
export function createScene(): Scene;
export function renderScene(svg: SVGSVGElement, areaId: string, timeOfDay: TimeOfDay, seed: number): void;
```
- `renderScene`: TypeScript port of the mockup's `renderScene` + `ridge`, using `createRng` from core, `mix` from `ui/color`, `svgEl`/`clear` from `ui/dom`. Use a unique gradient id per call (e.g. `` `sky-${seed}-${timeOfDay}` ``).
- `createScene()`: creates `<svg class="scene" aria-hidden="true">`. `show(pack)`:
  - if `pack.id` equals the last shown id → return.
  - `renderScene(el, pack.areaId, pack.timeOfDay, pack.id)`.
  - `document.documentElement.style.setProperty("--accent", getAreaTheme(pack.areaId).accent)`.
  - update `<meta name="theme-color">` content to the sky `top` color.

### Temporary `src/main.ts`
Keep the CSS imports. Replace the boot text with: create the scene, append its `el` to `#app`, and cycle through 8 fake `PackMeta` objects (meadow dawn/day/dusk/night, then canyon, forest, lagoon, desert at day) every 1.5 s using `setInterval`, showing `areaId · timeOfDay` in a white label at the top. This is only for visual checking.

## Verify
```
npm run typecheck
npm run build
npm run dev
```
In the browser (390×844 viewport): every scene fills the screen with no gaps at any window size, layers sit at the bottom, night has stars and a moon, colors resemble `design/mockup.html` frames. No console errors.

## Done when
Build passes and the scene preview looks right.
