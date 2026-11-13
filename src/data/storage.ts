import { SAVE_KEY, BONUS_GOAL } from "../core/constants";
import { createNewSave } from "../core/economy";
import type { SaveData } from "../core/types";
import { current } from "./account";
import { publishSave, fetchRemoteSave, compareSaves } from "./nostr";

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStore(): KeyValueStore {
  return globalThis.localStorage as unknown as KeyValueStore;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function loadSave(store: KeyValueStore = defaultStore()): SaveData {
  const s = store;
  try {
    const raw = s.getItem(SAVE_KEY);
    if (raw === null) return createNewSave();
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return createNewSave();
    return sanitizeSave(parsed);
  } catch {
    return createNewSave();
  }
}

// Tracks when the local save was last written, so NOSTR merges by time.
const SAVE_UPDATED_KEY = "wordvista.save.updatedAt";

function readUpdatedAt(store: KeyValueStore): number {
  try {
    return Number(store.getItem(SAVE_UPDATED_KEY)) || 0;
  } catch {
    return 0;
  }
}

// Debounce relay writes so a burst of edits becomes one publish.
let publishTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPublish: { save: SaveData; updatedAt: number } | null = null;
const PUBLISH_DELAY_MS = 1500;

function schedulePublish(save: SaveData, updatedAt: number): void {
  if (!current()) return;
  if (publishTimer) clearTimeout(publishTimer);
  pendingPublish = { save, updatedAt };
  publishTimer = setTimeout(flushPendingPublish, PUBLISH_DELAY_MS);
}

/** Publishes a debounced save right away (e.g. when the page is being hidden). */
export function flushPendingPublish(): void {
  if (publishTimer) clearTimeout(publishTimer);
  publishTimer = null;
  const pending = pendingPublish;
  pendingPublish = null;
  if (!pending || !current()) return;
  publishSave(pending.save, pending.updatedAt).catch((err) => console.warn("NOSTR publish failed", err));
}

export function writeSave(save: SaveData, store: KeyValueStore = defaultStore()): void {
  writeSaveAt(save, Date.now(), store);
}

function writeSaveAt(save: SaveData, updatedAt: number, store: KeyValueStore): void {
  try {
    store.setItem(SAVE_KEY, JSON.stringify(save));
    store.setItem(SAVE_UPDATED_KEY, String(updatedAt));
  } catch {
    // private mode / quota — silently ignore
  }
  schedulePublish(save, updatedAt);
}

export function clearSave(store: KeyValueStore = defaultStore()): void {
  const s = store;
  try {
    s.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Pulls the save from NOSTR relays into local storage. The save with more
 * progress wins (higher level, then newer `updatedAt`), so a stale device can
 * never move progress backwards. Returns the applied save when the remote one
 * was ahead, otherwise null. Throws when the relays can't be read, without
 * publishing anything. Call after login/restore, before the app reads it.
 */
export async function syncSaveFromNostr(store: KeyValueStore = defaultStore()): Promise<SaveData | null> {
  const local = loadSave(store);
  const localUpdatedAt = readUpdatedAt(store);

  const remote = await fetchRemoteSave();
  if (!remote) {
    // Nothing on relays yet — push the local save up if there is one.
    if (localUpdatedAt > 0) schedulePublish(local, localUpdatedAt);
    return null;
  }

  const sanitized = sanitizeSave(remote.save);
  const order = compareSaves({ save: sanitized, updatedAt: remote.updatedAt }, { save: local, updatedAt: localUpdatedAt });
  if (order > 0) {
    try {
      store.setItem(SAVE_KEY, JSON.stringify(sanitized));
      store.setItem(SAVE_UPDATED_KEY, String(remote.updatedAt));
    } catch {
      // ignore
    }
    console.log(`NOSTR: applied remote save (level ${sanitized.currentLevel}) over local (level ${local.currentLevel})`);
    return sanitized;
  }

  if (order < 0) {
    // Local is ahead: push it up so relays and other devices catch up.
    console.log(`NOSTR: local save (level ${local.currentLevel}) is ahead of remote (level ${sanitized.currentLevel}); publishing`);
    schedulePublish(local, localUpdatedAt || Date.now());
  }
  return null;
}

export function sanitizeSave(raw: unknown): SaveData {
  if (!isPlainObject(raw)) return createNewSave();

  const version = raw.version;
  if (typeof version !== "number" || version !== 1) return createNewSave();

  const currentLevel = raw.currentLevel;
  if (typeof currentLevel !== "number") return createNewSave();

  const coins = raw.coins;
  if (typeof coins !== "number") return createNewSave();

  const bonusMeter = raw.bonusMeter;
  if (typeof bonusMeter !== "number") return createNewSave();

  const totalBonusFound = raw.totalBonusFound;
  if (typeof totalBonusFound !== "number") return createNewSave();

  const inProgress = raw.inProgress;
  if (inProgress != null && (!isPlainObject(inProgress) || typeof inProgress.levelId !== "number")) {
    return createNewSave();
  }

  const settings = raw.settings;
  if (!isPlainObject(settings) || typeof settings.sound !== "boolean") {
    return createNewSave();
  }

  // Clamp
  const clampedLevel = Math.max(currentLevel, 1);
  const clampedCoins = Math.max(coins, 0);
  const clampedMeter = Math.max(0, Math.min(bonusMeter, BONUS_GOAL - 1));

  // Validate inProgress.levelId matches currentLevel
  let finalProgress: { levelId: number; wheel: string[]; found: string[]; revealed: string[]; bonusFound: string[] } | null = null;
  if (inProgress !== null && isPlainObject(inProgress)) {
    if (inProgress.levelId === clampedLevel) {
      const wheel = inProgress.wheel;
      const found = inProgress.found;
      const revealed = inProgress.revealed;
      const bonusFound = inProgress.bonusFound;
      if (
        Array.isArray(wheel) && wheel.every((c) => typeof c === "string") &&
        Array.isArray(found) && found.every((c) => typeof c === "string") &&
        Array.isArray(revealed) && revealed.every((c) => typeof c === "string") &&
        Array.isArray(bonusFound) && bonusFound.every((c) => typeof c === "string")
      ) {
        finalProgress = {
          levelId: inProgress.levelId,
          wheel: wheel as string[],
          found: found as string[],
          revealed: revealed as string[],
          bonusFound: bonusFound as string[],
        };
      }
    }
  }

  return {
    version: 1,
    currentLevel: clampedLevel,
    coins: clampedCoins,
    bonusMeter: clampedMeter,
    totalBonusFound,
    inProgress: finalProgress,
    settings: { sound: settings.sound },
  };
}
