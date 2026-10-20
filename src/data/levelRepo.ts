import type { Level, LevelIndex, PackFile, PackMeta } from "../core/types";

export type FetchFn = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

function defaultFetch(url: string): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }> {
  return fetch(url) as Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
}

function packForLevel(index: LevelIndex, levelId: number): PackMeta {
  for (const pack of index.packs) {
    if (levelId >= pack.firstLevel && levelId < pack.firstLevel + pack.levelCount) {
      return pack;
    }
  }
  throw new Error(`No pack contains level ${levelId}`);
}

export interface LevelRepo {
  getIndex(): Promise<LevelIndex>;
  getLevel(levelId: number): Promise<Level>;
  prefetch(levelId: number): void;
}

export function createLevelRepo(baseUrl: string, fetchFn?: FetchFn): LevelRepo {
  const fn = fetchFn ?? defaultFetch;
  const indexCache = new Map<string, Promise<LevelIndex>>();
  const packCache = new Map<string, Promise<PackFile>>();

  async function getIndex(): Promise<LevelIndex> {
    const key = "index";
    if (indexCache.has(key)) return indexCache.get(key)!;
    const url = baseUrl + "levels/index.json";
    const p = (async () => {
      const res = await fn(url);
      if (!res.ok) {
        throw new Error(`Failed to load ${url}: ${res.status}`);
      }
      const raw = await res.json();
      return raw as LevelIndex;
    })().catch((err) => {
      indexCache.delete(key);
      throw err;
    });
    indexCache.set(key, p);
    return p;
  }

  async function getPack(pack: PackMeta): Promise<PackFile> {
    const key = pack.file;
    if (packCache.has(key)) return packCache.get(key)!;
    const url = baseUrl + pack.file;
    const p = (async () => {
      const res = await fn(url);
      if (!res.ok) {
        throw new Error(`Failed to load ${url}: ${res.status}`);
      }
      const raw = await res.json();
      return raw as PackFile;
    })().catch((err) => {
      packCache.delete(key);
      throw err;
    });
    packCache.set(key, p);
    return p;
  }

  async function getLevel(levelId: number): Promise<Level> {
    const index = await getIndex();
    const pack = packForLevel(index, levelId);
    const packFile = await getPack(pack);
    const level = packFile.levels.find((l) => l.id === levelId);
    if (!level) {
      throw new Error(`Level ${levelId} not found`);
    }
    return level;
  }

  function prefetch(levelId: number): void {
    getIndex().then((index) => {
      const pack = packForLevel(index, levelId);
      getPack(pack).catch(() => {
        // fire-and-forget: remove from cache so it can be retried
        packCache.delete(pack.file);
      });
    }).catch(() => {
      indexCache.delete("index");
    });
  }

  return { getIndex, getLevel, prefetch };
}
