# T11 — UI helpers: dom, icons, color

**Goal:** small shared helpers so view code stays short.
**Read first:** `docs/02-visual-design.md` (§Motion, last paragraph about reduced motion); the `ICONS` object and `mix`/`hexToRgb`/`rgbToHex` in `design/mockup.html`.
**Depends on:** T10.

## Files
- create `src/ui/dom.ts`
- create `src/ui/icons.ts`
- create `src/ui/color.ts`
- create `tests/ui/color.test.ts`

## Spec

### `src/ui/dom.ts`
```ts
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K];
export function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs?: Record<string, string | number>): SVGElementTagNameMap[K];
export function clear(node: Element): void;                     // remove all children
export function reducedMotion(): boolean;                       // matchMedia('(prefers-reduced-motion: reduce)').matches
export function wait(ms: number): Promise<void>;
export function play(target: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Promise<void>;
export function iconButton(iconSvg: string, label: string, className?: string): HTMLButtonElement;
export const SHAKE_KEYFRAMES: Keyframe[];
```
- `svgEl` uses `document.createElementNS("http://www.w3.org/2000/svg", tag)` and sets each attr with `setAttribute(k, String(v))`.
- `play`: if `reducedMotion()` → use `duration: 0`. Call `target.animate(keyframes, { fill: "none", ...options })` and resolve on `animation.finished` (catch rejection from cancel and resolve anyway).
- `iconButton`: `<button type="button" class="round-btn" aria-label="…">` with `innerHTML = iconSvg`. Default className `"round-btn"`.
- `SHAKE_KEYFRAMES`: translateX `0, -10px, 10px, -8px, 8px, -4px, 4px, 0`.

### `src/ui/icons.ts`
```ts
export const ICONS: { back: string; shuffle: string; hint: string; star: string; gear: string; map: string; lock: string; check: string; close: string; };
```
Copy `back, shuffle, hint, star, gear, map, lock` strings from the mockup. Add:
- `check`: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`
- `close`: `<svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`

### `src/ui/color.ts`
```ts
export function hexToRgb(hex: string): [number, number, number];
export function rgbToHex(rgb: readonly number[]): string;   // rounds and clamps 0..255, lowercase "#rrggbb"
export function mix(a: string, b: string, t: number): string;
```

## Tests — `tests/ui/color.test.ts`
(These run in node; `color.ts` must not touch the DOM.)
- `hexToRgb("#ff8000")` → `[255, 128, 0]`.
- `rgbToHex([255, 128, 0])` → `"#ff8000"`; `rgbToHex([300, -5, 12.6])` → `"#ff000d"`.
- `mix("#000000", "#ffffff", 0.5)` → `"#808080"`; `t = 0` returns a; `t = 1` returns b.

## Verify
```
npm run typecheck
npm test
npm run build
```

## Done when
All pass.
