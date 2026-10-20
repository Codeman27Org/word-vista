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
