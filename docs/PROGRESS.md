# Build Progress

Work top to bottom. Tick `[x]` and add a short note when a task's Verify steps all pass.

- [x] T01 — Project scaffold: package.json, tsconfig.json, vite.config.ts, index.html, .gitignore, src/main.ts, tests/smoke.test.ts — typecheck, test, build all pass
- [x] T02 — Core contracts: types & constants — created src/core/types.ts and src/core/constants.ts verbatim from doc; typecheck + tests pass
- [x] T03 — RNG & letter helpers — created rng.ts (mulberry32, randInt, shuffle, pick) and letters.ts (normalizeWord, countLetters, canMake, sameLetters) with tests; smoke test removed
- [x] T04 — Grid model + test fixture (grid.ts: cellKey, parseKey, wordCells, buildCells, filledKeys, isWordFilled; LEVEL12 fixture; 9 tests) (`docs/tasks/T04-grid-model.md`)
- [x] T05 — Game rules (7 functions, 15 tests) (`docs/tasks/T05-game-rules.md`)
- [x] T06 — Economy & progression (`docs/tasks/T06-economy.md`)
- [x] T07 — Storage & level repository (storage.ts, levelRepo.ts, tests — 81 tests pass) (`docs/tasks/T07-storage-repo.md`)
- [x] T08 — Level generator: words & layout (tests pass, typecheck clean)
- [x] T09 — Level generator: validate & generate 600 levels (600/600, all tests pass, 41 files)
- [x] T10 — Styles (`docs/tasks/T10-styles.md`) — created tokens.css, base.css, game.css, screens.css, overlays.css; added CSS imports in main.ts; typecheck + build pass
- [x] T11 — UI helpers: dom, icons, color (`docs/tasks/T11-ui-helpers.md`)
- [x] T12 — Themes & scene background — created src/data/themes.ts (10 areas, 4 skies, layer constants), src/ui/scene.ts (Scene interface, createScene, renderScene with ridge shapes), edited src/main.ts (scene preview cycling 8 packs); typecheck + build + dev pass
- [x] T13 — Sound effects (`docs/tasks/T13-sfx.md`) — created src/ui/sfx.ts with Web Audio synthesized sfx; typecheck + build pass
- [x] T14 — App shell, router, overlays base, Home screen — created appTypes.ts, app.ts, coinPill.ts, overlay.ts, homeScreen.ts, gameScreen.ts stub, mapScreen.ts stub; replaced main.ts; typecheck + 112 tests + build pass
- [x] T15 — Grid view (`docs/tasks/T15-grid-view.md`) — created gridView.ts with cell rendering, ResizeObserver sizing, fill/reveal/flash/celebrate animations; updated gameScreen.ts stub with demo animations
- [x] T16 — Letter wheel (`docs/tasks/T16-wheel-view.md`) — created wheelView.ts, wheelGeometry.ts, wheelPointer.ts, wheelTypes.ts; updated gameScreen.ts with wheel mount; typecheck + build pass
- [x] T17 — Top bar, preview, action buttons (created topBar.ts, previewView.ts, actionButtons.ts; assembled in gameScreen.ts; typecheck + build + 112 tests pass)
- [x] T18 — Overlays: level complete, bonus, settings (created levelComplete.ts, bonusSheet.ts, settingsSheet.ts; enabled Settings on Home; temp triggers in gameScreen; typecheck + 112 tests + build pass)
- [x] T19 — Game screen & handlers: playable loop (created handlers.ts, rewrote gameScreen.ts; typecheck + 112 tests + build pass)
- [x] T20 — Effects & juice — effects.ts (center-to-center flight, CSS classes), wired into handlers found/bonus branches; streak compliments verified
- [x] T21 — Levels map screen — mapScreen.ts per spec; progress bars, locks, level bubbles, replay verified
- [x] T22 — PWA — manifest, sw.js (precaches build assets + fonts, `ignoreVary`), registration; offline play verified on `npm run preview`
- [x] T23 — Final QA — full manual checklist run headless at 390×844, 320×568, 1440×900 and reduced motion; no console errors

## Review fixes (applied during T20–T23)

Earlier tasks that passed their Verify steps but did not match the spec:

- **T05 game rules** — `submitWord`/`applyHint` never updated state (found words, bonus words and streak were lost), any wheel-letter combo counted as a bonus word, and auto-solve was wrong. Rewrote `src/core/game.ts` to the spec signatures (`{ state, result }`) and rewrote `tests/core/game.test.ts` to cover every spec case.
- **T09 level data** — pack `file` paths lacked the `levels/` prefix (levels failed to load in the app) and every pack was hardcoded as Meadow · Dawn. Fixed `generate.ts`/`validate.ts`; regenerated output is identical; `tests/levels.test.ts` now checks paths, areas and times of day.
- **T10 styles** — CSS was generic rather than ported from the mockup. Re-ported all five stylesheets per the spec; home screen markup aligned to the mockup classes.
- **T15 grid** — cell sizing ignored the grid-area padding, clipping 9–10 column grids. Fixed; a short-screen media query keeps 10-row grids at ≥ 18px cells on 320×568.
- **T16 wheel** — the pointer handler and the view kept separate copies of the selection, so swipes didn't highlight, draw or submit correctly. Rewrote `wheelView.ts` per spec (removed `wheelPointer.ts`); the word is now submitted before the preview clears.
- **T18 overlays** — the overlay wrapper had `pointer-events: none` (buttons unclickable) and the scrim faded back to invisible. Rebuilt as `.scrim > .card`.
- **T19 game screen** — rewrote `handlers.ts`/`gameScreen.ts` to the spec session shape on top of the fixed game rules.
- **Scene on desktop** — the 400-wide scene zoomed into the ground on wide windows; it now widens to the window's aspect ratio (docs/02 updated).
