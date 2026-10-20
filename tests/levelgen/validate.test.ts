/**
 * Unit tests for level validation.
 *
 * Run: npm test -- tests/levelgen/validate.test.ts
 */

import { describe, it, expect } from "vitest";
import { validateLevel } from "../../tools/levelgen/validate";
import { LEVEL12 } from "../fixtures/level12";
import type { Level } from "../../src/core/types";

describe("validateLevel", () => {
  it("returns no errors for a valid level", () => {
    const errors = validateLevel(LEVEL12);
    expect(errors).toHaveLength(0);
  });

  it("detects invalid letters format", () => {
    const level = { ...LEVEL12, letters: ["AB", "C", "D"] } as Level;
    const errors = validateLevel(level);
    expect(errors.some((e) => e.includes("letters"))).toBe(true);
  });

  it("detects word count mismatch", () => {
    const level = { ...LEVEL12, words: [{ word: "CAT", row: 0, col: 0, dir: "across" }] } as Level;
    const errors = validateLevel(level);
    expect(errors.some((e) => e.includes("words.length"))).toBe(true);
  });

  it("detects invalid words", () => {
    const level = { ...LEVEL12, words: [{ word: "XYZ", row: 0, col: 0, dir: "across" }] } as Level;
    const errors = validateLevel(level);
    expect(errors.some((e) => e.includes("cannot be made from letters"))).toBe(true);
  });

  it("detects duplicate words", () => {
    const level = {
      ...LEVEL12,
      words: [
        { word: "CAT", row: 0, col: 0, dir: "across" },
        { word: "CAT", row: 1, col: 1, dir: "down" },
      ],
    } as Level;
    const errors = validateLevel(level);
    expect(errors.some((e) => e.includes("duplicate"))).toBe(true);
  });
});
