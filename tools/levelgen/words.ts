import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canMake } from "../../src/core/letters";

export interface WordLists {
  answers: Map<string, number>;
  valid: Set<string>;
}

export function loadWordLists(dir: string): WordLists {
  const answersText = readFileSync(join(dir, "answers.tsv"), "utf8");
  const validText = readFileSync(join(dir, "valid.txt"), "utf8");

  const answers = new Map<string, number>();
  const lines = answersText.split(/\r?\n/);
  for (const line of lines) {
    if (line === "") continue;
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const word = parts[0].trim().toUpperCase();
    const tier = Number(parts[1].trim());
    if (word && !isNaN(tier)) {
      answers.set(word, tier);
    }
  }

  const valid = new Set<string>();
  const validLines = validText.split(/\r?\n/);
  for (const line of validLines) {
    const w = line.trim().toUpperCase();
    if (w) {
      valid.add(w);
    }
  }

  return { answers, valid };
}

export function lettersKey(word: string): string {
  return word.split("").sort().join("");
}

export function canMakeFrom(word: string, letters: string): boolean {
  return canMake(word, letters.split(""));
}
