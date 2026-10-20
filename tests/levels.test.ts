/**
 * Integration tests for level generation and validation.
 *
 * Reads the generated files from public/levels/ with readFileSync.
 * Does NOT call generate().
 *
 * Run: npm test -- tests/levels.test.ts
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import type { Level, LevelIndex } from "../src/core/types";
import { validateLevel } from "../tools/levelgen/validate";
import { TIERS } from "../tools/levelgen/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = join(__dirname, "../public/levels");

function loadIndex(): LevelIndex {
  const raw = readFileSync(join(LEVELS_DIR, "index.json"), "utf8");
  return JSON.parse(raw) as LevelIndex;
}

function loadPack(packId: number): { packId: number; levels: Level[] } {
  const raw = readFileSync(
    join(LEVELS_DIR, `pack-${String(packId).padStart(3, "0")}.json`),
    "utf8"
  );
  return JSON.parse(raw);
}

describe("Level generation", () => {
  it("index has 40 packs and totalLevels === 600", () => {
    const index = loadIndex();
    expect(index.totalLevels).toBe(600);
    expect(index.packs).toHaveLength(40);
    expect(new Set(index.packs.map((p) => p.areaId)).size).toBe(10);
    index.packs.forEach((p, i) => {
      expect(p.file).toBe(`levels/pack-${String(i + 1).padStart(3, "0")}.json`);
      expect(p.timeOfDay).toBe(["dawn", "day", "dusk", "night"][i % 4]);
      expect(p.firstLevel).toBe(i * 15 + 1);
    });
  });

  it("level ids across packs are exactly 1..600 in order; each level's packId matches its pack", () => {
    const index = loadIndex();
    const allIds: number[] = [];
    for (const packMeta of index.packs) {
      const pack = loadPack(packMeta.id);
      expect(pack.packId).toBe(packMeta.id);
      for (const level of pack.levels) {
        allIds.push(level.id);
        expect(level.packId).toBe(packMeta.id);
      }
    }
    allIds.sort((a, b) => a - b);
    for (let i = 0; i < 600; i++) {
      expect(allIds[i]).toBe(i + 1);
    }
  });

  it("validateLevel returns [] for every level", () => {
    const index = loadIndex();
    for (const packMeta of index.packs) {
      const pack = loadPack(packMeta.id);
      for (const level of pack.levels) {
        const errors = validateLevel(level);
        expect(errors).toHaveLength(0);
      }
    }
  });

  it("each level's letters.length equals TIERS wheel size for its id, and words.length is within [minWords, maxWords]", () => {
    const index = loadIndex();
    for (const packMeta of index.packs) {
      const pack = loadPack(packMeta.id);
      for (const level of pack.levels) {
        const tier = TIERS.find(
          (t) => level.id >= t.fromLevel && level.id <= t.toLevel
        );
        expect(tier).toBeDefined();
        expect(level.letters.length).toBe(tier!.wheel);
        expect(level.words.length).toBeGreaterThanOrEqual(tier!.minWords);
        expect(level.words.length).toBeLessThanOrEqual(tier!.maxWords);
      }
    }
  });

  it("no two levels share the same lettersKey", () => {
    const index = loadIndex();
    const keys = new Set<string>();
    for (const packMeta of index.packs) {
      const pack = loadPack(packMeta.id);
      for (const level of pack.levels) {
        const key = level.letters.slice().sort().join("");
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
    }
  });
});
