import type { AppContext, Screen } from "../appTypes";
import { filledKeys } from "../../core/grid";
import { createLevelState, isLevelComplete } from "../../core/game";
import { isLevelUnlocked, packForLevel } from "../../core/economy";
import { createRng } from "../../core/rng";
import { el } from "../dom";
import { createTopBar } from "../game/topBar";
import { createPreviewView } from "../game/previewView";
import { createActionButtons } from "../game/actionButtons";
import { createGridView } from "../game/gridView";
import { createWheelView } from "../game/wheelView";
import type { WheelView } from "../game/wheelTypes";
import type { GridView } from "../game/gridView";
import { type GameSession, finishLevel, onBonus, onHint, onShuffle, onSubmit, refreshControls } from "../game/handlers";

export function createGameScreen(ctx: AppContext, levelId: number): Screen {
  const root = el("div", "screen game");
  let destroyed = false;
  let wheel: WheelView | null = null;
  let grid: GridView | null = null;

  const save = ctx.getSave();
  if (!isLevelUnlocked(save, ctx.index, levelId) && !import.meta.env.DEV) {
    queueMicrotask(() => ctx.navigate({ name: "home" }));
    return { el: root, destroy() {} };
  }

  ctx.repo
    .getLevel(levelId)
    .then((level) => {
      if (destroyed) return;
      const pack = packForLevel(ctx.index, levelId);
      ctx.scene.show(pack);
      const isReplay = levelId !== save.currentLevel;
      const state = createLevelState(level, isReplay ? null : save.inProgress);

      const topBar = createTopBar({
        area: `${pack.areaName} · ${pack.packName}`.toUpperCase(),
        level: `LEVEL ${levelId}`,
        coins: save.coins,
        onBack: () => ctx.navigate({ name: "home" }),
      });
      grid = createGridView(level, filledKeys(level, state.found, []), new Set(state.revealed));
      const preview = createPreviewView();
      const actions = createActionButtons({
        onBonus: () => onBonus(session),
        onShuffle: () => onShuffle(session),
        onHint: () => void onHint(session),
      });
      wheel = createWheelView({
        letters: [...state.wheel],
        onChange: (word) => preview.show(word),
        onSubmit: (word) => void onSubmit(session, word),
        onSelect: (n) => ctx.sfx.select(n - 1),
        onShuffleKey: () => onShuffle(session),
      });

      const wheelRow = el("div", "wheel-row");
      wheelRow.append(actions.left, wheel.el, actions.right);
      root.append(topBar.el, grid.el, preview.el, wheelRow);

      const session: GameSession = {
        ctx,
        pack,
        state,
        isReplay,
        rng: createRng((Date.now() ^ levelId) >>> 0),
        views: { topBar, grid, preview, wheel, actions, root },
        busy: false,
      };
      actions.setBonus(state.bonusFound.length, save.bonusMeter, false);
      refreshControls(session);
      if (isLevelComplete(state)) void finishLevel(session);
    })
    .catch((err: unknown) => {
      console.error(err);
      if (!destroyed) root.append(el("div", "load-error", "Could not load level"));
    });

  return {
    el: root,
    destroy() {
      destroyed = true;
      wheel?.destroy();
      grid?.destroy();
    },
  };
}
