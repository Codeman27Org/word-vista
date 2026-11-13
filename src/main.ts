import "@fontsource/nunito/800.css";
import "@fontsource/nunito/900.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/game.css";
import "./styles/screens.css";
import "./styles/overlays.css";

import { createLevelRepo } from "./data/levelRepo";
import { clearSave, flushPendingPublish, loadSave, syncSaveFromNostr } from "./data/storage";
import { current, restore } from "./data/account";
import { createApp } from "./ui/app";
import type { LevelIndex } from "./core/types";

const SPLASH_MESSAGES = [
  "Warming up the letters…",
  "Pinging the relays…",
  "Untangling the wires…",
  "Shuffling the wheel…",
  "Vibing with NOSTR…",
  "Almost there…",
];

function setSplashMessage(text: string): void {
  const el = document.getElementById("boot-splash-msg");
  if (el) el.textContent = text;
}

function startSplashTicker(): () => void {
  const el = document.getElementById("boot-splash-msg");
  if (!el) return () => {};
  let i = 0; // index 0 is already in the HTML
  let fadeId = 0;
  const id = window.setInterval(() => {
    el.style.opacity = "0";
    fadeId = window.setTimeout(() => {
      i = (i + 1) % SPLASH_MESSAGES.length;
      el.textContent = SPLASH_MESSAGES[i];
      el.style.opacity = "1";
    }, 200);
  }, 1400);
  return () => {
    window.clearInterval(id);
    window.clearTimeout(fadeId);
    el.style.opacity = "1";
  };
}

function removeSplash(): Promise<void> {
  const splash = document.getElementById("boot-splash");
  if (!splash) return Promise.resolve();
  splash.classList.add("bs-out");
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      splash.remove();
      resolve();
    }, 350);
  });
}

/**
 * Keeps a long-lived tab (e.g. an installed PWA left in the background) in
 * step with other devices: flush unsent progress when hidden, and pull newer
 * progress when shown again, reloading so the app never plays on a stale save.
 */
function watchVisibilityForSync(): void {
  let syncing = false;
  window.addEventListener("pagehide", flushPendingPublish);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPendingPublish();
      return;
    }
    if (syncing || !current()) return;
    syncing = true;
    void syncSaveFromNostr()
      .then((applied) => {
        if (applied) location.reload();
      })
      .catch((err) => console.warn("NOSTR: resync on resume failed", err))
      .finally(() => {
        syncing = false;
      });
  });
}

async function boot(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app missing");
  const stopTicker = startSplashTicker();
  const params = new URLSearchParams(location.search);
  if (import.meta.env.DEV && params.has("reset")) clearSave();
  const repo = createLevelRepo(import.meta.env.BASE_URL);
  let index: LevelIndex;
  try {
    index = await repo.getIndex();
  } catch (err) {
    console.error(err);
    stopTicker();
    setSplashMessage("Could not load levels. Please reload.");
    return;
  }
  // Restore a remembered NOSTR account and pull its latest save, if any.
  // This also recovers progress when the browser wiped localStorage but kept
  // the account in IndexedDB: the remote save replaces the fresh local one.
  const restored = await restore();
  console.log(`NOSTR: session ${restored ? "restored" : "not found (logged out)"}`);
  if (restored) {
    const applied = await syncSaveFromNostr().catch((err: unknown) => {
      console.warn("NOSTR: sync failed; keeping the local save", err);
      return null;
    });
    if (applied) console.log(`NOSTR: restored save from relays (level ${applied.currentLevel})`);
  }
  stopTicker();
  const app = createApp(root, { index, repo, save: loadSave() });
  const devLevel = Number(params.get("level"));
  if (import.meta.env.DEV && devLevel >= 1 && devLevel <= index.totalLevels) {
    app.navigate({ name: "game", levelId: devLevel });
  } else {
    app.navigate({ name: "home" });
  }
  watchVisibilityForSync();
  void removeSplash();
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((err) => console.warn("SW registration failed", err));
  }
}

void boot();
