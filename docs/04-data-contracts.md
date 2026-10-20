# 04 — Data Contracts

These are the **exact** shared types, constants and file formats. Copy code blocks verbatim when a task says so.
If code and this document disagree, this document wins.

## Coordinate system

- Grid origin is the **top-left** cell: `row 0, col 0`. Rows go down, cols go right.
- `across` words grow to the right (`col + i`). `down` words grow downward (`row + i`).
- A cell is identified by a `CellKey` string: `` `${row},${col}` `` e.g. `"3,5"`.
- All game words and letters are **UPPERCASE**. Only `data/words/*` files are lowercase.

## `src/core/types.ts` (exact)

```ts
export type Direction = "across" | "down";

/** One answer word placed in the crossword. */
export interface PlacedWord {
  word: string; // UPPERCASE
  row: number; // row of first letter (0-based)
  col: number; // col of first letter (0-based)
  dir: Direction;
}

/** One playable level, as stored in public/levels/pack-XXX.json */
export interface Level {
  id: number; // global level number, 1-based
  packId: number; // 1-based
  letters: string[]; // UPPERCASE single letters, initial wheel order, length 3..7
  rows: number;
  cols: number;
  words: PlacedWord[]; // grid answers. words[0] always uses ALL letters.
  bonus: string[]; // UPPERCASE valid extra words (not in grid), sorted A-Z
}

export interface PackFile {
  packId: number;
  levels: Level[];
}

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export interface PackMeta {
  id: number; // 1-based
  areaId: string; // e.g. "meadow" (see themes in docs/02-visual-design.md)
  areaName: string; // e.g. "Meadow"
  packName: string; // e.g. "Dawn"
  timeOfDay: TimeOfDay;
  firstLevel: number; // global id of first level in the pack
  levelCount: number;
  file: string; // path relative to public/, e.g. "levels/pack-001.json"
}

/** public/levels/index.json */
export interface LevelIndex {
  version: 1;
  totalLevels: number;
  packs: PackMeta[];
}

/** "row,col" */
export type CellKey = string;

export interface Cell {
  row: number;
  col: number;
  letter: string;
  wordIndexes: number[]; // indexes into Level.words that use this cell
}

/** Runtime state of the level being played. Immutable: functions return new objects. */
export interface LevelState {
  level: Level;
  wheel: string[]; // current wheel order (changes on shuffle)
  found: string[]; // grid words solved (by swipe or completed by hints), in solve order
  revealed: CellKey[]; // cells revealed by hints
  bonusFound: string[]; // bonus words found during this level
  streak: number; // consecutive "found" results (resets on invalid / alreadyFound)
}

export type SubmitResult =
  | { kind: "tooShort" }
  | { kind: "found"; word: string; wordIndex: number; autoFound: number[]; completesLevel: boolean }
  | { kind: "alreadyFound"; word: string; wordIndex: number }
  | { kind: "bonus"; word: string }
  | { kind: "bonusAlready"; word: string }
  | { kind: "invalid"; word: string };

export type HintResult =
  | { kind: "revealed"; key: CellKey; autoFound: number[]; completesLevel: boolean }
  | { kind: "none" };

/** Saved progress for the level currently being played (never for replays). */
export interface LevelProgress {
  levelId: number;
  wheel: string[];
  found: string[];
  revealed: CellKey[];
  bonusFound: string[];
}

export interface Settings {
  sound: boolean;
}

/** Persisted in localStorage under SAVE_KEY. */
export interface SaveData {
  version: 1;
  currentLevel: number; // highest unlocked level = next level to play. totalLevels + 1 means "all done".
  coins: number;
  bonusMeter: number; // 0 .. BONUS_GOAL - 1
  totalBonusFound: number;
  inProgress: LevelProgress | null; // only ever for currentLevel
  settings: Settings;
}

export interface LevelCompletion {
  save: SaveData;
  coinsEarned: number; // 0 for replays
  packCompleted: PackMeta | null; // set when this finished the last level of a pack (first time only)
  isReplay: boolean;
}

/** Seeded random number generator: returns a float in [0, 1). */
export type Rng = () => number;
```

## `src/core/constants.ts` (exact)

```ts
export const APP_NAME = "Word Vista";
export const SAVE_KEY = "wordvista.save.v1";

export const MIN_WORD_LENGTH = 3;
export const MAX_WHEEL_LETTERS = 7;

export const START_COINS = 100;
export const HINT_COST = 25;
export const LEVEL_REWARD = 10;
export const PACK_REWARD = 50;
export const BONUS_GOAL = 10;
export const BONUS_REWARD = 25;

/** Shown for streak 2,3,4,5,6+ (index = min(streak, 6) - 2). */
export const STREAK_COMPLIMENTS = ["Good!", "Great!", "Awesome!", "Amazing!", "Outstanding!"] as const;
export const LEVEL_COMPLIMENTS = ["Splendid!", "Brilliant!", "Excellent!", "Fantastic!", "Superb!"] as const;

export const TIMES_OF_DAY = ["dawn", "day", "dusk", "night"] as const;
export const LEVELS_PER_PACK = 15;
```

## `public/levels/index.json`

```json
{
  "version": 1,
  "totalLevels": 600,
  "packs": [
    {
      "id": 1,
      "areaId": "meadow",
      "areaName": "Meadow",
      "packName": "Dawn",
      "timeOfDay": "dawn",
      "firstLevel": 1,
      "levelCount": 15,
      "file": "levels/pack-001.json"
    }
  ]
}
```

40 packs total: 10 areas × 4 times of day × 15 levels. Pack `k` (1-based):
`areaIndex = floor((k-1)/4)`, `timeOfDay = TIMES_OF_DAY[(k-1) % 4]`, `firstLevel = (k-1)*15 + 1`.

## `public/levels/pack-001.json`

```json
{
  "packId": 1,
  "levels": [
    {
      "id": 12,
      "packId": 1,
      "letters": ["T", "E", "P", "L", "N", "A"],
      "rows": 6,
      "cols": 7,
      "words": [
        { "word": "PLANET", "row": 1, "col": 1, "dir": "across" },
        { "word": "PLANT", "row": 1, "col": 1, "dir": "down" },
        { "word": "PENAL", "row": 0, "col": 5, "dir": "down" },
        { "word": "PANEL", "row": 0, "col": 3, "dir": "down" },
        { "word": "PALE", "row": 3, "col": 0, "dir": "across" },
        { "word": "ATE", "row": 5, "col": 0, "dir": "across" }
      ],
      "bonus": ["ALE", "ANT", "APE", "EAT", "LANE", "LATE", "LEAN", "LEAP", "LENT", "NAP", "NET", "PAN", "PANE", "PANT", "PAT", "PEA", "PEN", "PET", "PLAN", "PLEAT", "TAN", "TAP", "TEA", "TEN"]
    }
  ]
}
```

That grid renders as (`.` = no cell):

```
. . . P . P .
. P L A N E T
. L . N . N .
P A L E . A .
. N . L . L .
A T E . . . .
```

(The example `bonus` list is illustrative; real lists come from the generator and never contain grid words.)

## Save data (`localStorage["wordvista.save.v1"]`)

New-game value (`createNewSave()`):

```json
{
  "version": 1,
  "currentLevel": 1,
  "coins": 100,
  "bonusMeter": 0,
  "totalBonusFound": 0,
  "inProgress": null,
  "settings": { "sound": true }
}
```

Loading rules (`loadSave`):

1. Missing key → `createNewSave()`.
2. Invalid JSON, `version !== 1`, or any required field with the wrong type → `createNewSave()` (do not throw).
3. Clamp: `currentLevel >= 1`, `coins >= 0`, `0 <= bonusMeter < BONUS_GOAL`.
4. If `inProgress` exists but `inProgress.levelId !== currentLevel`, set it to `null`.

Future format changes must bump `version` and add a migration in `storage.ts`. Never silently change the meaning of fields.

## Word list files (`data/words/`, generator input only, never shipped)

- `answers.tsv`: `word<TAB>tier`, lowercase, 3–7 letters. `tier` ∈ {10, 20, 35}; lower = more common. Grid answers come from here.
- `valid.txt`: one lowercase word per line, 3–7 letters. Every acceptable word (superset of answers). Bonus words come from here.
- Both are already built. Rebuild only with `npm run wordlists` (see CREDITS.md for sources and licenses).
