/**
 * Level generator CLI — produces 600 levels from SEED.
 *
 * Files:
 * - tools/levelgen/generate.ts
 *
 * Procedure (from docs/05-level-generator.md):
 *   1. Load word lists
 *   2. Pick a 3-letter word from SEED
 *   3. Grow layout (buildLayout)
 *   4. Assign words to cells
 *   5. Validate the level
 *   6. Emit JSON
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Rng, Level, LevelIndex } from "../../src/core/types";
import { shuffle } from "../../src/core/rng";
import { TIMES_OF_DAY } from "../../src/core/constants";

const TIME_NAMES = ["Dawn", "Day", "Dusk", "Night"] as const;
import { loadWordLists, canMakeFrom } from "./words";
import { buildLayout, LayoutResult } from "./layout";
import { validateLevel } from "./validate";
import {
  SEED,
  LEVELS_PER_PACK,
  LAYOUT_ATTEMPTS,
  TIERS,
  AREAS,
} from "./config";

const __dirname = join(fileURLToPath(import.meta.url), "..");

/** Simple seeded PRNG (mulberry32). */
function createRng(seed: number): Rng {
  let s = seed | 0;
  return function rng() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t =
      Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a single level. Never returns null — always succeeds. */
function generateLevel(levelNum: number, usedKeys: Set<string>): Level {
  const wordLists = loadWordLists(join(__dirname, "../../data/words"));

  const tier = TIERS.find((t) => levelNum >= t.fromLevel && levelNum <= t.toLevel)
    ?? TIERS[TIERS.length - 1];
  const minWords = tier.minWords;
  const maxWords = tier.maxWords;
  const maxRows = tier.maxRows;
  const maxCols = tier.maxCols;

  // Filter seed words to only those matching the tier's wheel size
  const seedWords = Array.from(wordLists.answers.keys()).filter(
    (w) => w.length === tier.wheel
  );

  if (seedWords.length === 0) {
    throw new Error(`Level ${levelNum}: no seed words of length ${tier.wheel}`);
  }

  // Shuffle seed words for this level so we try different candidates
  const shuffledSeeds = shuffle([...seedWords], createRng(SEED + levelNum));

  // Try each seed word until layout succeeds
  for (const seedWord of shuffledSeeds) {
    const upperSeed = seedWord.toUpperCase();

    // Filter candidates to only words that can be made from the base word
    const candidates = Array.from(wordLists.answers.keys())
      .map((w) => w.toUpperCase())
      .filter(
        (w) =>
          w.length >= 3 &&
          w.length <= maxCols &&
          canMakeFrom(w, upperSeed)
      );

    // Build layout
    let layoutResult: LayoutResult | null = null;
    for (let attempt = 0; attempt < LAYOUT_ATTEMPTS; attempt++) {
      const attemptRng = createRng(SEED + levelNum + attempt * 1000);
      layoutResult = buildLayout(
        upperSeed,
        candidates,
        maxWords,
        maxRows,
        maxCols,
        attemptRng
      );
      if (layoutResult && layoutResult.words.length >= minWords) break;
      layoutResult = null;
    }

    if (layoutResult && layoutResult.words.length >= minWords) {
      // Extract letters from the base word only (sorted, with duplicates)
      const letters = Array.from(upperSeed).sort();
      const lettersStr = letters.join("");

      // Find all valid bonus words
      const validWords: string[] = [layoutResult.words[0].word];
      const usedWords = new Set<string>(layoutResult.words.map((pw) => pw.word));

      for (const word of wordLists.valid) {
        if (usedWords.has(word)) continue;
        if (word.length < 3) continue;
        if (word.length > maxCols) continue;
        if (!canMakeFrom(word, lettersStr)) continue;
        validWords.push(word);
      }

      // Sort bonus words alphabetically
      validWords.sort((a, b) => a.localeCompare(b));

      // Build Level object
      const level: Level = {
        id: levelNum,
        packId: Math.ceil(levelNum / LEVELS_PER_PACK),
        letters,
        rows: layoutResult.rows,
        cols: layoutResult.cols,
        words: layoutResult.words,
        bonus: validWords.filter((w) => !usedWords.has(w)),
      };

      // Validate the level
      const errors = validateLevel(level);
      if (errors.length === 0) {
        // Check for duplicate lettersKey
        const key = level.letters.slice().sort().join("");
        if (usedKeys.has(key)) {
          continue;
        }
        usedKeys.add(key);
        return level;
      }
    }
  }

  // Should never reach here — we've exhausted all seed words
  throw new Error(`Level ${levelNum}: could not generate with any seed word`);
}

/** Generate N levels and write to output file. */
export function generate(count: number = 600): Level[] {
  const outputDir = join(__dirname, "../../public/levels");
  mkdirSync(outputDir, { recursive: true });

  const levels: Level[] = [];
  const usedKeys = new Set<string>();

  for (let i = 1; i <= count; i++) {
    const level = generateLevel(i, usedKeys);
    if (level) {
      levels.push(level);
    }
  }

  // Group levels by pack
  const packs = new Map<number, Level[]>();
  for (const level of levels) {
    if (!packs.has(level.packId)) packs.set(level.packId, []);
    packs.get(level.packId)!.push(level);
  }

  // Write pack files
  const packFiles: { packId: number; file: string }[] = [];
  for (const [packId, packLevels] of packs) {
    const fileName = `pack-${String(packId).padStart(3, "0")}.json`;
    const packPath = join(outputDir, fileName);
    const packData = { packId, levels: packLevels };
    writeFileSync(packPath, JSON.stringify(packData, null, 2), "utf-8");
    packFiles.push({ packId, file: `levels/${fileName}` });
  }

  // Write index.json
  const indexOutput = join(outputDir, "index.json");
  const indexData: LevelIndex = {
    version: 1,
    totalLevels: count,
    packs: packFiles.map((pf) => ({
      id: pf.packId,
      areaId: AREAS[Math.floor((pf.packId - 1) / 4)].id,
      areaName: AREAS[Math.floor((pf.packId - 1) / 4)].name,
      packName: TIME_NAMES[(pf.packId - 1) % 4],
      timeOfDay: TIMES_OF_DAY[(pf.packId - 1) % 4],
      firstLevel: (pf.packId - 1) * LEVELS_PER_PACK + 1,
      levelCount: LEVELS_PER_PACK,
      file: pf.file,
    })),
  };
  writeFileSync(indexOutput, JSON.stringify(indexData, null, 2), "utf-8");

  console.log(`Generated ${levels.length}/${count} levels`);

  return levels;
}

// CLI entry point
if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const count = parseInt(process.argv[2] || "600", 10);
  generate(count);
}
