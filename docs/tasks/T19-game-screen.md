# T19 — Game screen & handlers: playable loop

**Goal:** replace the game-screen stub with the real thing. After this task the game is fully playable end-to-end.
**Read first:** `docs/03-architecture.md` (§Game screen event flow, `GameSession`); `docs/01-game-design.md` (§Rules, §Progression).
**Depends on:** T18.

## Files
- create `src/ui/game/handlers.ts`
- rewrite `src/ui/screens/gameScreen.ts` (remove all temporary code)

## Spec — `src/ui/game/handlers.ts`
Export `GameSession` exactly as in docs/03 and:
```ts
export async function onSubmit(s: GameSession, word: string): Promise<void>;
export async function onHint(s: GameSession): Promise<void>;
export function onShuffle(s: GameSession): void;
export function onBonus(s: GameSession): void;
export async function finishLevel(s: GameSession): Promise<void>;
export function refreshControls(s: GameSession): void;
```

### `onSubmit`
```
if s.busy → return
{ state, result } = submitWord(s.state, word); s.state = state
if result.kind === "found" && result.completesLevel → s.busy = true; wheel.setEnabled(false)
switch result.kind:
  tooShort     → preview.hide()
  found        → sfx "found"; preview.hide(); await grid.fillWord(wordIndex, true);
                 for each i in autoFound: grid.fillWord(i, true)
  alreadyFound → preview.hide(); grid.flashWord(wordIndex)
  bonus        → sfx "bonus"; preview.hide();
                 { save, rewarded } = recordBonusWord(ctx.getSave()); ctx.setSave(save)
                 actions.setBonus(state.bonusFound.length, save.bonusMeter, true); actions.bounceBonus()
                 if rewarded → sfx "coin"; topBar.coins.set(save.coins, true)
  bonusAlready → preview.hide(); actions.wiggleBonus()
  invalid      → sfx "invalid"; preview.shake()
persist(s); refreshControls(s)
if found && completesLevel → await finishLevel(s)
```
Don't `await` animations that don't need to block (use `void promise`).

### `onHint`
```
if s.busy or !hasUnfilledCells(s.state) → return
save = ctx.getSave()
if save.coins < HINT_COST → topBar.coins.shake(); sfx "invalid"; return
{ state, result } = applyHint(s.state, s.rng); if result.kind === "none" → return
ctx.setSave(spendCoins(save, HINT_COST)!)  — safe: affordability checked above
topBar.coins.set(newCoins, true); sfx "hint"; s.state = state
if result.completesLevel → s.busy = true; wheel.setEnabled(false)
await grid.revealCell(result.key, true); autoFound → grid.fillWord(i, true)
persist(s); refreshControls(s); if completesLevel → await finishLevel(s)
```

### `onShuffle`
If busy return. `s.state = shuffleWheel(s.state, s.rng)`; `wheel.setLetters(s.state.wheel, true)`; sfx "shuffle"; persist.

### `onBonus`
`wheel.setEnabled(false)`; `openBonusSheet(ctx.overlayHost, { words: state.bonusFound, meter: save.bonusMeter, onClose: () => { if (!s.busy) wheel.setEnabled(true) } })`.

### `finishLevel`
```
s.busy = true; wheel.setEnabled(false); preview.hide()
await wait(300); sfx "complete"; await grid.celebrate()
save = ctx.getSave(); level = s.state.level
completion = s.isReplay ? { save, coinsEarned: 0, packCompleted: null, isReplay: true }
                        : completeLevel(save, ctx.index, level.id)
ctx.setSave(completion.save)
if completion.coinsEarned > 0 → topBar.coins.set(completion.save.coins, true); sfx "coin"
next = level.id + 1; total = ctx.index.totalLevels
if !s.isReplay: label = next <= total ? "NEXT LEVEL" : "FINISH"; go = next <= total ? game(next) : home
else:           canGo = next <= Math.min(completion.save.currentLevel, total)
                label = canGo ? "CONTINUE" : "FINISH"; go = canGo ? game(next) : home
if next <= total → ctx.repo.prefetch(next)
openLevelComplete(ctx.overlayHost, { levelId: level.id, compliment: pickLevelCompliment(s.rng),
  words: level.words.map(w => w.word).sort((a, b) => b.length - a.length || a.localeCompare(b)),
  coinsEarned: completion.coinsEarned, packCompleted: completion.packCompleted,
  bonusCount: s.state.bonusFound.length, nextLabel: label, onNext: go })
```

### Private helpers
- `persist(s)`: if `!s.isReplay` → `ctx.setSave({ ...ctx.getSave(), inProgress: toProgress(s.state) })`.
- `refreshControls(s)`: `actions.setHintEnabled(hasUnfilledCells(s.state))`.

## Spec — `src/ui/screens/gameScreen.ts`
```ts
export function createGameScreen(ctx: AppContext, levelId: number): Screen;
```
1. `el = div.screen.game`. `destroyed = false`.
2. `save = ctx.getSave()`. If `!isLevelUnlocked(save, ctx.index, levelId) && !import.meta.env.DEV` → `queueMicrotask(() => ctx.navigate({ name: "home" }))` and return `{ el, destroy() {} }`.
3. `ctx.repo.getLevel(levelId)` → on error show "Could not load level" + console.error. If `destroyed`, stop. Otherwise build:
   - `pack = packForLevel(ctx.index, levelId)`; `ctx.scene.show(pack)`.
   - `isReplay = levelId !== save.currentLevel`.
   - `state = createLevelState(level, isReplay ? null : save.inProgress)`.
   - Views: top bar (area `` `${pack.areaName} · ${pack.packName}`.toUpperCase() ``, level `LEVEL ${levelId}`, back → home), grid (`filledKeys(level, state.found, [])`, `new Set(state.revealed)`), preview, wheel (`state.wheel`), action buttons. Layout order as in T17.
   - `session: GameSession` with `rng = createRng((Date.now() ^ levelId) >>> 0)`, `busy = false`.
   - Wheel: `onChange` → `preview.show`; `onSelect(n)` → `ctx.sfx.select(n - 1)`; `onSubmit` → `void onSubmit(session, w)`; `onShuffleKey` → `onShuffle(session)`.
   - Actions: `onBonus`/`onShuffle`/`onHint` → handlers.
   - `actions.setBonus(state.bonusFound.length, save.bonusMeter, false)`; `refreshControls(session)`.
   - If `isLevelComplete(state)` → `void finishLevel(session)`.
4. `destroy()`: `destroyed = true`; destroy wheel and grid views.

## Verify
```
npm run typecheck
npm test
npm run build
npm run dev
```
Then run the **Core loop** and **Persistence** sections of the manual checklist in `docs/06-testing-and-qa.md` (ignore fly/compliment animations; they come in T20).
Tip: open level 1 with `?reset`, solve it, and use `?level=15` (DEV) to test a pack ending.

## Done when
A full level can be played, completed, and continued to the next; reload restores progress; no console errors.
