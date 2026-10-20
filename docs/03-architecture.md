# 03 — Architecture

## Stack (do not add other packages)

| Purpose | Choice |
|---|---|
| Language | TypeScript 5.6, `strict: true` |
| Build/dev server | Vite 5 |
| Tests | Vitest 2 (node environment; only pure logic is unit-tested) |
| Scripts | `tsx` to run TypeScript tools (level generator) |
| UI | Plain DOM + inline SVG + CSS. **No React/Vue/Svelte, no canvas, no game engine.** |
| Font | `@fontsource/nunito` (weights 800, 900) |
| Offline | `public/manifest.webmanifest` + hand-written `public/sw.js` |
| Persistence | `localStorage` |

## Folder tree (final state; every file and its job)

```
AGENTS.md                      rules for the coding agent (always loaded)
README.md                      human overview, how to run, how to drive Qwen
CREDITS.md                     word list + font licenses
package.json  tsconfig.json  vite.config.ts  index.html  .gitignore
design/mockup.html             visual reference (not shipped)
docs/                          specs + tasks (not shipped)
data/raw/                      downloaded sources (gitignored)
data/words/answers.tsv         generator input: common words + tier   (prebuilt)
data/words/valid.txt           generator input: all valid words       (prebuilt)
tools/wordlists/build-wordlists.mjs   rebuilds data/words (prebuilt, rarely run)
tools/levelgen/
  config.ts                    tiers, areas, seed, output paths
  words.ts                     load word lists; canMake(); lettersKey()
  layout.ts                    crossword placement algorithm (pure)
  validate.ts                  validateLevel() + CLI that checks public/levels
  generate.ts                  CLI: builds all levels → public/levels/*.json
public/
  levels/index.json, levels/pack-001.json … pack-040.json   (generated, committed)
  icons/icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png   (prebuilt)
  manifest.webmanifest, sw.js
src/
  main.ts                      entry: imports CSS, boots App, registers SW in prod
  core/                        PURE logic (no DOM, no storage, no Math.random)
    types.ts  constants.ts     shared contracts (docs/04)
    rng.ts                     createRng, randInt, shuffle
    letters.ts                 canMake, normalizeWord
    grid.ts                    cellKey, wordCells, buildCells, filledKeys
    game.ts                    createLevelState, submitWord, applyHint, shuffleWheel, isLevelComplete, toProgress
    economy.ts                 createNewSave, spendCoins, recordBonusWord, completeLevel, packForLevel, isLevelUnlocked, complimentForStreak
  data/
    storage.ts                 loadSave, writeSave, clearSave (validates + clamps)
    levelRepo.ts               fetch + cache index.json and pack files
    themes.ts                  AREAS, SKIES, getAreaTheme
  ui/
    dom.ts                     el() helper, clear(), animate helpers, reducedMotion()
    icons.ts                   inline SVG icon strings (from mockup)
    color.ts                   hexToRgb, rgbToHex, mix
    scene.ts                   createScene(): persistent background, show(pack)
    sfx.ts                     createSfx(): synthesized sounds
    appTypes.ts                Route, Screen, AppContext interfaces (no logic; avoids import cycles)
    app.ts                     createApp(): router (home | map | game) + overlay host
    coinPill.ts                coin counter pill (home + top bar)
    screens/homeScreen.ts
    screens/mapScreen.ts
    screens/gameScreen.ts      builds the game layout and wires events to handlers
    game/topBar.ts             back button, title, coin pill
    game/gridView.ts           renders cells, fill/reveal/flash/celebrate animations
    game/wheelView.ts          letter wheel, pointer + keyboard input, swipe line
    game/previewView.ts        word preview pill
    game/actionButtons.ts      bonus, shuffle, hint buttons
    game/effects.ts            flyLetters, flyToButton, showCompliment
    game/handlers.ts           onSubmit, onHint, onShuffle, finishLevel (uses core + views)
    overlays/overlay.ts        openOverlay(content) → { close() }
    overlays/levelComplete.ts
    overlays/bonusSheet.ts
    overlays/settingsSheet.ts
  styles/
    tokens.css  base.css  game.css  screens.css  overlays.css
tests/
  core/*.test.ts  data/*.test.ts  levelgen/*.test.ts  ui/color.test.ts  fixtures/level12.ts  levels.test.ts
```

## Layering rules

```
ui/*  ──▶  data/*  ──▶  core/*
  └──────────────────▶  core/*
tools/levelgen/*  ──▶  core/* (types, rng, letters, grid only)
```
- `core` imports nothing outside `core`.
- `data` may use `fetch` and `Storage` but gets them as parameters (for tests).
- Only `ui` touches the DOM. Only `ui/sfx.ts` touches Web Audio.
- Randomness: core functions take an `Rng`. UI passes `createRng(Date.now())` style RNGs or a shared one.

## Runtime flow

```
main.ts
  ├─ import "@fontsource/nunito/800.css", ".../900.css", all styles
  ├─ repo = createLevelRepo(import.meta.env.BASE_URL)
  ├─ index = await repo.getIndex()
  ├─ save = loadSave()
  ├─ app = createApp(document.getElementById("app")!, { index, repo, save })
  ├─ app.navigate({ name: "home" })
  └─ if (import.meta.env.PROD && "serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js")
```

### App context (`src/ui/appTypes.ts`; implemented by `createApp` in `src/ui/app.ts`)

```ts
export type Route = { name: "home" } | { name: "map" } | { name: "game"; levelId: number };

export interface Screen {
  el: HTMLElement;
  destroy(): void; // remove listeners, observers, timers
}

export interface AppContext {
  index: LevelIndex;
  repo: LevelRepo;
  getSave(): SaveData;
  setSave(next: SaveData): void; // stores in memory AND calls writeSave()
  navigate(route: Route): void; // destroys current screen, mounts the new one, fades in
  scene: Scene; // persistent background
  sfx: Sfx;
  overlayHost: HTMLElement; // overlays are appended here (above screens)
}

export function createApp(root: HTMLElement, deps: { index: LevelIndex; repo: LevelRepo; save: SaveData }): AppContext;
```

DOM structure created by `createApp`:
```html
<div id="app">
  <svg class="scene">…</svg>           <!-- Scene -->
  <div class="screen-host"></div>        <!-- current Screen.el -->
  <div class="overlay-host"></div>       <!-- overlays -->
</div>
```

### Game screen event flow

```
wheelView ── onChange(word) ──▶ previewView.show(word); sfx.select(len-1)
wheelView ── onSubmit(word) ──▶ handlers.onSubmit(session, word)
   result = submitWord(state, word)
   found        → effects.flyLetters → gridView.fillWord(i) for i and autoFound; compliment; sfx.found
   alreadyFound → gridView.flashWord(i)
   bonus        → effects.flyToButton(preview → bonus) ; save = recordBonusWord(save) ; actions.setBonus(...)
   bonusAlready → actions.wiggleBonus()
   invalid      → previewView.shake()
   tooShort     → previewView.hide()
   then persist(session); if completesLevel → finishLevel(session)
actionButtons ── onShuffle ──▶ handlers.onShuffle → state = shuffleWheel(); wheelView.setLetters(state.wheel, true)
actionButtons ── onHint ─────▶ handlers.onHint → spendCoins → applyHint → gridView.revealCell + fill autoFound
actionButtons ── onBonus ────▶ open bonusSheet
topBar ── onBack ───────────▶ app.navigate({ name: "home" })
finishLevel → wheel disabled → gridView.celebrate() → completeLevel(save) → levelComplete overlay → NEXT → navigate(game next)
```

`GameSession` (in `ui/game/handlers.ts`):
```ts
export interface GameSession {
  ctx: AppContext;
  pack: PackMeta;
  state: LevelState;
  isReplay: boolean; // levelId < save.currentLevel
  rng: Rng;
  views: {
    topBar: TopBarView;
    grid: GridView;
    preview: PreviewView;
    wheel: WheelView;
    actions: ActionButtonsView;
    root: HTMLElement; // the game screen element (for compliments)
  };
  busy: boolean; // true during level-complete sequence; ignore input
}
```
`persist(session)`: if not replay, `ctx.setSave({ ...save, inProgress: toProgress(state) })`.

## View module pattern

Every view is a factory function returning an object with `el` and methods. No classes required. Example:
```ts
export interface PreviewView {
  el: HTMLElement;
  show(word: string): void;
  hide(): void;
  shake(): Promise<void>;
  getRect(): DOMRect;
}
export function createPreviewView(): PreviewView { … }
```
Views never import `core/game.ts` or `data/*`; they receive data and callbacks. `handlers.ts` and screens connect things.

## Build & deploy
- `npm run build` → static files in `dist/`. Host anywhere (GitHub Pages, Netlify, any static server). `base: "./"` makes paths relative.
- Install on phone: open the site in Chrome/Safari → "Add to Home screen". Works offline after first load.
