# T20 — Effects & juice

**Goal:** the satisfying motion: letters flying into the grid, bonus words flying to the star, streak compliments.
**Read first:** `docs/02-visual-design.md` (§Motion: Found word, Bonus, Compliment); `docs/01-game-design.md` (§Streak compliments).
**Depends on:** T19.

## Files
- create `src/ui/game/effects.ts`
- edit `src/ui/game/handlers.ts` (found / bonus branches only)

## Spec — `effects.ts`
```ts
export function flyLetters(letters: string[], from: DOMRect[], to: DOMRect[]): Promise<void>;
export function flyToRect(text: string, from: DOMRect, to: DOMRect): Promise<void>;
export function showCompliment(parent: HTMLElement, text: string): Promise<void>;
```
- An fx layer: one `div.fx-layer` appended to `document.body` on first use (module-level singleton).
- `flyLetters`: if `reducedMotion()` resolve immediately. For each i: `div.fly-letter` with the letter, positioned `left/top/width/height` = `from[i]`, `fontSize = from[i].height * 0.7 px`. Animate `transform` from `translate(0px, 0px) scale(1)` to `translate(dx, dy) scale(s)`, where `dx/dy` = difference of rect centers and `s = to[i].width / from[i].width`; 350 ms, `ease-in-out`, `delay: i * 40`, `fill: "forwards"`. Remove each element when done. Resolve when all finish.
- `flyToRect`: one `div.fly-letter` sized like `from` showing the whole word (padding 0 12px, letter-spacing .12em, border-radius 14px). Animate to the center of `to` with `scale(0.3)` and `opacity 1 → 0.2`, 450 ms ease-in. Remove after.
- `showCompliment`: `div.compliment` with text appended to `parent`; animate `scale(.6)→scale(1.1)→scale(1)` 250 ms, wait 400 ms, then `translateY(-30px)` + `opacity 0` 500 ms; remove. If reduced motion, just show 600 ms then remove.

## Changes in `handlers.ts`
- `found`: **before** `preview.hide()`, capture `fromRects = preview.letterRects()` and `toRects = wordCells(level.words[wordIndex]).map(c => grid.cellRect(c.key))`. Hide the preview immediately (`preview.el` opacity handled by `hide()`), then `await flyLetters(letters, fromRects, toRects)`, then `await grid.fillWord(...)`.
  If `!result.completesLevel`, `text = complimentForStreak(state.streak)`; if not null → `void showCompliment(views.root, text)`.
- `bonus`: before hiding the preview, `void flyToRect(word, preview.rect(), actions.bonusRect()).then(() => actions.bounceBonus())` instead of calling `bounceBonus()` directly.

Flying letters should land exactly on their cells; filling starts after they land.

## Verify
```
npm run typecheck
npm run build
npm run dev
```
Play a few levels: letters fly into the right cells, bonus words fly to the star, "Good!/Great!" appear for streaks, nothing is left behind in the DOM (check `.fx-layer` is empty after animations). Toggle "Emulate prefers-reduced-motion" in DevTools Rendering: no flying, game still works.

## Done when
All animations behave as specified, no console errors.
