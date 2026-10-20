import { describe, it, expect } from "vitest";
import { buildLayout } from "../../tools/levelgen/layout";
import { createRng } from "../../src/core/rng";

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

describe("buildLayout", () => {
  const base = "PLANET";
  const candidates = ["PLANT", "PANEL", "PENAL", "PALE", "PLATE", "LEAP", "ATE", "NET", "TAN"];
  const rng = createRng(1);
  const result = buildLayout(base, candidates, 6, 9, 9, rng);

  it("words[0] is the base word PLANET", () => {
    expect(result.words[0].word).toBe("PLANET");
  });

  it("3 <= words.length <= 6", () => {
    expect(result.words.length).toBeGreaterThanOrEqual(3);
    expect(result.words.length).toBeLessThanOrEqual(6);
  });

  it("rows <= 9", () => {
    expect(result.rows).toBeLessThanOrEqual(9);
  });

  it("cols <= 9", () => {
    expect(result.cols).toBeLessThanOrEqual(9);
  });

  it("every word fits inside rows x cols", () => {
    for (const w of result.words) {
      if (w.dir === "across") {
        expect(w.col + w.word.length).toBeLessThanOrEqual(result.cols);
      } else {
        expect(w.row + w.word.length).toBeLessThanOrEqual(result.rows);
      }
    }
  });

  it("min row = 0 and min col = 0 across all cells", () => {
    let minR = Infinity, minC = Infinity;
    for (const w of result.words) {
      for (let k = 0; k < w.word.length; k++) {
        const r = w.dir === "down" ? w.row + k : w.row;
        const c = w.dir === "across" ? w.col + k : w.col;
        if (r < minR) minR = r;
        if (c < minC) minC = c;
      }
    }
    expect(minR).toBe(0);
    expect(minC).toBe(0);
  });

  it("overlapping cells always agree on the letter", () => {
    const cellMap = new Map<string, string>();
    for (const w of result.words) {
      for (let k = 0; k < w.word.length; k++) {
        const r = w.dir === "down" ? w.row + k : w.row;
        const c = w.dir === "across" ? w.col + k : w.col;
        const key = `${r},${c}`;
        if (cellMap.has(key)) {
          expect(cellMap.get(key)).toBe(w.word[k]);
        } else {
          cellMap.set(key, w.word[k]);
        }
      }
    }
  });

  it("same seed twice produces deep-equal results", () => {
    const r1 = createRng(1);
    const res1 = buildLayout(base, candidates, 6, 9, 9, r1);
    const r2 = createRng(1);
    const res2 = buildLayout(base, candidates, 6, 9, 9, r2);
    expect(deepEqual(res1, res2)).toBe(true);
  });

  it("with maxRows 6, maxCols 6, result still contains PLANET and respects 6x6", () => {
    const rng6 = createRng(1);
    const res6 = buildLayout(base, candidates, 6, 6, 6, rng6);
    const hasPlanet = res6.words.some((w) => w.word === "PLANET");
    expect(hasPlanet).toBe(true);
    expect(res6.rows).toBeLessThanOrEqual(6);
    expect(res6.cols).toBeLessThanOrEqual(6);
  });
});
