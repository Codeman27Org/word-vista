# T05 — Game rules

**Goal:** all level gameplay rules as pure, immutable functions.
**Read first:** `docs/01-game-design.md` (§Rules); `docs/04-data-contracts.md` (`LevelState`, `SubmitResult`, `HintResult`, `LevelProgress`).
**Depends on:** T04.

## Files
- create `src/core/game.ts`
- create `tests/core/game.test.ts`

## Spec — `src/core/game.ts`
All functions return **new** objects; never mutate the input state or its arrays.

```ts
export function createLevelState(level: Level, progress?: LevelProgress | null): LevelState;
export function submitWord(state: LevelState, rawWord: string): { state: LevelState; result: SubmitResult };
export function applyHint(state: LevelState, rng: Rng): { state: LevelState; result: HintResult };
export function shuffleWheel(state: LevelState, rng: Rng): LevelState;
export function isLevelComplete(state: LevelState): boolean;
export function hasUnfilledCells(state: LevelState): boolean;
export function toProgress(state: LevelState): LevelProgress;
```

### `createLevelState`
- Without progress, or when `progress.levelId !== level.id`: `wheel = [...level.letters]`, `found = []`, `revealed = []`, `bonusFound = []`, `streak = 0`.
- With matching progress: copy arrays from progress, but
  - `wheel`: use `progress.wheel` only if `sameLetters(progress.wheel, level.letters)`, else `[...level.letters]`;
  - `found`: keep only words that are grid words; `bonusFound`: keep only words in `level.bonus`;
  - `revealed`: keep only keys that exist in `buildCells(level)`.
  - `streak = 0`.

### `submitWord` — check in this order (word = `normalizeWord(rawWord)`)
1. `word.length < MIN_WORD_LENGTH` → `{ kind: "tooShort" }`, state unchanged.
2. `wordIndex = level.words.findIndex(w => w.word === word)`; if `>= 0`:
   - already in `found` → `{ kind: "alreadyFound", word, wordIndex }`, `streak = 0`.
   - else add to `found`, then run **auto-solve** (below), `streak + 1`,
     → `{ kind: "found", word, wordIndex, autoFound, completesLevel }`.
3. `level.bonus.includes(word)`:
   - already in `bonusFound` → `{ kind: "bonusAlready", word }`, streak unchanged.
   - else add to `bonusFound` → `{ kind: "bonus", word }`, streak unchanged.
4. Otherwise `{ kind: "invalid", word }`, `streak = 0`.

### Auto-solve (private helper)
After adding a found word or revealing a cell: compute `filledKeys(level, found, revealed)`. For each word index `i` (in order) not yet in `found` whose cells are all filled (`isWordFilled`), append the word to `found` and push `i` to `autoFound`. One pass is enough. `completesLevel = found.length === level.words.length`.

### `applyHint`
- `unfilled` = keys of `buildCells(level)` (insertion order) not in `filledKeys(...)`.
- Empty → `{ state, result: { kind: "none" } }` (same state object).
- Else `key = pick(unfilled, rng)`, append to `revealed`, run auto-solve → `{ kind: "revealed", key, autoFound, completesLevel }`. Streak unchanged.
- Coins are **not** handled here (see economy, T06).

### `shuffleWheel`
Copy `wheel`; up to 10 times: `shuffle(copy, rng)` and stop when `copy.join("") !== state.wheel.join("")`. Return state with the new wheel (it may equal the old order if all letters are identical).

### Others
- `isLevelComplete`: every `level.words[i].word` is in `found`.
- `hasUnfilledCells`: at least one cell not in `filledKeys`.
- `toProgress`: `{ levelId: level.id, wheel, found, revealed, bonusFound }` (copies).

## Tests — `tests/core/game.test.ts` (use `LEVEL12` from `tests/fixtures/level12.ts`, `createRng(1)`)
- New state: wheel equals level letters, empty arrays.
- `"pl"` → tooShort. `"planet"` (lowercase input) → found, wordIndex 0, streak 1. Again → alreadyFound, streak 0.
- `"PANE"` → bonus; again → bonusAlready. `"XYZ"` → invalid, streak 0.
- Streak: PLANET, PLANT, PALE in a row → streak 3.
- Auto-solve via crossing: start from progress `{ levelId: 12, wheel: LEVEL12.letters, found: ["PALE"], revealed: ["5,0", "5,2"], bonusFound: [] }`; `ATE` is not yet in `found`. Submit `"PLANT"` (fills cell `5,1`) → result `found` with `autoFound` equal to `[5]` (index of `ATE`), and `ATE` is now in `found`.
- `applyHint` never reveals an already filled cell: from a fresh state, call it 30 times. The fixture has 22 cells, so exactly 22 calls return `revealed` (all keys unique) and the rest return `none`; `completesLevel` is true exactly once (on the 22nd).
- Original state object is unchanged after `submitWord` (deep equal to a `structuredClone` taken before).
- `shuffleWheel` keeps the same letters (`sameLetters`) and changes the order.
- `createLevelState(level, progress)` drops unknown words/keys and a wheel with wrong letters.
- `toProgress` → `createLevelState` round-trip keeps found/revealed/bonusFound/wheel.

## Verify
```
npm run typecheck
npm test
```

## Done when
All tests pass and `src/core/game.ts` has no imports outside `src/core/`.
