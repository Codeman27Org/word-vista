import { SAVE_KEY, BONUS_GOAL } from "../core/constants";
import { createNewSave } from "../core/economy";
import type { SaveData } from "../core/types";

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStore(): KeyValueStore {
  return globalThis.localStorage as unknown as KeyValueStore;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function loadSave(store?: KeyValueStore): SaveData {
  const s = store ?? defaultStore();
  try {
    const raw = s.getItem(SAVE_KEY);
    if (raw === null) return createNewSave();
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return createNewSave();
    return sanitizeSave(parsed);
  } catch {
    return createNewSave();
  }
}

export function writeSave(save: SaveData, store?: KeyValueStore): void {
  const s = store ?? defaultStore();
  try {
    s.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // private mode / quota — silently ignore
  }
}

export function clearSave(store?: KeyValueStore): void {
  const s = store ?? defaultStore();
  try {
    s.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

export function sanitizeSave(raw: unknown): SaveData {
  if (!isPlainObject(raw)) return createNewSave();

  const version = raw.version;
  if (typeof version !== "number" || version !== 1) return createNewSave();

  const currentLevel = raw.currentLevel;
  if (typeof currentLevel !== "number") return createNewSave();

  const coins = raw.coins;
  if (typeof coins !== "number") return createNewSave();

  const bonusMeter = raw.bonusMeter;
  if (typeof bonusMeter !== "number") return createNewSave();

  const totalBonusFound = raw.totalBonusFound;
  if (typeof totalBonusFound !== "number") return createNewSave();

  const inProgress = raw.inProgress;
  if (inProgress != null && (!isPlainObject(inProgress) || typeof inProgress.levelId !== "number")) {
    return createNewSave();
  }

  const settings = raw.settings;
  if (!isPlainObject(settings) || typeof settings.sound !== "boolean") {
    return createNewSave();
  }

  // Clamp
  let clampedLevel = Math.max(currentLevel, 1);
  let clampedCoins = Math.max(coins, 0);
  let clampedMeter = Math.max(0, Math.min(bonusMeter, BONUS_GOAL - 1));

  // Validate inProgress.levelId matches currentLevel
  let finalProgress: { levelId: number; wheel: string[]; found: string[]; revealed: string[]; bonusFound: string[] } | null = null;
  if (inProgress !== null && isPlainObject(inProgress)) {
    if (inProgress.levelId === clampedLevel) {
      const wheel = inProgress.wheel;
      const found = inProgress.found;
      const revealed = inProgress.revealed;
      const bonusFound = inProgress.bonusFound;
      if (
        Array.isArray(wheel) && wheel.every((c) => typeof c === "string") &&
        Array.isArray(found) && found.every((c) => typeof c === "string") &&
        Array.isArray(revealed) && revealed.every((c) => typeof c === "string") &&
        Array.isArray(bonusFound) && bonusFound.every((c) => typeof c === "string")
      ) {
        finalProgress = {
          levelId: inProgress.levelId,
          wheel: wheel as string[],
          found: found as string[],
          revealed: revealed as string[],
          bonusFound: bonusFound as string[],
        };
      }
    }
  }

  return {
    version: 1,
    currentLevel: clampedLevel,
    coins: clampedCoins,
    bonusMeter: clampedMeter,
    totalBonusFound,
    inProgress: finalProgress,
    settings: { sound: settings.sound },
  };
}
