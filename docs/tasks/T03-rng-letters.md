# T03 — RNG & letter helpers

**Goal:** deterministic randomness and letter-multiset helpers (pure, tested).
**Read first:** `AGENTS.md` hard rules; `docs/04-data-contracts.md` (`Rng` type).
**Depends on:** T02.

## Files
- create `src/core/rng.ts`
- create `src/core/letters.ts`
- create `tests/core/rng.test.ts`
- create `tests/core/letters.test.ts`
- delete `tests/smoke.test.ts`

## Spec

### `src/core/rng.ts`
```ts
import type { Rng } from "./types";

/** mulberry32 — use exactly this implementation. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```
Also export:
- `randInt(rng: Rng, maxExclusive: number): number` → integer in `[0, maxExclusive)` via `Math.floor(rng() * maxExclusive)`.
- `shuffle<T>(items: T[], rng: Rng): T[]` → Fisher–Yates **in place** (loop `i` from `length-1` down to `1`, `j = randInt(rng, i + 1)`, swap), returns the same array.
- `pick<T>(items: readonly T[], rng: Rng): T` → `items[randInt(rng, items.length)]`; throw `Error("pick from empty array")` if empty.

### `src/core/letters.ts`
- `normalizeWord(input: string): string` → `input.trim().toUpperCase()`.
- `countLetters(letters: readonly string[] | string): Map<string, number>` → letter → count.
- `canMake(word: string, letters: readonly string[] | string): boolean` → true if every letter of `word` is available in `letters` with enough copies. Empty word → `false`.
- `sameLetters(a: readonly string[], b: readonly string[]): boolean` → true if both contain exactly the same letters with the same counts (order ignored).

## Tests
`tests/core/rng.test.ts`:
- two RNGs with seed 42 produce identical first 5 values; seed 43 differs.
- 1000 values are all `>= 0` and `< 1`.
- `randInt(rng, 6)` over 1000 calls stays in 0..5 and hits every value.
- `shuffle` returns same array instance, same sorted contents.
- `pick` throws on `[]`.

`tests/core/letters.test.ts`:
- `canMake("PLAN", "PLANET")` true; `canMake("PEEL", "PLANET")` false; `canMake("", "ABC")` false;
  `canMake("LETTER", ["L","E","T","T","E","R"])` true; `canMake("LETTERS", "LETTER")` false.
- `normalizeWord("  plane ")` → `"PLANE"`.
- `sameLetters(["A","B","B"], ["B","A","B"])` true; `sameLetters(["A","B"], ["A","B","B"])` false.

## Verify
```
npm run typecheck
npm test
```

## Done when
All tests pass; `tests/smoke.test.ts` is gone.
