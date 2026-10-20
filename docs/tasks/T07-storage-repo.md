# T07 — Storage & level repository

**Goal:** load/save progress safely and fetch level files with caching. Dependencies (`Storage`, `fetch`) are parameters so they can be faked in tests.
**Read first:** `docs/04-data-contracts.md` (§Save data, JSON formats); `docs/03-architecture.md` (§Layering rules).
**Depends on:** T06.

## Files
- create `src/data/storage.ts`
- create `src/data/levelRepo.ts`
- create `tests/data/storage.test.ts`
- create `tests/data/levelRepo.test.ts`

## Spec — `src/data/storage.ts`
```ts
export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadSave(store?: KeyValueStore): SaveData;   // default: globalThis.localStorage
export function writeSave(save: SaveData, store?: KeyValueStore): void;
export function clearSave(store?: KeyValueStore): void;
export function sanitizeSave(raw: unknown): SaveData;        // exported for tests
```
- Default store: `globalThis.localStorage`. Wrap all storage access in `try/catch` (private mode can throw); on read failure return `createNewSave()`, on write failure do nothing.
- `sanitizeSave` implements the 4 loading rules in docs/04 using type guards (`typeof x === "number"`, `Array.isArray`, every element is a string). Never trust the shape of parsed JSON.
- Key: `SAVE_KEY` from constants.

## Spec — `src/data/levelRepo.ts`
```ts
export type FetchFn = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface LevelRepo {
  getIndex(): Promise<LevelIndex>;
  getLevel(levelId: number): Promise<Level>;
  prefetch(levelId: number): void; // fire-and-forget getLevel, errors ignored
}

export function createLevelRepo(baseUrl: string, fetchFn?: FetchFn): LevelRepo;
```
- Default `fetchFn = (url) => fetch(url)`. URLs are `baseUrl + "levels/index.json"` and `baseUrl + pack.file`. (`baseUrl` comes from `import.meta.env.BASE_URL`, which is `"./"`.)
- Cache the index promise and each pack promise in `Map`s so each file is fetched once. If a fetch fails, remove it from the cache so it can be retried, then throw `Error("Failed to load <url>: <status>")`.
- `getLevel`: find the pack containing the id (same rule as `packForLevel`), load the pack file, return the level with that id; throw `Error("Level <id> not found")` if missing.
- Cast parsed JSON to `LevelIndex` / `PackFile` (files are generated and validated by our tools).

## Tests
`tests/data/storage.test.ts` — create an in-memory fake `KeyValueStore` (a `Map`):
- empty store → `createNewSave()` values.
- `"not json"` → new save; `{ version: 2 }` → new save; `coins: "lots"` → new save.
- `coins: -5` → clamped to 0; `bonusMeter: 14` → clamped to 9; `currentLevel: 0` → 1.
- `inProgress.levelId` ≠ `currentLevel` → `inProgress` null.
- `writeSave` then `loadSave` round-trip equals the original.
- A store whose `getItem` throws → new save (no exception).

`tests/data/levelRepo.test.ts` — fake `fetchFn` that serves a tiny index (1 pack, levels 1–2) and pack; count calls:
- `getIndex()` twice → 1 fetch.
- `getLevel(2)` returns id 2; then `getLevel(1)` does not refetch the pack.
- `getLevel(99)` rejects.
- A fetch returning `ok: false` rejects, and a later call retries.

## Verify
```
npm run typecheck
npm test
```

## Done when
All tests pass. `src/data/*` imports only from `src/core/*`.
