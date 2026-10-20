import { describe, it, expect } from "vitest";
import {
  applyHint,
  createLevelState,
  hasUnfilledCells,
  isLevelComplete,
  shuffleWheel,
  submitWord,
  toProgress,
} from "../../src/core/game";
import { sameLetters } from "../../src/core/letters";
import { createRng } from "../../src/core/rng";
import type { LevelState } from "../../src/core/types";
import { LEVEL12 } from "../fixtures/level12";

function fresh(): LevelState {
  return createLevelState(LEVEL12);
}

describe("createLevelState", () => {
  it("starts with level letters and empty arrays", () => {
    const s = fresh();
    expect(s.wheel).toEqual(LEVEL12.letters);
    expect(s.found).toEqual([]);
    expect(s.revealed).toEqual([]);
    expect(s.bonusFound).toEqual([]);
    expect(s.streak).toBe(0);
  });

  it("ignores progress for another level", () => {
    const s = createLevelState(LEVEL12, { levelId: 99, wheel: [], found: ["PLANET"], revealed: [], bonusFound: [] });
    expect(s.found).toEqual([]);
  });

  it("drops unknown words/keys and a wheel with wrong letters", () => {
    const s = createLevelState(LEVEL12, {
      levelId: 12,
      wheel: ["X", "Y", "Z", "Q", "R", "S"],
      found: ["PLANET", "BOGUS"],
      revealed: ["5,0", "9,9"],
      bonusFound: ["PANE", "NOPE"],
    });
    expect(s.wheel).toEqual(LEVEL12.letters);
    expect(s.found).toEqual(["PLANET"]);
    expect(s.revealed).toEqual(["5,0"]);
    expect(s.bonusFound).toEqual(["PANE"]);
  });
});

describe("submitWord", () => {
  it("tooShort", () => {
    const s = fresh();
    const r = submitWord(s, "pl");
    expect(r.result.kind).toBe("tooShort");
    expect(r.state).toBe(s);
  });

  it("found (lowercase input), then alreadyFound resets streak", () => {
    const r1 = submitWord(fresh(), "planet");
    expect(r1.result).toMatchObject({ kind: "found", word: "PLANET", wordIndex: 0 });
    expect(r1.state.found).toContain("PLANET");
    expect(r1.state.streak).toBe(1);
    const r2 = submitWord(r1.state, "PLANET");
    expect(r2.result).toMatchObject({ kind: "alreadyFound", wordIndex: 0 });
    expect(r2.state.streak).toBe(0);
  });

  it("bonus, bonusAlready, invalid", () => {
    const r1 = submitWord(fresh(), "PANE");
    expect(r1.result.kind).toBe("bonus");
    expect(r1.state.bonusFound).toEqual(["PANE"]);
    const r2 = submitWord(r1.state, "PANE");
    expect(r2.result.kind).toBe("bonusAlready");
    expect(r2.state.bonusFound).toEqual(["PANE"]);
    const r3 = submitWord({ ...r2.state, streak: 2 }, "XYZ");
    expect(r3.result.kind).toBe("invalid");
    expect(r3.state.streak).toBe(0);
  });

  it("letters makeable from the wheel but not in the bonus list are invalid", () => {
    expect(submitWord(fresh(), "LTA").result.kind).toBe("invalid");
  });

  it("bonus does not change the streak", () => {
    let s = submitWord(fresh(), "PLANET").state;
    s = submitWord(s, "PANE").state;
    expect(s.streak).toBe(1);
  });

  it("streak counts consecutive finds", () => {
    let s = fresh();
    for (const w of ["PLANET", "PLANT", "PALE"]) s = submitWord(s, w).state;
    expect(s.streak).toBe(3);
  });

  it("auto-solves a word completed by a crossing", () => {
    const s = createLevelState(LEVEL12, {
      levelId: 12,
      wheel: [...LEVEL12.letters],
      found: ["PALE"],
      revealed: ["5,0", "5,2"],
      bonusFound: [],
    });
    expect(s.found).not.toContain("ATE");
    const r = submitWord(s, "PLANT");
    expect(r.result).toMatchObject({ kind: "found", autoFound: [5] });
    expect(r.state.found).toContain("ATE");
  });

  it("finding every word completes the level", () => {
    let s = fresh();
    let last = submitWord(s, LEVEL12.words[0].word);
    for (const w of LEVEL12.words) {
      if (s.found.includes(w.word)) continue;
      last = submitWord(s, w.word);
      s = last.state;
    }
    expect(last.result).toMatchObject({ kind: "found", completesLevel: true });
    expect(isLevelComplete(s)).toBe(true);
    expect(hasUnfilledCells(s)).toBe(false);
  });

  it("does not mutate the input state", () => {
    const s = fresh();
    const before = structuredClone(s);
    submitWord(s, "PLANET");
    submitWord(s, "PANE");
    submitWord(s, "XYZ");
    expect(s).toEqual(before);
  });
});

describe("applyHint", () => {
  it("reveals each unfilled cell exactly once, then none", () => {
    const rng = createRng(1);
    let s = fresh();
    const keys: string[] = [];
    let completes = 0;
    let nones = 0;
    for (let i = 0; i < 30; i++) {
      const r = applyHint(s, rng);
      if (r.result.kind === "revealed") {
        keys.push(r.result.key);
        if (r.result.completesLevel) completes++;
      } else {
        nones++;
        expect(r.state).toBe(s);
      }
      s = r.state;
    }
    expect(keys).toHaveLength(22);
    expect(new Set(keys).size).toBe(22);
    expect(nones).toBe(8);
    expect(completes).toBe(1);
    expect(isLevelComplete(s)).toBe(true);
  });

  it("does not change the streak or mutate input", () => {
    const s = { ...fresh(), streak: 2 };
    const before = structuredClone(s);
    const r = applyHint(s, createRng(1));
    expect(r.state.streak).toBe(2);
    expect(s).toEqual(before);
  });
});

describe("shuffleWheel / toProgress", () => {
  it("keeps the letters and changes the order", () => {
    const s = fresh();
    const t = shuffleWheel(s, createRng(1));
    expect(sameLetters(t.wheel, s.wheel)).toBe(true);
    expect(t.wheel.join("")).not.toBe(s.wheel.join(""));
    expect(s.wheel).toEqual(LEVEL12.letters);
  });

  it("round-trips through progress", () => {
    let s = shuffleWheel(fresh(), createRng(3));
    s = submitWord(s, "PLANET").state;
    s = submitWord(s, "PANE").state;
    s = applyHint(s, createRng(2)).state;
    const restored = createLevelState(LEVEL12, toProgress(s));
    expect(restored.wheel).toEqual(s.wheel);
    expect(restored.found).toEqual(s.found);
    expect(restored.revealed).toEqual(s.revealed);
    expect(restored.bonusFound).toEqual(s.bonusFound);
  });
});
