import { describe, it, expect } from "vitest";
import { createLevelRepo } from "../../src/data/levelRepo";
import type { FetchFn } from "../../src/data/levelRepo";
import type { LevelIndex, PackFile } from "../../src/core/types";

function makeFakeFetch(
  index: LevelIndex,
  pack: PackFile,
): { fetchFn: FetchFn; callCount: number } {
  let callCount = 0;
  const fetchFn: FetchFn = async (url: string) => {
    callCount++;
    if (url.endsWith("index.json")) {
      return { ok: true, status: 200, json: () => Promise.resolve(index as unknown as Record<string, unknown>) };
    }
    if (url.endsWith(".json")) {
      return { ok: true, status: 200, json: () => Promise.resolve(pack as unknown as Record<string, unknown>) };
    }
    return { ok: false, status: 404, json: () => Promise.reject(new Error("not found")) };
  };
  return { fetchFn, callCount };
}

function makeIndex(): LevelIndex {
  return {
    version: 1,
    totalLevels: 15,
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
    ],
  };
}

function makePack(): PackFile {
  return {
    packId: 1,
    levels: [
      { id: 1, packId: 1, letters: ["A", "B", "C"], rows: 3, cols: 3, words: [{ word: "ABC", row: 0, col: 0, dir: "across" }], bonus: [] },
      { id: 2, packId: 1, letters: ["D", "E", "F"], rows: 3, cols: 3, words: [{ word: "DEF", row: 0, col: 0, dir: "across" }], bonus: [] },
    ],
  };
}

describe("getIndex", () => {
  it("getIndex() twice → 1 fetch", async () => {
    const index = makeIndex();
    const pack = makePack();
    const { fetchFn, callCount } = makeFakeFetch(index, pack);
    const repo = createLevelRepo("./", fetchFn);

    await repo.getIndex();
    const before = callCount;
    await repo.getIndex();
    const after = callCount;

    expect(after - before).toBe(0);
  });
});

describe("getLevel", () => {
  it("getLevel(2) returns id 2", async () => {
    const index = makeIndex();
    const pack = makePack();
    const { fetchFn } = makeFakeFetch(index, pack);
    const repo = createLevelRepo("./", fetchFn);

    const level = await repo.getLevel(2);
    expect(level.id).toBe(2);
  });

  it("getLevel(1) does not refetch the pack", async () => {
    const index = makeIndex();
    const pack = makePack();
    const { fetchFn, callCount } = makeFakeFetch(index, pack);
    const repo = createLevelRepo("./", fetchFn);

    await repo.getLevel(2);
    const before = callCount;
    await repo.getLevel(1);
    const after = callCount;

    expect(after - before).toBe(0);
  });

  it("getLevel(99) rejects", async () => {
    const index = makeIndex();
    const pack = makePack();
    const { fetchFn } = makeFakeFetch(index, pack);
    const repo = createLevelRepo("./", fetchFn);

    await expect(repo.getLevel(99)).rejects.toThrow(/Level 99|pack/);
  });
});

describe("fetch failures", () => {
  it("a fetch returning ok: false rejects", async () => {
    const fetchFn: FetchFn = async () => ({ ok: false, status: 500, json: () => Promise.resolve({}) });
    const repo = createLevelRepo("./", fetchFn);

    await expect(repo.getIndex()).rejects.toThrow("Failed to load");
  });

  it("a later call retries", async () => {
    let callCount = 0;
    const fetchFn: FetchFn = async (_url: string) => {
      callCount++;
      if (callCount === 1) {
        return { ok: false, status: 500, json: () => Promise.resolve({}) };
      }
      const index: LevelIndex = {
        version: 1,
        totalLevels: 15,
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
        ],
      };
      return { ok: true, status: 200, json: () => Promise.resolve(index as unknown as Record<string, unknown>) };
    };
    const repo = createLevelRepo("./", fetchFn);

    await expect(repo.getIndex()).rejects.toThrow("Failed to load");
    // Retry should succeed
    const result = await repo.getIndex();
    expect(result.version).toBe(1);
  });
});
