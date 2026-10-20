import { MIN_WORD_LENGTH } from "./constants";
import { buildCells, filledKeys, isWordFilled } from "./grid";
import { normalizeWord, sameLetters } from "./letters";
import { pick, shuffle } from "./rng";
import type { CellKey, HintResult, Level, LevelProgress, LevelState, Rng, SubmitResult } from "./types";

export function createLevelState(level: Level, progress?: LevelProgress | null): LevelState {
  if (!progress || progress.levelId !== level.id) {
    return { level, wheel: [...level.letters], found: [], revealed: [], bonusFound: [], streak: 0 };
  }
  const gridWords = new Set(level.words.map((w) => w.word));
  const cells = buildCells(level);
  return {
    level,
    wheel: sameLetters(progress.wheel, level.letters) ? [...progress.wheel] : [...level.letters],
    found: progress.found.filter((w) => gridWords.has(w)),
    revealed: progress.revealed.filter((k) => cells.has(k)),
    bonusFound: progress.bonusFound.filter((w) => level.bonus.includes(w)),
    streak: 0,
  };
}

function autoSolve(level: Level, found: string[], revealed: CellKey[]): number[] {
  const filled = filledKeys(level, found, revealed);
  const autoFound: number[] = [];
  level.words.forEach((w, i) => {
    if (!found.includes(w.word) && isWordFilled(w, filled)) {
      found.push(w.word);
      autoFound.push(i);
    }
  });
  return autoFound;
}

export function submitWord(state: LevelState, rawWord: string): { state: LevelState; result: SubmitResult } {
  const word = normalizeWord(rawWord);
  const { level } = state;
  if (word.length < MIN_WORD_LENGTH) {
    return { state, result: { kind: "tooShort" } };
  }

  const wordIndex = level.words.findIndex((w) => w.word === word);
  if (wordIndex >= 0) {
    if (state.found.includes(word)) {
      return { state: { ...state, streak: 0 }, result: { kind: "alreadyFound", word, wordIndex } };
    }
    const found = [...state.found, word];
    const autoFound = autoSolve(level, found, state.revealed);
    return {
      state: { ...state, found, streak: state.streak + 1 },
      result: { kind: "found", word, wordIndex, autoFound, completesLevel: found.length === level.words.length },
    };
  }

  if (level.bonus.includes(word)) {
    if (state.bonusFound.includes(word)) {
      return { state, result: { kind: "bonusAlready", word } };
    }
    return { state: { ...state, bonusFound: [...state.bonusFound, word] }, result: { kind: "bonus", word } };
  }

  return { state: { ...state, streak: 0 }, result: { kind: "invalid", word } };
}

export function applyHint(state: LevelState, rng: Rng): { state: LevelState; result: HintResult } {
  const { level } = state;
  const filled = filledKeys(level, state.found, state.revealed);
  const unfilled = [...buildCells(level).keys()].filter((k) => !filled.has(k));
  if (unfilled.length === 0) {
    return { state, result: { kind: "none" } };
  }
  const key = pick(unfilled, rng);
  const revealed = [...state.revealed, key];
  const found = [...state.found];
  const autoFound = autoSolve(level, found, revealed);
  return {
    state: { ...state, revealed, found },
    result: { kind: "revealed", key, autoFound, completesLevel: found.length === level.words.length },
  };
}

export function shuffleWheel(state: LevelState, rng: Rng): LevelState {
  const before = state.wheel.join("");
  let copy = [...state.wheel];
  for (let i = 0; i < 10; i++) {
    copy = shuffle(copy, rng);
    if (copy.join("") !== before) break;
  }
  return { ...state, wheel: copy };
}

export function isLevelComplete(state: LevelState): boolean {
  return state.level.words.every((w) => state.found.includes(w.word));
}

export function hasUnfilledCells(state: LevelState): boolean {
  const filled = filledKeys(state.level, state.found, state.revealed);
  for (const key of buildCells(state.level).keys()) {
    if (!filled.has(key)) return true;
  }
  return false;
}

export function toProgress(state: LevelState): LevelProgress {
  return {
    levelId: state.level.id,
    wheel: [...state.wheel],
    found: [...state.found],
    revealed: [...state.revealed],
    bonusFound: [...state.bonusFound],
  };
}
