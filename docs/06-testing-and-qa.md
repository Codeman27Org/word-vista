# 06 — Testing & QA

## Commands

| Command | What it does | When |
|---|---|---|
| `npm run typecheck` | `tsc --noEmit` on src, tests, tools | every task |
| `npm test` | Vitest, all `tests/**/*.test.ts` | every task |
| `npm test -- tests/core/game.test.ts` | one test file | while working |
| `npm run build` | typecheck + production build to `dist/` | every UI task |
| `npm run dev` | dev server at http://localhost:5173 | manual checks |
| `npm run levels` | regenerate `public/levels/*` | only T09 or when generator changes |
| `npm run validate-levels` | verify every generated level | after `npm run levels` |
| `npm run preview` | serve `dist/` at http://localhost:4173 (needed for service worker) | T22, T23 |

Dev-only URL helpers (implemented in T14): `?level=305` opens level 305 directly (ignores locks), `?reset` clears the save.

## Unit tests (required)

Tests live in `tests/`, mirror source paths, and import from `../../src/...`. Use the fixture level in `tests/fixtures/level12.ts` (created in T04) instead of loading JSON in core tests.

| File | Must cover |
|---|---|
| `tests/core/rng.test.ts` | same seed → same sequence; values in [0,1); `shuffle` keeps the same elements; `randInt` range |
| `tests/core/letters.test.ts` | `canMake` with duplicates, missing letters, empty word; `normalizeWord` trims + uppercases |
| `tests/core/grid.test.ts` | `wordCells` across/down; `buildCells` merges crossing cells (`wordIndexes` has 2 entries); `filledKeys` from found + revealed |
| `tests/core/game.test.ts` | every `SubmitResult` kind; streak increments/resets; auto-solve via crossings; hint reveals only unfilled cells; hint completes level; `none` when full; shuffle changes order and keeps letters; progress round-trip |
| `tests/core/economy.test.ts` | new save values; spend success/fail; bonus meter rollover at 10 gives 25; completeLevel first time (+10), last of pack (+60, `packCompleted`), replay (0, no change to currentLevel); compliments by streak |
| `tests/data/storage.test.ts` | missing → new save; bad JSON → new save; wrong version → new save; clamping; stale `inProgress` dropped; write/read round-trip (use an in-memory fake Storage) |
| `tests/data/levelRepo.test.ts` | fetches index once (cached); `getLevel` finds the right pack file; throws for unknown id (fake `fetch`) |
| `tests/levelgen/layout.test.ts` | base word placed across at row 0; result passes `validateLevel` for a built level; respects maxRows/maxCols; deterministic with same seed |
| `tests/levelgen/validate.test.ts` | the fixture is valid; detects: accidental adjacent run, letter conflict, disconnected word, bonus containing a grid word |
| `tests/levels.test.ts` | loads every `public/levels` pack from disk and asserts `validateLevel(level)` is empty; ids 1..600 continuous; tier letter counts match config |

UI modules are verified manually (below) — do not add jsdom.

## Manual QA checklist (run in `npm run dev`, phone-sized viewport 390×844 and a desktop window)

### Core loop
- [ ] Fresh start (`?reset`): Home shows LEVEL 1, 100 coins, Meadow · Dawn scene.
- [ ] Swipe a grid word: letters fly into cells, cells turn accent, sound plays.
- [ ] Swipe the same word again: its cells flash, no other change.
- [ ] Swipe a bonus word: pill flies to the star button, badge count +1, ring grows.
- [ ] Swipe a non-word: pill shakes and fades.
- [ ] Two/three correct words in a row show "Good!" then "Great!".
- [ ] Backtracking during a swipe removes the last letter.
- [ ] Duplicate letters (find a level with them) can both be used.
- [ ] Shuffle animates letters to new positions; swiping still works after.
- [ ] Hint: −25 coins, one empty cell shows a letter in accent on white.
- [ ] Hint with < 25 coins: coin pill shakes, no change.
- [ ] Hints that complete a word mark it solved; hints can finish a level.
- [ ] Finishing the level: wave animation → Level Complete card with words, +10 coins → NEXT opens the next level.
- [ ] Level 15 completion shows "Pack complete! +50" and level 16 has a new scene (Meadow · Day).
- [ ] 10 bonus words → +25 coins and meter resets.

### Persistence
- [ ] Reload mid-level: same found words, revealed cells, wheel order, bonus words, coins.
- [ ] Back to Home and PLAY again: same state.
- [ ] Replay an old level from the map: no coins for completing; current level progress untouched.

### Map & settings
- [ ] Map shows correct progress; locked packs dimmed; current level ring; tapping done/current levels opens them; locked does nothing.
- [ ] Sound toggle persists across reload.
- [ ] Reset progress (with confirm) returns to level 1 / 100 coins.

### Layout & devices
- [ ] 320×568 (small phone): grid and wheel visible without scrolling; nothing overlaps.
- [ ] 390×844 and 430×932: matches `design/mockup.html` closely.
- [ ] Desktop 1440×900: UI column centered (max 480px), scene fills the window.
- [ ] Largest grids (levels 301+, up to 10×10): cells ≥ 28px at 390×844 and ≥ 18px at 320×568, nothing clipped.
- [ ] Keyboard on desktop: type letters, Backspace, Enter, Escape, Space.
- [ ] `prefers-reduced-motion`: no fly/wave animations, game still works.
- [ ] No page scroll, pull-to-refresh, or text selection while swiping on mobile.

### PWA (after `npm run build && npm run preview`)
- [ ] Manifest loads (DevTools → Application) with icons; installable.
- [ ] After one visit, turn network off (DevTools → offline) → reload → game still works, levels load.

### Console
- [ ] No errors or warnings in the console during any of the above.
