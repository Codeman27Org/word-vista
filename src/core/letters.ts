export function normalizeWord(input: string): string {
  return input.trim().toUpperCase();
}

export function countLetters(letters: readonly string[] | string): Map<string, number> {
  const map = new Map<string, number>();
  const source = typeof letters === "string" ? letters.split("") : letters;
  for (const ch of source) {
    map.set(ch, (map.get(ch) ?? 0) + 1);
  }
  return map;
}

export function canMake(word: string, letters: readonly string[] | string): boolean {
  if (word.length === 0) return false;
  const counts = countLetters(letters);
  for (const ch of word) {
    const c = counts.get(ch) ?? 0;
    if (c === 0) return false;
    counts.set(ch, c - 1);
  }
  return true;
}

export function sameLetters(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const countsA = countLetters(a);
  const countsB = countLetters(b);
  if (countsA.size !== countsB.size) return false;
  for (const [ch, c] of countsA) {
    if (countsB.get(ch) !== c) return false;
  }
  return true;
}
