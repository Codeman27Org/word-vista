import type { Rng, Direction, PlacedWord } from "../../src/core/types";
import { shuffle } from "../../src/core/rng";

export interface LayoutResult {
  words: PlacedWord[];
  rows: number;
  cols: number;
  crossings: number;
}

type GridCell = { key: string; letter: string; dirs: Set<Direction> };
type GridMap = Map<string, GridCell>;

const DIR_ACROSS: Direction = "across";
const DIR_DOWN: Direction = "down";

const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  across: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
};

function perp(d: Direction): Direction {
  return d === DIR_ACROSS ? DIR_DOWN : DIR_ACROSS;
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function getCell(grid: GridMap, row: number, col: number): GridCell | undefined {
  return grid.get(cellKey(row, col));
}


function canPlace(
  grid: GridMap,
  word: string,
  row: number,
  col: number,
  dir: Direction
): number {
  const delta = DIR_DELTA[dir];

  // Check cell before start is empty
  const beforeRow = row - delta.dr;
  const beforeCol = col - delta.dc;
  if (getCell(grid, beforeRow, beforeCol) != null) {
    return -1;
  }

  let crossings = 0;

  for (let k = 0; k < word.length; k++) {
    const r = row + delta.dr * k;
    const c = col + delta.dc * k;
    const cell = getCell(grid, r, c);

    if (cell) {
      if (cell.letter !== word[k]) {
        return -1;
      }
      if (!cell.dirs.has(dir)) {
        crossings++;
      }
    } else {
      // Check side neighbours (perpendicular to dir)
      const perpDir = perp(dir);
      const perpDelta = DIR_DELTA[perpDir];
      const side1Row = r + perpDelta.dr;
      const side1Col = c + perpDelta.dc;
      const side2Row = r - perpDelta.dr;
      const side2Col = c - perpDelta.dc;
      if (getCell(grid, side1Row, side1Col) != null) {
        return -1;
      }
      if (getCell(grid, side2Row, side2Col) != null) {
        return -1;
      }
    }
  }

  // Check cell after end is empty
  const afterRow = row + delta.dr * word.length;
  const afterCol = col + delta.dc * word.length;
  if (getCell(grid, afterRow, afterCol) != null) {
    return -1;
  }

  return crossings;
}

function put(
  grid: GridMap,
  word: string,
  row: number,
  col: number,
  dir: Direction
): PlacedWord {
  const delta = DIR_DELTA[dir];
  for (let k = 0; k < word.length; k++) {
    const r = row + delta.dr * k;
    const c = col + delta.dc * k;
    const key = cellKey(r, c);
    const existing = grid.get(key);
    if (existing) {
      existing.dirs.add(dir);
    } else {
      grid.set(key, { key, letter: word[k], dirs: new Set([dir]) });
    }
  }
  return { word, row, col, dir };
}

function bounds(
  grid: GridMap,
  extra?: { word: string; row: number; col: number; dir: Direction }
): { minR: number; maxR: number; minC: number; maxC: number } {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;

  for (const [, cell] of grid) {
    const [r, c] = cell.key.split(",").map(Number);
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }

  if (extra) {
    const delta = DIR_DELTA[extra.dir];
    for (let k = 0; k < extra.word.length; k++) {
      const r = extra.row + delta.dr * k;
      const c = extra.col + delta.dc * k;
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
  }

  return { minR, maxR, minC, maxC };
}

export function buildLayout(
  base: string,
  candidates: readonly string[],
  maxWords: number,
  maxRows: number,
  maxCols: number,
  rng: Rng
): LayoutResult {
  const grid: GridMap = new Map();

  // Step 1: Place base across at (0,0)
  const placed: PlacedWord[] = [put(grid, base.toUpperCase(), 0, 0, DIR_ACROSS)];

  // Step 2: Order candidates
  const copy = [...candidates];
  shuffle(copy, rng);
  if (rng() < 0.5) {
    copy.sort((a, b) => b.length - a.length);
  }

  // Step 3: Try to place each candidate
  for (const w of copy) {
    if (placed.length >= maxWords) break;
    const wUpper = w.toUpperCase();
    let bestScore = -Infinity;
    let bestPlacement: { row: number; col: number; dir: Direction; crossings: number } | null = null;

    for (const p of placed) {
      for (let i = 0; i < p.word.length; i++) {
        const pDelta = DIR_DELTA[p.dir];
        const crossRow = p.row + pDelta.dr * i;
        const crossCol = p.col + pDelta.dc * i;

        for (let j = 0; j < wUpper.length; j++) {
          if (wUpper[j] !== p.word[i]) continue;

          const d = perp(p.dir);
          // Start of w = crossing cell moved back j steps along d
          const dDelta = DIR_DELTA[d];
          const startRow = crossRow - dDelta.dr * j;
          const startCol = crossCol - dDelta.dc * j;

          const crossings = canPlace(grid, wUpper, startRow, startCol, d);
          if (crossings < 1) continue;

          // Check bounding box
          const bb = bounds(grid, { word: wUpper, row: startRow, col: startCol, dir: d });
          const height = bb.maxR - bb.minR + 1;
          const width = bb.maxC - bb.minC + 1;
          if (height > maxRows || width > maxCols) continue;

          const score = crossings * 10 - (height * width) * 0.5 - Math.abs(height - width) + rng();

          if (score > bestScore) {
            bestScore = score;
            bestPlacement = { row: startRow, col: startCol, dir: d, crossings };
          }
        }
      }
    }

    if (bestPlacement) {
      // Prevent duplicate words (same word placed at different positions)
      if (placed.some((p) => p.word === wUpper)) continue;
      const pw = put(
        grid,
        wUpper,
        bestPlacement.row,
        bestPlacement.col,
        bestPlacement.dir
      );
      placed.push(pw);
    }
  }

  // Step 4: Normalize
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const [, cell] of grid) {
    const [r, c] = cell.key.split(",").map(Number);
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }

  const shiftR = -minR;
  const shiftC = -minC;

  const normalizedWords = placed.map((pw) => ({
    word: pw.word,
    row: pw.row + shiftR,
    col: pw.col + shiftC,
    dir: pw.dir,
  }));

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  // Count crossings
  let crossings = 0;
  for (const [, cell] of grid) {
    if (cell.dirs.size >= 2) crossings++;
  }

  return { words: normalizedWords, rows, cols, crossings };
}
