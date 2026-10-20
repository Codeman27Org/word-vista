import type { AppContext } from "../appTypes";
import type { GridView } from "./gridView";
import type { WheelView } from "./wheelTypes";
import type { PreviewView } from "./previewView";
import type { ActionButtonsView } from "./actionButtons";
import type { TopBarView } from "./topBar";
import type { LevelState, PackMeta, Rng } from "../../core/types";
import { applyHint, hasUnfilledCells, shuffleWheel, submitWord, toProgress } from "../../core/game";
import { complimentForStreak, completeLevel, pickLevelCompliment, recordBonusWord, spendCoins } from "../../core/economy";
import { HINT_COST } from "../../core/constants";
import { wordCells } from "../../core/grid";
import { wait } from "../dom";
import { flyLetters, flyToRect, showCompliment } from "./effects";
import { openLevelComplete } from "../overlays/levelComplete";
import { openBonusSheet } from "../overlays/bonusSheet";

export interface GameSession {
  ctx: AppContext;
  pack: PackMeta;
  state: LevelState;
  isReplay: boolean;
  rng: Rng;
  views: {
    topBar: TopBarView;
    grid: GridView;
    preview: PreviewView;
    wheel: WheelView;
    actions: ActionButtonsView;
    root: HTMLElement;
  };
  busy: boolean;
}

function persist(s: GameSession): void {
  if (s.isReplay) return;
  s.ctx.setSave({ ...s.ctx.getSave(), inProgress: toProgress(s.state) });
}

export function refreshControls(s: GameSession): void {
  s.views.actions.setHintEnabled(hasUnfilledCells(s.state));
}

export async function onSubmit(s: GameSession, word: string): Promise<void> {
  if (s.busy) return;
  const { ctx, views } = s;
  const { state, result } = submitWord(s.state, word);
  s.state = state;
  const completes = result.kind === "found" && result.completesLevel;
  if (completes) {
    s.busy = true;
    views.wheel.setEnabled(false);
  }

  switch (result.kind) {
    case "tooShort":
      void views.preview.hide();
      break;
    case "found": {
      ctx.sfx.play("found");
      const fromRects = views.preview.letterRects();
      const placed = state.level.words[result.wordIndex];
      const toRects = wordCells(placed).map((c) => views.grid.cellRect(c.key));
      void views.preview.hide();
      await flyLetters(placed.word.split(""), fromRects, toRects);
      await views.grid.fillWord(result.wordIndex, true);
      for (const i of result.autoFound) void views.grid.fillWord(i, true);
      if (!result.completesLevel) {
        const text = complimentForStreak(state.streak);
        if (text) void showCompliment(views.root, text);
      }
      break;
    }
    case "alreadyFound":
      void views.preview.hide();
      void views.grid.flashWord(result.wordIndex);
      break;
    case "bonus": {
      ctx.sfx.play("bonus");
      const { save, rewarded } = recordBonusWord(ctx.getSave());
      ctx.setSave(save);
      views.actions.setBonus(state.bonusFound.length, save.bonusMeter, true);
      void flyToRect(result.word, views.preview.rect(), views.actions.bonusRect()).then(() => views.actions.bounceBonus());
      void views.preview.hide();
      if (rewarded) {
        ctx.sfx.play("coin");
        views.topBar.coins.set(save.coins, true);
      }
      break;
    }
    case "bonusAlready":
      void views.preview.hide();
      void views.actions.wiggleBonus();
      break;
    case "invalid":
      ctx.sfx.play("invalid");
      void views.preview.shake();
      break;
  }

  persist(s);
  refreshControls(s);
  if (completes) await finishLevel(s);
}

export async function onHint(s: GameSession): Promise<void> {
  if (s.busy || !hasUnfilledCells(s.state)) return;
  const { ctx, views } = s;
  const save = ctx.getSave();
  if (save.coins < HINT_COST) {
    void views.topBar.coins.shake();
    ctx.sfx.play("invalid");
    return;
  }
  const { state, result } = applyHint(s.state, s.rng);
  if (result.kind === "none") return;
  const paid = spendCoins(save, HINT_COST);
  if (!paid) return;
  ctx.setSave(paid);
  views.topBar.coins.set(paid.coins, true);
  ctx.sfx.play("hint");
  s.state = state;
  if (result.completesLevel) {
    s.busy = true;
    views.wheel.setEnabled(false);
  }
  await views.grid.revealCell(result.key, true);
  for (const i of result.autoFound) void views.grid.fillWord(i, true);
  persist(s);
  refreshControls(s);
  if (result.completesLevel) await finishLevel(s);
}

export function onShuffle(s: GameSession): void {
  if (s.busy) return;
  s.state = shuffleWheel(s.state, s.rng);
  s.views.wheel.setLetters(s.state.wheel, true);
  s.ctx.sfx.play("shuffle");
  persist(s);
}

export function onBonus(s: GameSession): void {
  const { ctx, views } = s;
  views.wheel.setEnabled(false);
  openBonusSheet(ctx.overlayHost, {
    words: s.state.bonusFound,
    meter: ctx.getSave().bonusMeter,
    onClose: () => {
      if (!s.busy) views.wheel.setEnabled(true);
    },
  });
}

export async function finishLevel(s: GameSession): Promise<void> {
  const { ctx, views } = s;
  s.busy = true;
  views.wheel.setEnabled(false);
  void views.preview.hide();
  await wait(300);
  ctx.sfx.play("complete");
  await views.grid.celebrate();

  const save = ctx.getSave();
  const level = s.state.level;
  const completion = s.isReplay
    ? { save, coinsEarned: 0, packCompleted: null, isReplay: true }
    : completeLevel(save, ctx.index, level.id);
  ctx.setSave(completion.save);
  if (completion.coinsEarned > 0) {
    views.topBar.coins.set(completion.save.coins, true);
    ctx.sfx.play("coin");
  }

  const next = level.id + 1;
  const total = ctx.index.totalLevels;
  let label: string;
  let canGo: boolean;
  if (!s.isReplay) {
    canGo = next <= total;
    label = canGo ? "NEXT LEVEL" : "FINISH";
  } else {
    canGo = next <= Math.min(completion.save.currentLevel, total);
    label = canGo ? "CONTINUE" : "FINISH";
  }
  const go = canGo ? () => ctx.navigate({ name: "game", levelId: next }) : () => ctx.navigate({ name: "home" });
  if (next <= total) ctx.repo.prefetch(next);

  openLevelComplete(ctx, {
    levelId: level.id,
    compliment: pickLevelCompliment(s.rng),
    words: level.words.map((w) => w.word).sort((a, b) => b.length - a.length || a.localeCompare(b)),
    coinsEarned: completion.coinsEarned,
    packCompleted: completion.packCompleted,
    bonusCount: s.state.bonusFound.length,
    nextLabel: label,
    onNext: go,
  });
}
