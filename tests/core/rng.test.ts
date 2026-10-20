import { describe, it, expect } from "vitest";
import { createRng, randInt, shuffle, pick } from "../../src/core/rng";

describe("createRng", () => {
  it("two RNGs with seed 42 produce identical first 5 values", () => {
    const r1 = createRng(42);
    const r2 = createRng(42);
    for (let i = 0; i < 5; i++) {
      expect(r1()).toBe(r2());
    }
  });

  it("seed 43 differs from seed 42", () => {
    const r1 = createRng(42);
    const r2 = createRng(43);
    expect(r1()).not.toBe(r2());
  });

  it("1000 values are all >= 0 and < 1", () => {
    const rng = createRng(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("randInt", () => {
  it("randInt(rng, 6) over 1000 calls stays in 0..5 and hits every value", () => {
    const rng = createRng(42);
    const hits = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = randInt(rng, 6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
      hits.add(v);
    }
    expect(hits.size).toBe(6);
  });
});

describe("shuffle", () => {
  it("returns same array instance", () => {
    const arr = [1, 2, 3];
    const rng = createRng(42);
    expect(shuffle(arr, rng)).toBe(arr);
  });

  it("same sorted contents after shuffle", () => {
    const arr = [3, 1, 4, 1, 5];
    const rng = createRng(42);
    shuffle(arr, rng);
    const sorted = [...arr].sort();
    expect(sorted).toEqual([1, 1, 3, 4, 5]);
  });
});

describe("pick", () => {
  it("throws on empty array", () => {
    const rng = createRng(42);
    expect(() => pick([], rng)).toThrow("pick from empty array");
  });
});
