import type { AppContext, Screen } from "../appTypes";
import { el, clear } from "../dom";
import { ICONS } from "../icons";
import { createCoinPill } from "../coinPill";
import { packForLevel } from "../../core/economy";
import { APP_NAME } from "../../core/constants";
import { openSettingsSheet } from "../overlays/settingsSheet";

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
