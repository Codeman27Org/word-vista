import type { Level } from "../../src/core/types";

export const LEVEL12: Level = {
  id: 12,
  packId: 1,
  letters: ["T", "E", "P", "L", "N", "A"],
  rows: 6,
  cols: 7,
  words: [
    { word: "PLANET", row: 1, col: 1, dir: "across" },
    { word: "PLANT", row: 1, col: 1, dir: "down" },
    { word: "PENAL", row: 0, col: 5, dir: "down" },
    { word: "PANEL", row: 0, col: 3, dir: "down" },
    { word: "PALE", row: 3, col: 0, dir: "across" },
    { word: "ATE", row: 5, col: 0, dir: "across" },
  ],
  bonus: [
    "ALE", "ANT", "APE", "EAT", "LANE", "LATE", "LEAN", "LEAP", "LENT",
    "NAP", "NET", "PAN", "PANE", "PANT", "PAT", "PEA", "PEN", "PET",
    "PLAN", "PLEAT", "TAN", "TAP", "TEA", "TEN",
  ],
};
