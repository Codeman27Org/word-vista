import { describe, it, expect } from "vitest";
import { normalizeWord, countLetters, canMake, sameLetters } from "../../src/core/letters";

describe("canMake", () => {
  it('canMake("PLAN", "PLANET") is true', () => {
    expect(canMake("PLAN", "PLANET")).toBe(true);
  });

  it('canMake("PEEL", "PLANET") is false', () => {
    expect(canMake("PEEL", "PLANET")).toBe(false);
  });

  it('canMake("", "ABC") is false', () => {
    expect(canMake("", "ABC")).toBe(false);
  });

  it('canMake("LETTER", ["L","E","T","T","E","R"]) is true', () => {
    expect(canMake("LETTER", ["L", "E", "T", "T", "E", "R"])).toBe(true);
  });

  it('canMake("LETTERS", "LETTER") is false', () => {
    expect(canMake("LETTERS", "LETTER")).toBe(false);
  });
});

describe("normalizeWord", () => {
  it('normalizeWord("  plane ") returns "PLANE"', () => {
    expect(normalizeWord("  plane ")).toBe("PLANE");
  });
});

describe("countLetters", () => {
  it("counts letters correctly", () => {
    const map = countLetters("LETTER");
    expect(map.get("L")).toBe(1);
    expect(map.get("E")).toBe(2);
    expect(map.get("T")).toBe(2);
    expect(map.get("R")).toBe(1);
  });
});

describe("sameLetters", () => {
  it('sameLetters(["A","B","B"], ["B","A","B"]) is true', () => {
    expect(sameLetters(["A", "B", "B"], ["B", "A", "B"])).toBe(true);
  });

  it('sameLetters(["A","B"], ["A","B","B"]) is false', () => {
    expect(sameLetters(["A", "B"], ["A", "B", "B"])).toBe(false);
  });
});
