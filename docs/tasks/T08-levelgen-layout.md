# T08 — Level generator: words & layout

**Goal:** the word-list loader and the crossword layout algorithm (pure, deterministic).
**Read first:** `docs/05-level-generator.md` (§Files, §Config, §Word helpers, §Layout algorithm).
**Depends on:** T07.

## Files
- create `tools/levelgen/config.ts` — copy the config block from docs/05 exactly. Import `LEVELS_PER_PACK` from `../../src/core/constants` instead of redefining it, and re-export it.
- create `tools/levelgen/words.ts`
- create `tools/levelgen/layout.ts`
- create `tests/levelgen/words.test.ts`
- create `tests/levelgen/layout.test.ts`

## Spec

### `words.ts`
```ts
export interface WordLists { answers: Map<string, number>; valid: Set<string>; }
export function loadWordLists(dir: string): WordLists;
export function lettersKey(word: string): string;
export function canMakeFrom(word: string, letters: string): boolean; // calls canMake from src/core/letters
```
- Read files with `readFileSync(join(dir, "answers.tsv"), "utf8")` and `valid.txt`. Split on `/\r?\n/`, skip empty lines.
- `answers.tsv` lines are `word\ttier`. Store `word.toUpperCase()` → `Number(tier)`.
- Typical call: `loadWordLists(join(process.cwd(), "data", "words"))`.

### `layout.ts`
```ts
export interface LayoutResult { words: PlacedWord[]; rows: number; cols: number; crossings: number; }
export function buildLayout(base: string, candidates: readonly string[], maxWords: number,
                            maxRows: number, maxCols: number, rng: Rng): LayoutResult;
```
Implement exactly the algorithm in docs/05 §Layout algorithm. Suggested private helpers:
- `type GridMap = Map<string, { letter: string; dirs: Set<Direction> }>` (keys from `cellKey`; negative coordinates allowed).
- `step(d)` → `{ dr, dc }` (`across` = `{0,1}`, `down` = `{1,0}`).
- `canPlace(grid, word, row, col, d): number` → crossings or `-1`.
- `put(grid, placed, word, row, col, d)` → writes cells and appends a `PlacedWord`.
- `bounds(grid, extra?)` → `{ minR, maxR, minC, maxC }` including the cells of a proposed word.
- Count total `crossings` = number of cells that have 2 directions.
- After placement, normalize so the minimum row/col is 0.

## Tests
`tests/levelgen/words.test.ts`:
- `lettersKey("PLANET") === "AELNPT"`.
- `canMakeFrom("PLAN", "PLANET")` true, `canMakeFrom("PEEL", "PLANET")` false.
- `loadWordLists(join(process.cwd(), "data", "words"))`: `answers.size > 15000`, `valid.size > 50000`, `answers.get("PLANET")` is 10, 20 or 35, `valid.has("PLANET")`.

`tests/levelgen/layout.test.ts` with base `"PLANET"`, candidates `["PLANT","PANEL","PENAL","PALE","PLATE","LEAP","ATE","NET","TAN"]`, `createRng(1)`, `maxWords 6`, `9×9`:
- `words[0]` is `{ word: "PLANET", dir: "across" }` (any row/col).
- `3 <= words.length <= 6`; `rows <= 9`; `cols <= 9`; every word fits inside `rows × cols`; min row = 0 and min col = 0 across all cells.
- Building the cell map from the result: overlapping cells always agree on the letter.
- Same seed twice → deep-equal results.
- With `maxRows 6, maxCols 6` and base `"PLANET"` the result still contains `PLANET` and respects 6×6.

## Verify
```
npm run typecheck
npm test
```

## Done when
All tests pass.
