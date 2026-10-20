import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { loadWordLists, lettersKey, canMakeFrom } from "../../tools/levelgen/words";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_DIR = join(__dirname, "..", "..", "data", "words");

describe("lettersKey", () => {
  it('lettersKey("PLANET") === "AELNPT"', () => {
    expect(lettersKey("PLANET")).toBe("AELNPT");
  });
});

describe("canMakeFrom", () => {
  it('canMakeFrom("PLAN", "PLANET") is true', () => {
    expect(canMakeFrom("PLAN", "PLANET")).toBe(true);
  });

  it('canMakeFrom("PEEL", "PLANET") is false', () => {
    expect(canMakeFrom("PEEL", "PLANET")).toBe(false);
  });
});

describe("loadWordLists", () => {
  it("loads a large word list", () => {
    const wl = loadWordLists(WORDS_DIR);
    expect(wl.answers.size).toBeGreaterThan(15000);
    expect(wl.valid.size).toBeGreaterThan(50000);
  });

  it("has PLANET in answers with a valid tier", () => {
    const wl = loadWordLists(WORDS_DIR);
    const tier = wl.answers.get("PLANET");
    expect([10, 20, 35]).toContain(tier);
  });

  it("has PLANET in valid", () => {
    const wl = loadWordLists(WORDS_DIR);
    expect(wl.valid.has("PLANET")).toBe(true);
  });
});
