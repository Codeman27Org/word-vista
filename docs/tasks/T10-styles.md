# T10 — Styles

**Goal:** all CSS for the app, ported from the mockup, plus base/page rules.
**Read first:** `docs/02-visual-design.md` (§Design tokens, §Screen layouts, §Component states); the `<style>` block in `design/mockup.html`.
**Depends on:** T01. (Pure CSS; no TS changes except imports in main.ts.)

## Files
- create `src/styles/tokens.css` — the exact `:root` block from docs/02 §Design tokens.
- create `src/styles/base.css`
- create `src/styles/game.css`
- create `src/styles/screens.css`
- create `src/styles/overlays.css`
- edit `src/main.ts` — add CSS imports at the top (keep the temporary boot text):
```ts
import "@fontsource/nunito/800.css";
import "@fontsource/nunito/900.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/game.css";
import "./styles/screens.css";
import "./styles/overlays.css";
```

## What goes where
Copy rules from the mockup `<style>` block, **excluding** mockup-only rules: `body` padding/background, `h1.page`, `p.page`, `.frames`, `.frame-label`, `.phone`, and the mockup's `.screen` and `.scene` rules (`base.css` below defines its own).

### `base.css`
```css
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; overflow: hidden; overscroll-behavior: none; }
body { font-family: var(--font); color: var(--ink); background: #1d1f2b; -webkit-tap-highlight-color: transparent; }
button { font-family: inherit; }
#app { position: fixed; inset: 0; }
.scene { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.screen-host { position: absolute; inset: 0; display: flex; justify-content: center; }
.screen { position: relative; width: 100%; max-width: 480px; height: 100%; display: flex; flex-direction: column;
          padding: var(--safe-top) 0 var(--safe-bottom); user-select: none; -webkit-user-select: none; }
.overlay-host { position: absolute; inset: 0; pointer-events: none; }
.overlay-host > * { pointer-events: auto; }
.fx-layer { position: fixed; inset: 0; pointer-events: none; z-index: 50; }
.fly-letter { position: fixed; display: grid; place-items: center; font-weight: 900; color: #fff;
              background: var(--accent); border-radius: 8px; will-change: transform; }
.hidden { display: none !important; }
```
Plus from the mockup: `.icon`, `.round-btn`, `.badge`, `.count-badge`, `.meter-ring`, `.coin-pill`, `.coin`, `.pill-btn`, `.pill-btn.secondary`.
Add: `.round-btn:active, .pill-btn:active { transform: translateY(2px); }` and `.round-btn.disabled { opacity: .45; pointer-events: none; }`.

### `game.css`
From the mockup: `.topbar` (+ `.back`), `.title`, `.grid-area`, `.grid`, `.cell`, `.cell.filled`, `.cell.hinted`, `.preview-row`, `.preview`, `.wheel-row`, `.side`, `.wheel`, `.wheel svg`, `.wheel .line`, `.letter`, `.letter.selected`, `.compliment`.
Changes:
- `.preview` starts with `opacity: 0; transition: opacity .15s;` and `.preview.visible { opacity: 1; }`; `.preview.bad { background: var(--danger); box-shadow: 0 4px 0 #a32c30, var(--shadow-2); }`.
- `.letter { transition: background .1s, color .1s; }` (left/top transitions are set inline during shuffle).
- `.compliment { position: absolute; z-index: 20; }`.
- `.topbar .back` is a `<button>`: add `cursor: pointer; border: 0;`.

### `screens.css`
From the mockup: `.home`, `.home .top`, `.logo` (+ `.w1`, `.tiles`, `.tiles span`), `.home .pack-label`, `.play-btn` (+ `small`), `.home .bottom`, `.map-list`, `.area-card` (+ `h3`, `h3 small`), `.pack-row` (+ children, `.locked`), `.bar`, `.bar i`, `.levels`, `.lvl` (+ `.done`, `.current`, `.locked`).
Changes: `.map-list { overflow-y: auto; padding-bottom: 24px; }`, `.pack-row { cursor: pointer; }`, `.lvl.done, .lvl.current { cursor: pointer; }`, and add `.home .all-done { color:#fff; font-weight:900; font-size:20px; text-shadow:0 2px 6px rgba(0,0,0,.4); }`.

### `overlays.css`
From the mockup: `.scrim`, `.card` (+ `.big`, `.sub`), `.reward`, `.reward-note`, `.found-list`, `.chip`.
Add:
```css
.scrim { position: absolute; inset: 0; z-index: 30; }
.card h2 { margin: 0 0 12px; font-size: 18px; font-weight: 900; letter-spacing: .12em; }
.card .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 4px; font-weight: 800; }
.card .danger { color: var(--danger); background: none; border: 0; font: inherit; font-weight: 900; cursor: pointer; }
.card .credits { font-size: 12px; color: var(--ink-soft); margin-top: 16px; line-height: 1.4; }
.card .bar { margin: 8px 0 4px; height: 10px; }
.card .actions { margin-top: 20px; display: flex; gap: 10px; justify-content: center; }
.toggle { width: 52px; height: 30px; border-radius: 15px; border: 0; background: rgba(0,0,0,.15); position: relative; cursor: pointer; }
.toggle::after { content: ""; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: left .15s; }
.toggle.on { background: var(--accent); }
.toggle.on::after { left: 25px; }
```

## Verify
```
npm run typecheck
npm run build
```
`npm run dev` loads with the Nunito font and dark background, no console errors.

## Done when
Build passes and all class names above exist in the CSS files.
