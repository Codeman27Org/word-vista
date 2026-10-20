import { LEVELS_PER_PACK as _LP } from "../../src/core/constants";

export const SEED = 20261012;
export const TOTAL_PACKS = 40;
/** Re-export from src/core/constants. */
export const LEVELS_PER_PACK = _LP;
export const LAYOUT_ATTEMPTS = 40;
export const MAX_BASE_TRIES = 400;

export const AREAS = [
  { id: "meadow", name: "Meadow" },
  { id: "canyon", name: "Canyon" },
  { id: "forest", name: "Forest" },
  { id: "lagoon", name: "Lagoon" },
  { id: "highlands", name: "Highlands" },
  { id: "desert", name: "Desert" },
  { id: "coast", name: "Coast" },
  { id: "glacier", name: "Glacier" },
  { id: "bamboo", name: "Bamboo" },
  { id: "summit", name: "Summit" },
] as const;

export interface Tier {
  fromLevel: number;
  toLevel: number;
  wheel: number;
  minWords: number;
  maxWords: number;
  maxRows: number;
  maxCols: number;
  baseTier: number;
  answerTier: number;
}

export const TIERS: Tier[] = [
  { fromLevel: 1, toLevel: 10, wheel: 4, minWords: 3, maxWords: 4, maxRows: 6, maxCols: 6, baseTier: 10, answerTier: 20 },
  { fromLevel: 11, toLevel: 40, wheel: 5, minWords: 4, maxWords: 6, maxRows: 7, maxCols: 7, baseTier: 20, answerTier: 35 },
  { fromLevel: 41, toLevel: 120, wheel: 6, minWords: 5, maxWords: 8, maxRows: 9, maxCols: 9, baseTier: 20, answerTier: 35 },
  { fromLevel: 121, toLevel: 300, wheel: 6, minWords: 7, maxWords: 10, maxRows: 10, maxCols: 10, baseTier: 35, answerTier: 35 },
  { fromLevel: 301, toLevel: 600, wheel: 7, minWords: 8, maxWords: 12, maxRows: 10, maxCols: 10, baseTier: 35, answerTier: 35 },
];
