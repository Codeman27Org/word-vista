# 05 — Level Generator

Levels are generated **offline** by `npm run levels` and committed to `public/levels/`. The game never needs a dictionary at runtime: each level stores its own grid words and bonus words.
The algorithm below was prototyped and produces all 600 levels with every tier at its target word count.

## Files
- `tools/levelgen/config.ts` — constants below.
- `tools/levelgen/words.ts` — load word lists, `lettersKey`, `canMakeFrom`.
- `tools/levelgen/layout.ts` — `buildLayout()`, pure, deterministic for a given `Rng`.
- `tools/levelgen/validate.ts` — `validateLevel()`; CLI validates every pack file.
- `tools/levelgen/generate.ts` — CLI entry. Writes `public/levels/index.json` and `pack-001.json`…`pack-040.json`.
- Reuse `src/core/rng.ts` (`createRng`, `shuffle`) and `src/core/types.ts`.

## Config (`tools/levelgen/config.ts`, exact values)

```ts
export const SEED = 20261012;
export const TOTAL_PACKS = 40;
export const LEVELS_PER_PACK = 15; // re-export from src/core/constants if you prefer
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
  fromLevel: number; toLevel: number;
  wheel: number;      // letters on the wheel = length of base word
  minWords: number;   // minimum grid words (including base word)
  maxWords: number;   // stop placing at this many
  maxRows: number; maxCols: number;
  baseTier: number;   // base word must have answers.tsv tier <= this
  answerTier: number; // other grid words must have tier <= this
}

export const TIERS: Tier[] = [
  { fromLevel: 1,   toLevel: 10,  wheel: 4, minWords: 3, maxWords: 4,  maxRows: 6,  maxCols: 6,  baseTier: 10, answerTier: 20 },
  { fromLevel: 11,  toLevel: 40,  wheel: 5, minWords: 4, maxWords: 6,  maxRows: 7,  maxCols: 7,  baseTier: 20, answerTier: 35 },
  { fromLevel: 41,  toLevel: 120, wheel: 6, minWords: 5, maxWords: 8,  maxRows: 9,  maxCols: 9,  baseTier: 20, answerTier: 35 },
  { fromLevel: 121, toLevel: 300, wheel: 6, minWords: 7, maxWords: 10, maxRows: 10, maxCols: 10, baseTier: 35, answerTier: 35 },
  { fromLevel: 301, toLevel: 600, wheel: 7, minWords: 8, maxWords: 12, maxRows: 10, maxCols: 10, baseTier: 35, answerTier: 35 },
];
```

## Word helpers (`words.ts`)

```ts
export interface WordLists {
  answers: Map<string, number>; // UPPERCASE word -> tier (10|20|35)
  valid: Set<string>;           // UPPERCASE
}
export function loadWordLists(dir: string): WordLists; // reads data/words/answers.tsv and valid.txt, uppercases
export function lettersKey(word: string): string;       // sorted letters, e.g. "PLANET" -> "AELNPT"
export function canMakeFrom(word: string, letters: string): boolean; // multiset check
```
`canMakeFrom("PLAN", "PLANET") === true`, `canMakeFrom("PEEL", "PLANET") === false` (only one E).
Put the generic `canMake(word: string, letters: string[])` in `src/core/letters.ts` and have `canMakeFrom` call it.

## Layout algorithm (`layout.ts`)

```ts
export interface LayoutResult { words: PlacedWord[]; rows: number; cols: number; crossings: number; }
export function buildLayout(base: string, candidates: string[], maxWords: number,
                            maxRows: number, maxCols: number, rng: Rng): LayoutResult;
```

Internal grid: `Map<CellKey, { letter: string; dirs: Set<Direction> }>`, coordinates may go negative during building.

1. Place `base` **across** at (0,0).
2. Order the remaining `candidates`: copy, `shuffle(copy, rng)`; then with probability 0.5 (`rng() < 0.5`) stable-sort by length descending.
3. For each candidate `w` (stop when `placed.length === maxWords`):
   - For every placed word `p` and every index `i` in `p`, and every index `j` in `w` where `w[j] === p.word[i]`:
     - New direction `d` = perpendicular to `p.dir`.
     - Crossing cell = cell `i` of `p`. Start of `w` = crossing cell moved back `j` steps along `d`.
     - Score the placement with `canPlace` (below). Skip if invalid or `crossings < 1`.
     - Compute bounding box of grid + new word; skip if height > maxRows or width > maxCols.
     - `score = crossings*10 - (h*w)*0.5 - |h - w| + rng()` (the `rng()` breaks ties).
   - Place the best-scoring option (if any). Otherwise skip `w`.
4. Normalize: shift all words so min row and min col are 0. `rows`/`cols` = bounding box size.

`canPlace(grid, w, row, col, d)` returns crossing count or -1:
- The cell **before** the start and the cell **after** the end (along `d`) must be empty.
- For each letter index k at cell c:
  - If c is occupied: its letter must equal `w[k]` and it must not already contain direction `d` → crossing += 1.
  - If c is empty: both **side neighbours** (perpendicular to `d`) must be empty.
- These rules guarantee no accidental words and no parallel touching.

## Generation procedure (`generate.ts`)

```
rng = createRng(SEED); usedKeys = new Set<string>(); levels = []
bonusPool = valid words; answerPool = answers map
for levelId = 1..600:
  tier = TIERS entry containing levelId
  bases = answers with length == tier.wheel and tier <= tier.baseTier, sorted A–Z, then shuffle(bases, rng)
  (cache the shuffled list per tier so each tier shuffles once)
  for base in bases (at most MAX_BASE_TRIES):
    key = lettersKey(base); if usedKeys.has(key) continue
    cands = answer words w (w != base, 3 <= len <= tier.wheel, tier(w) <= tier.answerTier, canMakeFrom(w, base))
    if cands.length + 1 < tier.minWords continue
    best = null
    repeat LAYOUT_ATTEMPTS times:
      r = buildLayout(base, cands, tier.maxWords, tier.maxRows, tier.maxCols, rng)
      better = r.words.length > best.words.length || (equal && r.crossings > best.crossings)
                || (equal && equal crossings && r.rows*r.cols < best.rows*best.cols)
      if better: best = r
      if best.words.length == tier.maxWords: break
    if best.words.length < tier.minWords continue
    usedKeys.add(key)
    gridSet = set of best.words words
    bonus = sorted [v in valid where 3 <= len <= tier.wheel and canMakeFrom(v, base) and v not in gridSet]
    letters = base letters; shuffle(letters, rng) until letters.join("") != base (max 10 tries)
    levels.push({ id: levelId, packId: ceil(levelId / 15), letters, rows, cols, words: best.words, bonus })
    break
  if no level was made: throw Error(`could not generate level ${levelId}`)
write packs: pack k = levels with packId k → public/levels/pack-${pad3(k)}.json  (JSON.stringify(data, null, 0))
write index.json per docs/04 (areaIndex = floor((k-1)/4), timeOfDay = TIMES_OF_DAY[(k-1)%4])
print summary: per tier min/median/max grid words and bonus counts
```

**Performance tip**: precompute, per tier, the candidate list by filtering answers once by length/tier, then check `canMakeFrom` per base. The whole run should take well under a minute.

## Validation (`validate.ts`)

```ts
export function validateLevel(level: Level): string[]; // empty array = valid; otherwise human-readable errors
```
Checks:
1. `letters.length` is 3..7, all single uppercase A–Z.
2. `words.length >= 3`; `words[0].word` uses all letters (`lettersKey` equal).
3. Every grid word and bonus word: length ≥ 3, uppercase, `canMake(word, letters)`.
4. No duplicates in grid words; no bonus word is a grid word; bonus is sorted.
5. All cells within `0 ≤ row < rows`, `0 ≤ col < cols`; overlapping cells agree on letter.
6. Rows/cols are tight (some cell in row 0, col 0, row rows-1, col cols-1).
7. **Run check**: scan every row and column of the built grid; every maximal horizontal run of ≥ 2 letters must equal exactly one `across` word at that position (same for vertical/`down`). This catches accidental words.
8. Connectivity: all cells form one 4-connected component.

CLI (`npm run validate-levels`): load `public/levels/index.json` and every pack; check ids are 1..totalLevels with no gaps, pack meta matches, then `validateLevel` each. Print `OK 600 levels` or the errors and `process.exit(1)`.
