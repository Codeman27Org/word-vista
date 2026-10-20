import type { Cell, CellKey, Level, PlacedWord } from "./types";

export function cellKey(row: number, col: number): CellKey {
  return `${row},${col}`;
}

export function parseKey(key: CellKey): { row: number; col: number } {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

export interface WordCell {
  key: CellKey;
  row: number;
  col: number;
  letter: string;
}

export function wordCells(word: PlacedWord): WordCell[] {
  const cells: WordCell[] = [];
  const len = word.word.length;
  for (let i = 0; i < len; i++) {
    const row = word.dir === "down" ? word.row + i : word.row;
    const col = word.dir === "across" ? word.col + i : word.col;
    cells.push({
      key: cellKey(row, col),
      row,
      col,
      letter: word.word[i],
    });
  }
  return cells;
}

export function buildCells(level: Level): Map<CellKey, Cell> {
  const cells = new Map<CellKey, Cell>();

  for (let wi = 0; wi < level.words.length; wi++) {
    const word = level.words[wi];
    const wc = wordCells(word);
    for (const cell of wc) {
      if (cells.has(cell.key)) {
        const existing = cells.get(cell.key)!;
        existing.wordIndexes.push(wi);
      } else {
        cells.set(cell.key, {
          row: cell.row,
          col: cell.col,
          letter: cell.letter,
          wordIndexes: [wi],
        });
      }
    }
  }

  return cells;
}

export function filledKeys(
  level: Level,
  found: readonly string[],
  revealed: readonly CellKey[],
): Set<CellKey> {
  const filled = new Set<CellKey>();

  for (let wi = 0; wi < level.words.length; wi++) {
    if (found.includes(level.words[wi].word)) {
      const wc = wordCells(level.words[wi]);
      for (const cell of wc) {
        filled.add(cell.key);
      }
    }
  }

  for (const key of revealed) {
    filled.add(key);
  }

  return filled;
}

export function isWordFilled(
  word: PlacedWord,
  filled: ReadonlySet<CellKey>,
): boolean {
  const wc = wordCells(word);
  return wc.every((cell) => filled.has(cell.key));
}
