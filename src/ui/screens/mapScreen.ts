import type { AppContext, Screen } from "../appTypes";
import type { PackMeta } from "../../core/types";
import { APP_NAME } from "../../core/constants";
import { packForLevel } from "../../core/economy";
import { SKIES, getAreaTheme } from "../../data/themes";
import { el } from "../dom";
import { ICONS } from "../icons";
import { createTopBar } from "../game/topBar";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function createMapScreen(ctx: AppContext): Screen {
  const root = el("div", "screen map");
  const save = ctx.getSave();
  const index = ctx.index;
  const current = Math.min(save.currentLevel, index.totalLevels);
  const currentPack = packForLevel(index, current);
  ctx.scene.show(currentPack);

  const topBar = createTopBar({
    area: APP_NAME.toUpperCase(),
    level: "LEVELS",
    coins: save.coins,
    onBack: () => ctx.navigate({ name: "home" }),
  });
  const list = el("div", "map-list");
  root.append(topBar.el, list);

  const completedIn = (pack: PackMeta): number => clamp(save.currentLevel - pack.firstLevel, 0, pack.levelCount);

  let openLevels: HTMLElement | null = null;
  let openPackId = -1;

  function buildLevels(pack: PackMeta): HTMLElement {
    const wrap = el("div", "levels");
    for (let id = pack.firstLevel; id < pack.firstLevel + pack.levelCount; id++) {
      const state = id < save.currentLevel ? "done" : id === save.currentLevel ? "current" : "locked";
      const bubble = el("div", `lvl ${state}`, String(id));
      if (state !== "locked") {
        const levelId = id;
        bubble.addEventListener("click", () => ctx.navigate({ name: "game", levelId }));
      }
      wrap.appendChild(bubble);
    }
    return wrap;
  }

  function toggle(pack: PackMeta, row: HTMLElement): void {
    openLevels?.remove();
    if (openPackId === pack.id) {
      openLevels = null;
      openPackId = -1;
      return;
    }
    openLevels = buildLevels(pack);
    openPackId = pack.id;
    row.after(openLevels);
  }

  const areaOrder: string[] = [];
  const byArea = new Map<string, PackMeta[]>();
  for (const pack of index.packs) {
    if (!byArea.has(pack.areaId)) {
      byArea.set(pack.areaId, []);
      areaOrder.push(pack.areaId);
    }
    byArea.get(pack.areaId)!.push(pack);
  }

  for (const areaId of areaOrder) {
    const packs = byArea.get(areaId)!;
    const area = getAreaTheme(areaId);
    const done = packs.reduce((sum, p) => sum + completedIn(p), 0);
    const total = packs.reduce((sum, p) => sum + p.levelCount, 0);

    const card = el("div", "area-card");
    const h3 = el("h3", undefined, packs[0].areaName.toUpperCase());
    h3.appendChild(el("small", undefined, `${done} / ${total}`));
    card.appendChild(h3);

    for (const pack of packs) {
      const completed = completedIn(pack);
      const unlocked = pack.firstLevel <= save.currentLevel;
      const sky = SKIES[pack.timeOfDay];
      const row = el("div", unlocked ? "pack-row" : "pack-row locked");
      const swatch = el("div", "swatch");
      swatch.style.background = `linear-gradient(${sky.top}, ${sky.bottom} 60%, ${area.colors[2]} 60%)`;
      const info = el("div");
      info.appendChild(el("div", "name", pack.packName));
      const bar = el("div", "bar");
      const fill = el("i");
      fill.style.width = `${(completed / pack.levelCount) * 100}%`;
      bar.appendChild(fill);
      info.appendChild(bar);
      const meta = el("div", "meta");
      if (unlocked) meta.textContent = `${completed}/${pack.levelCount}`;
      else meta.innerHTML = ICONS.lock;
      row.append(swatch, info, meta);
      if (unlocked) row.addEventListener("click", () => toggle(pack, row));
      card.appendChild(row);
      if (pack.id === currentPack.id) toggle(pack, row);
    }
    list.appendChild(card);
  }

  requestAnimationFrame(() => openLevels?.scrollIntoView({ block: "center" }));

  return { el: root, destroy() {} };
}
