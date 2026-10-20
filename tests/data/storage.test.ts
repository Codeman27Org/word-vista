import { describe, it, expect } from "vitest";
import { loadSave, writeSave, clearSave } from "../../src/data/storage";
import { createNewSave } from "../../src/core/economy";
import { SAVE_KEY } from "../../src/core/constants";
import type { SaveData } from "../../src/core/types";

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function makeStore(data: Record<string, string | null> = {}): KeyValueStore {
  const map = new Map<string, string | null>(Object.entries(data));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  };
}

describe("loadSave", () => {
  it("empty store → createNewSave() values", () => {
    const store = makeStore();
    const save = loadSave(store);
    const expected = createNewSave();
    expect(save).toEqual(expected);
  });

  it('"not json" → new save', () => {
    const store = makeStore({ [SAVE_KEY]: "not json" });
    const save = loadSave(store);
    expect(save).toEqual(createNewSave());
  });

  it("{ version: 2 } → new save", () => {
    const store = makeStore({ [SAVE_KEY]: JSON.stringify({ version: 2 }) });
    const save = loadSave(store);
    expect(save).toEqual(createNewSave());
  });

  it('coins: "lots" → new save', () => {
    const store = makeStore({ [SAVE_KEY]: JSON.stringify({ version: 1, coins: "lots" }) });
    const save = loadSave(store);
    expect(save).toEqual(createNewSave());
  });

  it("coins: -5 → clamped to 0", () => {
    const store = makeStore({
      [SAVE_KEY]: JSON.stringify({ version: 1, currentLevel: 1, coins: -5, bonusMeter: 0, totalBonusFound: 0, settings: { sound: true } }),
    });
    const save = loadSave(store);
    expect(save.coins).toBe(0);
  });

  it("bonusMeter: 14 → clamped to 9", () => {
    const store = makeStore({
      [SAVE_KEY]: JSON.stringify({ version: 1, currentLevel: 1, coins: 100, bonusMeter: 14, totalBonusFound: 0, settings: { sound: true } }),
    });
    const save = loadSave(store);
    expect(save.bonusMeter).toBe(9);
  });

  it("currentLevel: 0 → 1", () => {
    const store = makeStore({ [SAVE_KEY]: JSON.stringify({ version: 1, currentLevel: 0 }) });
    const save = loadSave(store);
    expect(save.currentLevel).toBe(1);
  });

  it("inProgress.levelId ≠ currentLevel → inProgress null", () => {
    const store = makeStore({
      [SAVE_KEY]: JSON.stringify({
        version: 1,
        currentLevel: 5,
        coins: 100,
        bonusMeter: 0,
        totalBonusFound: 0,
        inProgress: { levelId: 3, wheel: [], found: [], revealed: [], bonusFound: [] },
        settings: { sound: true },
      }),
    });
    const save = loadSave(store);
    expect(save.inProgress).toBeNull();
  });

  it("writeSave then loadSave round-trip equals the original", () => {
    const store = makeStore();
    const original: SaveData = {
      version: 1,
      currentLevel: 5,
      coins: 200,
      bonusMeter: 3,
      totalBonusFound: 7,
      inProgress: { levelId: 5, wheel: ["A", "B"], found: ["AB"], revealed: ["0,0"], bonusFound: [] },
      settings: { sound: false },
    };
    writeSave(original, store);
    const loaded = loadSave(store);
    expect(loaded).toEqual(original);
  });

  it("a store whose getItem throws → new save (no exception)", () => {
    const store = {
      getItem: () => { throw new Error("private mode"); },
      setItem: () => {},
      removeItem: () => {},
    };
    const save = loadSave(store);
    expect(save).toEqual(createNewSave());
  });
});

describe("clearSave", () => {
  it("removes the save key from the store", () => {
    const store = makeStore({ [SAVE_KEY]: "data" });
    clearSave(store);
    expect(store.getItem(SAVE_KEY)).toBeNull();
  });
});
