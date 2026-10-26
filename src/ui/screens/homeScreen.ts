import type { AppContext, Screen } from "../appTypes";
import { el, clear } from "../dom";
import { ICONS } from "../icons";
import { createCoinPill } from "../coinPill";
import { packForLevel } from "../../core/economy";
import { APP_NAME } from "../../core/constants";
import { openSettingsSheet } from "../overlays/settingsSheet";
import { openAccountSheet } from "../overlays/accountSheet";
import { current } from "../../data/account";

const SYNC_DISMISS_KEY = "wordvista.syncBanner.dismissed";

export function createHomeScreen(ctx: AppContext): Screen {
  const screen = el("div", "screen home");

  const save = ctx.getSave();
  const allDone = save.currentLevel > ctx.index.totalLevels;
  const levelId = Math.min(save.currentLevel, ctx.index.totalLevels);
  const pack = packForLevel(ctx.index, levelId);
  ctx.scene.show(pack);

  const top = el("div", "top");
  const coinPill = createCoinPill(save.coins);
  top.appendChild(coinPill.el);
  screen.appendChild(top);

  const logo = el("div", "logo");
  logo.appendChild(el("div", "w1", "WORD"));
  const tiles = el("div", "tiles");
  const tileWord = APP_NAME.split(/\s+/)[1] ?? APP_NAME;
  for (const ch of tileWord.toUpperCase()) {
    tiles.appendChild(el("span", undefined, ch));
  }
  logo.appendChild(tiles);
  screen.appendChild(logo);

  screen.appendChild(el("div", "pack-label", `${pack.areaName} · ${pack.packName}`.toUpperCase()));

  if (allDone) {
    screen.appendChild(el("div", "all-done", "All levels complete!"));
  }

  const playBtn = el("button", "pill-btn play-btn");
  playBtn.type = "button";
  if (allDone) {
    playBtn.textContent = "LEVELS";
  } else {
    playBtn.textContent = "PLAY";
    playBtn.appendChild(el("small", undefined, `LEVEL ${levelId}`));
  }
  playBtn.addEventListener("click", () => {
    if (allDone) {
      ctx.navigate({ name: "map" });
    } else {
      ctx.navigate({ name: "game", levelId });
    }
  });
  screen.appendChild(playBtn);

  // Sync banner: nudge logged-out players to log in so progress syncs.
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(SYNC_DISMISS_KEY) === "1";
  } catch {
    // private mode — just show it
  }
  if (!current() && !dismissed) {
    const banner = el("div", "sync-banner");
    banner.style.cssText =
      "display:flex;align-items:center;gap:8px;background:var(--glass-strong);" +
      "border-radius:16px;padding:10px 12px;margin:12px 16px 0;font-weight:800;" +
      "font-size:13px;color:var(--ink-soft);box-shadow:0 4px 12px rgba(0,0,0,.12);";

    const msg = el("span");
    msg.style.flex = "1";
    msg.textContent = "Progress stays on this device. Log in to sync across devices.";
    banner.appendChild(msg);

    const loginBtn = el("button", undefined, "LOG IN");
    loginBtn.type = "button";
    loginBtn.style.cssText =
      "border:0;background:var(--accent);color:#fff;font:inherit;font-weight:900;" +
      "border-radius:999px;padding:6px 12px;cursor:pointer;white-space:nowrap;";
    loginBtn.addEventListener("click", () => openAccountSheet(ctx));
    banner.appendChild(loginBtn);

    const dismissBtn = el("button", undefined, "✕");
    dismissBtn.type = "button";
    dismissBtn.setAttribute("aria-label", "Dismiss");
    dismissBtn.style.cssText =
      "border:0;background:none;color:var(--ink-soft);font-size:16px;cursor:pointer;padding:4px;";
    dismissBtn.addEventListener("click", () => {
      try {
        localStorage.setItem(SYNC_DISMISS_KEY, "1");
      } catch {
        // ignore
      }
      banner.remove();
    });
    banner.appendChild(dismissBtn);

    screen.appendChild(banner);
  }

  // Bottom area
  const bottom = el("div", "bottom");

  // Map button
  const mapBtn = el("button", "round-btn", "");
  mapBtn.type = "button";
  mapBtn.setAttribute("aria-label", "Levels");
  mapBtn.innerHTML = ICONS.map;
  mapBtn.addEventListener("click", () => {
    ctx.navigate({ name: "map" });
  });
  bottom.appendChild(mapBtn);

  // Settings button
  const settingsBtn = el("button", "round-btn", "");
  settingsBtn.type = "button";
  settingsBtn.setAttribute("aria-label", "Settings");
  settingsBtn.innerHTML = ICONS.gear;
  settingsBtn.addEventListener("click", () => {
    openSettingsSheet(ctx);
  });
  bottom.appendChild(settingsBtn);

  screen.appendChild(bottom);

  return {
    el: screen,
    destroy: () => {
      clear(screen);
    },
  };
}
