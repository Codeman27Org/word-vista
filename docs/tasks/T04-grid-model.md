# T04 — Grid model + test fixture

**Goal:** turn a `Level`'s placed words into cells, and compute which cells are filled.
**Read first:** `docs/04-data-contracts.md` (§Coordinate system, §types, the pack-001 example).
**Depends on:** T03.

## Files
- create `src/core/grid.ts`
- create `tests/fixtures/level12.ts`
- create `tests/core/grid.test.ts`

## Spec — `src/core/grid.ts`
```ts
import type { Cell, CellKey, Level, PlacedWord } from "./types";

export function cellKey(row: number, col: number): CellKey;               // `${row},${col}`
export function parseKey(key: CellKey): { row: number; col: number };
export interface WordCell { key: CellKey; row: number; col: number; letter: string; }
export function wordCells(word: PlacedWord): WordCell[];                 // in letter order
export function buildCells(level: Level): Map<CellKey, Cell>;            // insertion order = words order, letter order
export function filledKeys(level: Level, found: readonly string[], revealed: readonly CellKey[]): Set<CellKey>;
export function isWordFilled(word: PlacedWord, filled: ReadonlySet<CellKey>): boolean;
```
- `wordCells`: for `across`, cell i is `(row, col + i)`; for `down`, `(row + i, col)`.
- `buildCells`: iterate `level.words` with index `wi`; for each word cell, create the `Cell` if missing (`wordIndexes: [wi]`), else push `wi` into its `wordIndexes`.
- `filledKeys`: union of the cells of every word whose `word` is in `found`, plus every key in `revealed`.

## Fixture — `tests/fixtures/level12.ts`
Export `const LEVEL12: Level` built from the JSON example in `docs/04-data-contracts.md` (id 12, letters `T E P L N A`, 6×7, the six words), but with this exact bonus list:
`["ALE", "ANT", "APE", "EAT", "LANE", "LATE", "LEAN", "LEAP", "LENT", "NAP", "NET", "PAN", "PANE", "PANT", "PAT", "PEA", "PEN", "PET", "PLAN", "PLEAT", "TAN", "TAP", "TEA", "TEN"]`.
Later tests reuse this fixture.

## Tests — `tests/core/grid.test.ts`
- `cellKey(3, 5)` is `"3,5"`; `parseKey("3,5")` is `{ row: 3, col: 5 }`.
- `wordCells` of `PLANET` across at (1,1) → keys `1,1 … 1,6`, letters P L A N E T.
- `wordCells` of `PLANT` down at (1,1) → keys `1,1 2,1 3,1 4,1 5,1`.
- `buildCells(LEVEL12)`: size is 22 (count distinct cells by hand from the drawn grid in docs/04); cell `"1,1"` has `wordIndexes` `[0, 1]` and letter `P`.
- `filledKeys(LEVEL12, ["PLANET"], ["0,5"])` has 7 keys and contains `"0,5"` and `"1,6"`.
- `isWordFilled`: `ATE` (cells `5,0 5,1 5,2`) is filled when `found = ["PALE", "PLANT"]` plus `revealed = ["5,0", "5,2"]`, and not filled with `revealed = ["5,2"]`.

## Verify
```
npm run typecheck
npm test
```

## Done when
All tests pass.
