import type { Level, Direction } from "../../src/core/types";
import { canMake } from "../../src/core/letters";
import { lettersKey } from "../../tools/levelgen/words";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function buildGrid(level: Level): Map<string, string> {
  const grid = new Map<string, string>();
  for (const w of level.words) {
    for (let k = 0; k < w.word.length; k++) {
      const r = w.dir === "down" ? w.row + k : w.row;
      const c = w.dir === "across" ? w.col + k : w.col;
      grid.set(`${r},${c}`, w.word[k]);
    }
  }
  return grid;
}

function findMaximalRuns(grid: Map<string, string>, row: number, cols: number, dir: Direction): Array<{ start: number; word: string }> {
  const runs: Array<{ start: number; word: string }> = [];
  let i = 0;
  while (i < cols) {
    const key = dir === "across" ? `${row},${i}` : `${i},${row}`;
    if (!grid.has(key)) {
      i++;
      continue;
    }
    let j = i;
    while (j < cols) {
      const k2 = dir === "across" ? `${row},${j}` : `${j},${row}`;
      if (!grid.has(k2)) break;
      j++;
    }
    if (j - i >= 2) {
      let word = "";
      for (let x = i; x < j; x++) {
        const k3 = dir === "across" ? `${row},${x}` : `${x},${row}`;
        word += grid.get(k3)!;
      }
      runs.push({ start: i, word });
    }
    i = j + 1;
  }
  return runs;
}

export function validateLevel(level: Level): string[] {
  const errors: string[] = [];
  const prefix = `level ${level.id}: `;

  // Check 1: letters.length 3..7, all single uppercase A-Z
  if (level.letters.length < 3 || level.letters.length > 7) {
    errors.push(`${prefix}letters.length ${level.letters.length} not in 3..7`);
  }
  for (let i = 0; i < level.letters.length; i++) {
    const ch = level.letters[i];
    if (ch.length !== 1 || ch < "A" || ch > "Z") {
      errors.push(`${prefix}letters[${i}] '${ch}' not single uppercase A-Z`);
    }
  }

  // Check 2: words.length >= 3; words[0].word uses all letters
  if (level.words.length < 3) {
    errors.push(`${prefix}words.length ${level.words.length} < 3`);
  }
  const baseKey = lettersKey(level.words[0].word);
  const lettersKey2 = lettersKey(level.letters.join(""));
  if (baseKey !== lettersKey2) {
    errors.push(`${prefix}words[0] '${level.words[0].word}' lettersKey '${baseKey}' != letters lettersKey '${lettersKey2}'`);
  }

  // Check 3: every grid word and bonus word: length >= 3, uppercase, canMake
  for (let i = 0; i < level.words.length; i++) {
    const w = level.words[i];
    if (w.word.length < 3) {
      errors.push(`${prefix}words[${i}] '${w.word}' length < 3`);
    }
    if (w.word !== w.word.toUpperCase()) {
      errors.push(`${prefix}words[${i}] '${w.word}' not uppercase`);
    }
    if (!canMake(w.word, level.letters)) {
      errors.push(`${prefix}words[${i}] '${w.word}' cannot be made from letters`);
    }
  }
  for (let i = 0; i < level.bonus.length; i++) {
    const w = level.bonus[i];
    if (w.length < 3) {
      errors.push(`${prefix}bonus[${i}] '${w}' length < 3`);
    }
    if (w !== w.toUpperCase()) {
      errors.push(`${prefix}bonus[${i}] '${w}' not uppercase`);
    }
    if (!canMake(w, level.letters)) {
      errors.push(`${prefix}bonus[${i}] '${w}' cannot be made from letters`);
    }
  }

  // Check 4: no duplicates in grid words; no bonus word is a grid word; bonus sorted
  const gridWords = new Set<string>();
  for (const w of level.words) {
    if (gridWords.has(w.word)) {
      errors.push(`${prefix}duplicate grid word '${w.word}'`);
    }
    gridWords.add(w.word);
  }
  for (const b of level.bonus) {
    if (gridWords.has(b)) {
      errors.push(`${prefix}bonus word '${b}' is also a grid word`);
    }
  }
  for (let i = 1; i < level.bonus.length; i++) {
    if (level.bonus[i] <= level.bonus[i - 1]) {
      errors.push(`${prefix}bonus not sorted at index ${i}: '${level.bonus[i - 1]}' >= '${level.bonus[i]}'`);
    }
  }

  // Check 5: all cells within bounds; overlapping cells agree
  const grid = buildGrid(level);
  for (const w of level.words) {
    for (let k = 0; k < w.word.length; k++) {
      const r = w.dir === "down" ? w.row + k : w.row;
      const c = w.dir === "across" ? w.col + k : w.col;
      if (r < 0 || r >= level.rows || c < 0 || c >= level.cols) {
        errors.push(`${prefix}word '${w.word}' cell (${r},${c}) out of bounds [${level.rows}x${level.cols}]`);
      }
    }
  }
  const cellMap = new Map<string, string>();
  for (const w of level.words) {
    for (let k = 0; k < w.word.length; k++) {
      const r = w.dir === "down" ? w.row + k : w.row;
      const c = w.dir === "across" ? w.col + k : w.col;
      const key = `${r},${c}`;
      if (cellMap.has(key) && cellMap.get(key) !== w.word[k]) {
        errors.push(`${prefix}cell ${key} letter conflict: '${cellMap.get(key)}' vs '${w.word[k]}'`);
      }
      cellMap.set(key, w.word[k]);
    }
  }

  // Check 6: rows/cols are tight
  let hasRow0 = false, hasRowLast = false, hasCol0 = false, hasColLast = false;
  for (const w of level.words) {
    for (let k = 0; k < w.word.length; k++) {
      const r = w.dir === "down" ? w.row + k : w.row;
      const c = w.dir === "across" ? w.col + k : w.col;
      if (r === 0) hasRow0 = true;
      if (r === level.rows - 1) hasRowLast = true;
      if (c === 0) hasCol0 = true;
      if (c === level.cols - 1) hasColLast = true;
    }
  }
  if (!hasRow0) errors.push(`${prefix}no cell in row 0`);
  if (!hasRowLast) errors.push(`${prefix}no cell in row ${level.rows - 1}`);
  if (!hasCol0) errors.push(`${prefix}no cell in col 0`);
  if (!hasColLast) errors.push(`${prefix}no cell in col ${level.cols - 1}`);

  // Check 7: run check
  for (let r = 0; r < level.rows; r++) {
    const runs = findMaximalRuns(grid, r, level.cols, "across" as Direction);
    for (const run of runs) {
      const matching = level.words.filter(
        (w) => w.dir === "across" && w.row === r && w.col === run.start && w.word === run.word
      );
      if (matching.length === 0) {
        errors.push(`${prefix}accidental run '${run.word}' at row ${r}`);
      }
    }
  }
  for (let c = 0; c < level.cols; c++) {
    const runs = findMaximalRuns(grid, c, level.rows, "down" as Direction);
    for (const run of runs) {
      const matching = level.words.filter(
        (w) => w.dir === "down" && w.col === c && w.row === run.start && w.word === run.word
      );
      if (matching.length === 0) {
        errors.push(`${prefix}accidental run '${run.word}' at col ${c}`);
      }
    }
  }

  // Check 8: connectivity (BFS)
  if (grid.size > 0) {
    const startKey = grid.keys().next().value;
    const visited = new Set<string>();
    const queue = [startKey!];
    visited.add(startKey!);
    while (queue.length > 0) {
      const key = queue.shift()!;
      const [cr, cc] = key.split(",").map(Number);
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nk = `${cr + dr},${cc + dc}`;
        if (grid.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push(nk);
        }
      }
    }
    if (visited.size !== grid.size) {
      errors.push(`${prefix}disconnected: ${visited.size}/${grid.size} cells reachable`);
    }
  }

  return errors;
}

export function validateAll(rootDir: string): string[] {
  const indexPath = join(rootDir, "public", "levels", "index.json");
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as { version: number; totalLevels: number; packs: { id: number; file: string }[] };
  const allErrors: string[] = [];

  for (const pack of index.packs) {
    const packPath = join(rootDir, "public", pack.file);
    const packData = JSON.parse(readFileSync(packPath, "utf8")) as { packId: number; levels: Level[] };
    for (const level of packData.levels) {
      const errs = validateLevel(level);
      allErrors.push(...errs);
    }
  }

  return allErrors;
}

import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = validateAll(process.cwd());
  if (errors.length > 0) {
    console.error(errors.slice(0, 50).join("\n"));
    console.error(`${errors.length} error(s)`);
    process.exit(1);
  }
  console.log("OK — all levels valid");
}
