import "@fontsource/nunito/800.css";
import "@fontsource/nunito/900.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/game.css";
import "./styles/screens.css";
import "./styles/overlays.css";

import { createLevelRepo } from "./data/levelRepo";
import { clearSave, loadSave, syncSaveFromNostr } from "./data/storage";
import { restore } from "./data/account";
import { createApp } from "./ui/app";
import type { LevelIndex } from "./core/types";

async function boot(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app missing");
  const params = new URLSearchParams(location.search);
  if (import.meta.env.DEV && params.has("reset")) clearSave();
  const repo = createLevelRepo(import.meta.env.BASE_URL);
  let index: LevelIndex;
  try {
    index = await repo.getIndex();
  } catch (err) {
    console.error(err);
    root.textContent = "Could not load levels. Please reload.";
    return;
  }
  // Restore a remembered NOSTR account and pull its latest save, if any.
  // This also recovers progress when the browser wiped localStorage but kept
  // the account in IndexedDB: the remote save replaces the fresh local one.
  const restored = await restore();
  console.log(`NOSTR: session ${restored ? "restored" : "not found (logged out)"}`);
  if (restored) {
    const applied = await syncSaveFromNostr().catch(() => null);
    if (applied) console.log(`NOSTR: restored save from relays (level ${applied.currentLevel})`);
  }
  const app = createApp(root, { index, repo, save: loadSave() });
  const devLevel = Number(params.get("level"));
  if (import.meta.env.DEV && devLevel >= 1 && devLevel <= index.totalLevels) {
    app.navigate({ name: "game", levelId: devLevel });
  } else {
    app.navigate({ name: "home" });
  }
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((err) => console.warn("SW registration failed", err));
  }
}

void boot();
