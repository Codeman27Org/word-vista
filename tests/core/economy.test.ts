import { describe, it, expect } from "vitest";
import { createRng } from "../../src/core/rng";
import type { Rng, LevelIndex } from "../../src/core/types";
import {
  createNewSave,
  addCoins,
  spendCoins,
  recordBonusWord,
  packForLevel,
  isLevelUnlocked,
  completeLevel,
  complimentForStreak,
  pickLevelCompliment,
} from "../../src/core/economy";
import { BONUS_REWARD, LEVEL_REWARD, PACK_REWARD, START_COINS } from "../../src/core/constants";

// Fake LevelIndex: 2 packs × 15 levels
function makeIndex(): LevelIndex {
  return {
    version: 1,
    totalLevels: 30,
    packs: [
      {
        id: 1,
        areaId: "meadow",
        areaName: "Meadow",
        packName: "Dawn",
        timeOfDay: "dawn",
        firstLevel: 1,
        levelCount: 15,
        file: "levels/pack-001.json",
      },
      {
        id: 2,
        areaId: "meadow",
        areaName: "Meadow",
        packName: "Day",
        timeOfDay: "day",
        firstLevel: 16,
        levelCount: 15,
        file: "levels/pack-002.json",
      },
    ],
  };
}

describe("createNewSave", () => {
  it("returns the new-game JSON from docs/04", () => {
    const save = createNewSave();
    expect(save).toEqual({
      version: 1,
      currentLevel: 1,
      coins: START_COINS,
      bonusMeter: 0,
      totalBonusFound: 0,
      inProgress: null,
      settings: { sound: true },
    });
  });
});

describe("addCoins", () => {
  it("adds coins to save", () => {
    const save = createNewSave();
    const result = addCoins(save, 50);
    expect(result.coins).toBe(START_COINS + 50);
  });
});

describe("spendCoins", () => {
  it("subtracts coins when enough", () => {
    const save = createNewSave();
    const result = spendCoins(save, 25);
    expect(result).not.toBeNull();
    expect(result!.coins).toBe(START_COINS - 25);
  });

  it("returns null when not enough coins", () => {
    const save = createNewSave();
    const result = spendCoins(save, START_COINS + 1);
    expect(result).toBeNull();
  });
});

describe("recordBonusWord", () => {
  it("increments meter without reward until BONUS_GOAL", () => {
    let save = createNewSave();
    for (let i = 0; i < 9; i++) {
      const { save: s, rewarded } = recordBonusWord(save);
      save = s;
      expect(rewarded).toBe(false);
    }
    expect(save.bonusMeter).toBe(9);
    expect(save.totalBonusFound).toBe(9);
  });

  it("rewards on the 10th bonus word", () => {
    let save = createNewSave();
    for (let i = 0; i < 9; i++) {
      const { save: s } = recordBonusWord(save);
      save = s;
    }
    const { save: finalSave, rewarded } = recordBonusWord(save);
    expect(rewarded).toBe(true);
    expect(finalSave.bonusMeter).toBe(0);
    expect(finalSave.coins).toBe(START_COINS + BONUS_REWARD);
    expect(finalSave.totalBonusFound).toBe(10);
  });
});

describe("packForLevel", () => {
  const index = makeIndex();

  it("finds pack for level 1", () => {
    expect(packForLevel(index, 1).id).toBe(1);
  });

  it("finds pack for level 15", () => {
    expect(packForLevel(index, 15).id).toBe(1);
  });

  it("finds pack for level 16", () => {
    expect(packForLevel(index, 16).id).toBe(2);
  });

  it("finds pack for level 30", () => {
    expect(packForLevel(index, 30).id).toBe(2);
  });

  it("throws for out-of-range level", () => {
    expect(() => packForLevel(index, 31)).toThrow("No pack contains level 31");
  });
});

describe("isLevelUnlocked", () => {
  const index = makeIndex();

  it("level 0 is false", () => {
    expect(isLevelUnlocked(createNewSave(), index, 0)).toBe(false);
  });

  it("current level is true", () => {
    const save = createNewSave();
    expect(isLevelUnlocked(save, index, save.currentLevel)).toBe(true);
  });

  it("currentLevel + 1 is false", () => {
    const save = createNewSave();
    expect(isLevelUnlocked(save, index, save.currentLevel + 1)).toBe(false);
  });

  it("level > totalLevels is false", () => {
    expect(isLevelUnlocked(createNewSave(), index, 31)).toBe(false);
  });
});

describe("completeLevel", () => {
  const index = makeIndex();

  it("completes level 1 when current is 1: current becomes 2, +10 coins, no pack", () => {
    const save = createNewSave();
    const result = completeLevel(save, index, 1);
    expect(result.isReplay).toBe(false);
    expect(result.coinsEarned).toBe(LEVEL_REWARD);
    expect(result.packCompleted).toBeNull();
    expect(result.save.currentLevel).toBe(2);
    expect(result.save.coins).toBe(START_COINS + LEVEL_REWARD);
    expect(result.save.inProgress).toBeNull();
  });

  it("completes level 15 (last of pack 1): +60 coins, packCompleted set", () => {
    const save = { ...createNewSave(), currentLevel: 15 };
    const result = completeLevel(save, index, 15);
    expect(result.coinsEarned).toBe(LEVEL_REWARD + PACK_REWARD);
    expect(result.packCompleted).not.toBeNull();
    expect(result.packCompleted!.id).toBe(1);
  });

  it("replay: level 3 with current 10 returns unchanged save, coinsEarned 0", () => {
    const save = { ...createNewSave(), currentLevel: 10 };
    const result = completeLevel(save, index, 3);
    expect(result.isReplay).toBe(true);
    expect(result.coinsEarned).toBe(0);
    expect(result.packCompleted).toBeNull();
    expect(result.save).toBe(save); // same object
  });

  it("locked level throws", () => {
    const save = createNewSave();
    expect(() => completeLevel(save, index, 2)).toThrow("level is locked");
  });
});

describe("complimentForStreak", () => {
  it("streak 1 returns null", () => {
    expect(complimentForStreak(1)).toBeNull();
  });

  it("streak 2 returns 'Good!'", () => {
    expect(complimentForStreak(2)).toBe("Good!");
  });

  it("streak 6 returns 'Outstanding!'", () => {
    expect(complimentForStreak(6)).toBe("Outstanding!");
  });

  it("streak 9 returns 'Outstanding!' (clamped)", () => {
    expect(complimentForStreak(9)).toBe("Outstanding!");
  });
});

describe("pickLevelCompliment", () => {
  it("picks from LEVEL_COMPLIMENTS", () => {
    const rng = createRng(42) as Rng;
    const result = pickLevelCompliment(rng);
    expect(["Splendid!", "Brilliant!", "Excellent!", "Fantastic!", "Superb!"]).toContain(result);
  });
});
