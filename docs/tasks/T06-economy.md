# T06 — Economy & progression

**Goal:** coins, bonus meter, level completion and unlocking as pure functions on `SaveData`.
**Read first:** `docs/01-game-design.md` (§Bonus words and coins, §Progression, §Streak compliments); `docs/04-data-contracts.md` (`SaveData`, `LevelCompletion`, constants).
**Depends on:** T05.

## Files
- create `src/core/economy.ts`
- create `tests/core/economy.test.ts`

## Spec — `src/core/economy.ts`
```ts
export function createNewSave(): SaveData;
export function addCoins(save: SaveData, amount: number): SaveData;
export function spendCoins(save: SaveData, amount: number): SaveData | null; // null if not enough coins
export function recordBonusWord(save: SaveData): { save: SaveData; rewarded: boolean };
export function packForLevel(index: LevelIndex, levelId: number): PackMeta;  // throws Error if not found
export function isLevelUnlocked(save: SaveData, index: LevelIndex, levelId: number): boolean;
export function completeLevel(save: SaveData, index: LevelIndex, levelId: number): LevelCompletion;
export function complimentForStreak(streak: number): string | null;
export function pickLevelCompliment(rng: Rng): string;
```

- `createNewSave()` returns exactly the new-game JSON in docs/04 (use `START_COINS`).
- `recordBonusWord`: `totalBonusFound + 1`, `bonusMeter + 1`; if meter reaches `BONUS_GOAL`, set it to `0`, add `BONUS_REWARD` coins, `rewarded: true`.
- `packForLevel`: the pack where `firstLevel <= levelId < firstLevel + levelCount`.
- `isLevelUnlocked`: `levelId >= 1 && levelId <= index.totalLevels && levelId <= save.currentLevel`.
- `completeLevel`:
  - `levelId < save.currentLevel` → replay: `{ save (unchanged object), coinsEarned: 0, packCompleted: null, isReplay: true }`.
  - `levelId > save.currentLevel` → `throw new Error("level is locked")`.
  - `levelId === save.currentLevel` → reward = `LEVEL_REWARD` (+ `PACK_REWARD` if it is the pack's last level, and `packCompleted = pack`), new save: `currentLevel + 1`, coins + reward, `inProgress: null`.
- `complimentForStreak`: `< 2` → `null`; else `STREAK_COMPLIMENTS[Math.min(streak, 6) - 2]`.
- `pickLevelCompliment`: `pick([...LEVEL_COMPLIMENTS], rng)`.

## Tests — `tests/core/economy.test.ts`
Build a small fake `LevelIndex` in the test: 2 packs × 15 levels (`totalLevels: 30`).
- New save matches docs/04.
- `spendCoins(save(100), 25)` → 75; `spendCoins(save(20), 25)` → `null`.
- Recording 9 bonus words: meter 9, no reward. 10th: meter 0, coins +25, `rewarded: true`, `totalBonusFound` 10.
- `completeLevel` on level 1 (current 1) → current 2, +10, `packCompleted` null, inProgress null.
- `completeLevel` on level 15 (current 15) → +60, `packCompleted.id === 1`.
- Replay level 3 with current 10 → coinsEarned 0, isReplay true, save unchanged.
- Locked level throws.
- `isLevelUnlocked`: 0 false, current true, current+1 false, > total false.
- `complimentForStreak`: 1 → null, 2 → "Good!", 6 → "Outstanding!", 9 → "Outstanding!".

## Verify
```
npm run typecheck
npm test
```

## Done when
All tests pass.
