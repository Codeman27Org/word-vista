# T16 — Letter wheel

**Goal:** the swipe-to-spell letter wheel with pointer + keyboard input. This is the most important interaction in the game: get it smooth.
**Read first:** `docs/01-game-design.md` (§Making a word, §Desktop keyboard support); `docs/02-visual-design.md` (§Game screen "Wheel", §Motion "Shuffle"); mockup `wheelHtml()`.
**Depends on:** T15.

## Files
- create `src/ui/game/wheelView.ts`
- edit `src/ui/screens/gameScreen.ts` (stub) to mount the wheel for checking

## Spec
```ts
export interface WheelOptions {
  letters: string[];
  onChange(word: string): void;   // called whenever the selection changes ("" when cleared)
  onSubmit(word: string): void;   // called on release / Enter with the selected word (may be short)
  onSelect?(count: number): void; // called when a letter is ADDED (for the rising blip sound)
  onShuffleKey?(): void;          // Space key
}
export interface WheelView {
  el: HTMLElement;                // div.wheel
  setLetters(letters: string[], animate: boolean): void;
  setEnabled(enabled: boolean): void;
  cancel(): void;                 // clear selection without submitting (calls onChange(""))
  letterRects(indexes: number[]): DOMRect[];
  destroy(): void;
}
export function createWheelView(opts: WheelOptions): WheelView;
```

### Structure
```html
<div class="wheel" role="group" aria-label="Letter wheel" style="width:Dpx;height:Dpx">
  <svg><polyline class="line"/></svg>
  <div class="letter" data-i="0">P</div> …
</div>
```

### Geometry
- `D = Math.round(Math.min(Math.min(innerWidth, 480) * 0.70, 300, innerHeight * 0.36))`.
- `n = letters.length`; `ring = D/2 * (n <= 3 ? 0.6 : 0.68)`; center of letter i: angle `a = -π/2 + i·2π/n` → `(D/2 + ring·cos a, D/2 + ring·sin a)`.
- `hit = Math.min(D * 0.14, 0.9 * ring * Math.sin(Math.PI / n))`; letter element `width = height = 2·hit`, `left/top = center` (CSS translates -50%), `fontSize = D * 0.17`.
- Polyline `stroke-width = D * 0.035`.
- Recompute on `window` `resize` (remove listener in `destroy`).

### State
`selected: number[]` (wheel indexes), `activePointer: number | null`, `pointer: {x, y} | null`, `enabled = true`.

### Pointer input (listeners on `el`; `el.style.touchAction = "none"`)
- `local(e)`: `rect = el.getBoundingClientRect()` → `{ x: e.clientX - rect.left, y: e.clientY - rect.top }`.
- `hitTest(p)`: index of the closest letter whose center is within `hit` px, else `-1`.
- `pointerdown`: ignore if disabled or a pointer is already active. `i = hitTest`; if `-1` ignore. `e.preventDefault()`, `el.setPointerCapture(e.pointerId)`, `activePointer = e.pointerId`, `selected = [i]`, `onSelect(1)`, update.
- `pointermove` (only for `activePointer`): `pointer = local(e)`; `i = hitTest(pointer)`; if `i >= 0`:
  - `i` not selected → push, `onSelect(selected.length)`.
  - `selected.length >= 2 && i === selected[selected.length - 2]` → pop (backtrack).
  Then update.
- `pointerup` (active pointer): `word` = selected letters joined; reset state; update; `onSubmit(word)`.
- `pointercancel` / `lostpointercapture` while active: reset state; update (no submit).
- `update()`: toggle `.selected` on letters; polyline points = centers of selected + `pointer` (if dragging); call `onChange(word)` if the word changed.

### Keyboard (listener on `window` `keydown`; ignore when disabled, when `e.ctrlKey || e.metaKey || e.altKey`, or when a pointer drag is active)
- `/^[a-z]$/i` → first index `i` with `letters[i] === key.toUpperCase()` and not selected → push, `onSelect`, update.
- `Backspace` → pop; `Escape` → clear; `Enter` → if selected, submit like `pointerup`; `" "` → `e.preventDefault()`, `onShuffleKey?.()`.

### `setLetters(newLetters, animate)`
- Cancel any selection first.
- Reuse the letter elements: for each new index j, take the first unused old element with the same letter; assign `data-i = j`. Reorder the internal elements array accordingly.
- If `animate` and not reduced motion: set `style.transition = "left 300ms ease-in-out, top 300ms ease-in-out"` before moving, then clear it after 320 ms. Then set new `left/top`.
- If the letter count changed, rebuild all elements.

### `setEnabled(false)` cancels any selection and ignores input; `letterRects` returns each letter element's `getBoundingClientRect()`.

## Temporary check in `gameScreen.ts`
Add a `div.wheel-row` with empty `.side` divs left/right and the wheel in the middle; log `onChange`/`onSubmit` to the console; `onSelect` → `ctx.sfx.select(count - 1)`; `onShuffleKey` → shuffle the letters with `shuffle([...letters], createRng(Date.now()))` and `setLetters(…, true)`.

## Verify
```
npm run typecheck
npm run build
npm run dev
```
At `/?level=12`, mouse and touch (DevTools device mode): swipe draws a line, letters highlight, backtracking works, release logs the word, duplicate letters work (try a level with duplicates), Space animates a shuffle, typing letters + Enter logs a word, page never scrolls while swiping.

## Done when
All checks pass with no console errors.
