import type { Rng, SaveData, LevelIndex, PackMeta, LevelCompletion } from "./types";
import {
  START_COINS,
  LEVEL_REWARD,
  PACK_REWARD,
  BONUS_GOAL,
  BONUS_REWARD,
  STREAK_COMPLIMENTS,
  LEVEL_COMPLIMENTS,
} from "./constants";

export function createNewSave(): SaveData {
  return {
    version: 1,
    currentLevel: 1,
    coins: START_COINS,
    bonusMeter: 0,
    totalBonusFound: 0,
    inProgress: null,
    settings: { sound: true },
  };
}

export function addCoins(save: SaveData, amount: number): SaveData {
  return { ...save, coins: save.coins + amount };
}

export function spendCoins(save: SaveData, amount: number): SaveData | null {
  if (save.coins < amount) return null;
  return { ...save, coins: save.coins - amount };
}

export function recordBonusWord(save: SaveData): { save: SaveData; rewarded: boolean } {
  let bonusMeter = save.bonusMeter + 1;
  let coins = save.coins;
  let totalBonusFound = save.totalBonusFound + 1;
  let rewarded = false;

  if (bonusMeter >= BONUS_GOAL) {
    bonusMeter = 0;
    coins += BONUS_REWARD;
    rewarded = true;
  }

  return {
    save: { ...save, bonusMeter, coins, totalBonusFound },
    rewarded,
  };
}

export function packForLevel(index: LevelIndex, levelId: number): PackMeta {
  for (const pack of index.packs) {
    if (levelId >= pack.firstLevel && levelId < pack.firstLevel + pack.levelCount) {
      return pack;
    }
  }
  throw new Error(`No pack contains level ${levelId}`);
}

export function isLevelUnlocked(save: SaveData, index: LevelIndex, levelId: number): boolean {
  return levelId >= 1 && levelId <= index.totalLevels && levelId <= save.currentLevel;
}

export function completeLevel(
  save: SaveData,
  index: LevelIndex,
  levelId: number,
): LevelCompletion {
  // Replay: level already completed
  if (levelId < save.currentLevel) {
    return { save, coinsEarned: 0, packCompleted: null, isReplay: true };
  }

  // Locked level
  if (levelId > save.currentLevel) {
    throw new Error("level is locked");
  }

  // Completing current level
  const pack = packForLevel(index, levelId);
  const isLastPackLevel = levelId === pack.firstLevel + pack.levelCount - 1;
  const packCompleted = isLastPackLevel ? pack : null;
  const reward = LEVEL_REWARD + (isLastPackLevel ? PACK_REWARD : 0);

  const newSave: SaveData = {
    ...save,
    currentLevel: save.currentLevel + 1,
    coins: save.coins + reward,
    inProgress: null,
  };

  return {
    save: newSave,
    coinsEarned: reward,
    packCompleted,
    isReplay: false,
  };
}

export function complimentForStreak(streak: number): string | null {
  if (streak < 2) return null;
  return STREAK_COMPLIMENTS[Math.min(streak, 6) - 2];
}

export function pickLevelCompliment(rng: Rng): string {
  return LEVEL_COMPLIMENTS[Math.floor(rng() * LEVEL_COMPLIMENTS.length)];
}
