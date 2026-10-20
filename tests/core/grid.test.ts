import { describe, it, expect } from "vitest";
import {
  cellKey,
  parseKey,
  wordCells,
  buildCells,
  filledKeys,
  isWordFilled,
} from "../../src/core/grid";
import { LEVEL12 } from "../fixtures/level12";

describe("cellKey", () => {
  it('cellKey(3, 5) is "3,5"', () => {
    expect(cellKey(3, 5)).toBe("3,5");
  });
});

describe("parseKey", () => {
  it('parseKey("3,5") is { row: 3, col: 5 }', () => {
    expect(parseKey("3,5")).toEqual({ row: 3, col: 5 });
  });
});

describe("wordCells", () => {
  it("PLANET across at (1,1) → keys 1,1 … 1,6, letters P L A N E T", () => {
    const cells = wordCells({ word: "PLANET", row: 1, col: 1, dir: "across" });
    expect(cells).toHaveLength(6);
    expect(cells[0].key).toBe("1,1");
    expect(cells[1].key).toBe("1,2");
    expect(cells[2].key).toBe("1,3");
    expect(cells[3].key).toBe("1,4");
    expect(cells[4].key).toBe("1,5");
    expect(cells[5].key).toBe("1,6");
    expect(cells.map((c) => c.letter)).toEqual(["P", "L", "A", "N", "E", "T"]);
  });

  it("PLANT down at (1,1) → keys 1,1 2,1 3,1 4,1 5,1", () => {
    const cells = wordCells({ word: "PLANT", row: 1, col: 1, dir: "down" });
    expect(cells).toHaveLength(5);
    expect(cells.map((c) => c.key)).toEqual(["1,1", "2,1", "3,1", "4,1", "5,1"]);
  });
});

describe("buildCells", () => {
  it("buildCells(LEVEL12) has size 22", () => {
    const cells = buildCells(LEVEL12);
    expect(cells.size).toBe(22);
  });

  it('cell "1,1" has wordIndexes [0, 1] and letter "P"', () => {
    const cells = buildCells(LEVEL12);
    const cell = cells.get("1,1");
    expect(cell).toBeDefined();
    expect(cell!.wordIndexes).toEqual([0, 1]);
    expect(cell!.letter).toBe("P");
  });
});

describe("filledKeys", () => {
  it('filledKeys(LEVEL12, ["PLANET"], ["0,5"]) has 7 keys and contains "0,5" and "1,6"', () => {
    const filled = filledKeys(LEVEL12, ["PLANET"], ["0,5"]);
    expect(filled.size).toBe(7);
    expect(filled.has("0,5")).toBe(true);
    expect(filled.has("1,6")).toBe(true);
  });
});

describe("isWordFilled", () => {
  it("ATE (cells 5,0 5,1 5,2) is filled when found = [PALE, PLANT] plus revealed = [5,0, 5,2]", () => {
    const filled = filledKeys(LEVEL12, ["PALE", "PLANT"], ["5,0", "5,2"]);
    const ate = LEVEL12.words[5]; // ATE
    expect(isWordFilled(ate, filled)).toBe(true);
  });

  it("ATE is not filled with revealed = [5,2] only", () => {
    const filled = filledKeys(LEVEL12, ["PALE", "PLANT"], ["5,2"]);
    const ate = LEVEL12.words[5]; // ATE
    expect(isWordFilled(ate, filled)).toBe(false);
  });
});
