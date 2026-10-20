# T17 — Top bar, preview, action buttons

**Goal:** the remaining game-screen controls.
**Read first:** `docs/02-visual-design.md` (§Game screen, §Component states, §Motion rows: Invalid, Too short, Bonus already, Coins added); `design/mockup.html` frame 3 (`topbar()`, `meterRing()`, the `.side` buttons).
**Depends on:** T16.

## Files
- create `src/ui/game/topBar.ts`
- create `src/ui/game/previewView.ts`
- create `src/ui/game/actionButtons.ts`
- edit `src/ui/screens/gameScreen.ts` (stub) to assemble the full layout

## Spec

### `topBar.ts`
```ts
export interface TopBarView { el: HTMLElement; coins: CoinPill; }
export function createTopBar(opts: { area: string; level: string; coins: number; onBack(): void }): TopBarView;
```
`<header class="topbar">` with `button.back` (`ICONS.back`, `aria-label="Back"`), `.title` (`.area`, `.level`) and a `CoinPill`.

### `previewView.ts`
```ts
export interface PreviewView {
  el: HTMLElement;                 // div.preview-row
  show(word: string): void;        // "" hides; otherwise one <span> per letter, adds .visible
  hide(): Promise<void>;           // fade out 150 ms, then clear text
  shake(): Promise<void>;          // add .bad, SHAKE_KEYFRAMES 320 ms, then hide(), remove .bad
  letterRects(): DOMRect[];        // rects of the letter spans
  rect(): DOMRect;                 // rect of the pill
}
export function createPreviewView(): PreviewView;
```
Calling `show()` while a hide/shake is running must immediately show the new word (cancel by bumping a counter and ignoring stale completions).

### `actionButtons.ts`
```ts
export interface ActionButtonsView {
  left: HTMLElement;   // div.side: bonus button over shuffle button
  right: HTMLElement;  // div.side: hint button over an empty 52px spacer
  setBonus(countThisLevel: number, meter: number, animate: boolean): void;
  setHintEnabled(enabled: boolean): void;
  bounceBonus(): Promise<void>;   // scale 1 → 1.25 → 1, 250 ms
  wiggleBonus(): Promise<void>;   // rotate 0 → -12 → 12 → 0 deg, 300 ms
  bonusRect(): DOMRect;
}
export function createActionButtons(cb: { onBonus(): void; onShuffle(): void; onHint(): void }): ActionButtonsView;
```
- Bonus button = `iconButton(ICONS.star, "Bonus words")` + meter ring SVG (as mockup `meterRing`, circle r=26 in a 58×58 viewBox) + `span.count-badge` (hidden when count is 0).
  Ring progress = `meter / BONUS_GOAL` via `stroke-dasharray = "${c * p} ${c}"`, `c = 2π·26`; when `animate`, set `style.transition = "stroke-dasharray 400ms ease"`.
- Shuffle = `iconButton(ICONS.shuffle, "Shuffle")`. Hint = `iconButton(ICONS.hint, "Hint")` + `span.badge` with `HINT_COST`.
- `setHintEnabled(false)` adds `.disabled` and `aria-disabled="true"`.

### Assemble in the `gameScreen.ts` stub
Order inside `.screen`: top bar, grid view, preview, `div.wheel-row` = `[actions.left, wheel.el, actions.right]`. Wire: wheel `onChange` → `preview.show`; `onSubmit` → if word length < 3 `preview.hide()` else `preview.shake()` (temporary); buttons log to console; back → home.

## Verify
```
npm run typecheck
npm run build
npm run dev
```
At `/?level=12` (390×844) the screen matches mockup frame 3 closely; at 320×568 nothing overlaps or scrolls. Preview follows the swipe; release shakes it. Buttons press visibly.

## Done when
Layout matches mockup and no console errors.
