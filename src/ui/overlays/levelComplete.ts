import type { AppContext } from "../appTypes";
import type { OverlayHandle } from "./overlay";
import type { PackMeta } from "../../core/types";
import { el } from "../dom";
import { LEVEL_REWARD, PACK_REWARD } from "../../core/constants";
import { openOverlay } from "./overlay";

export interface LevelCompleteInfo {
  levelId: number;
  compliment: string;
  words: string[];
  coinsEarned: number;
  packCompleted: PackMeta | null;
  bonusCount: number;
  nextLabel: string;
  onNext(): void;
}

export function openLevelComplete(ctx: AppContext, info: LevelCompleteInfo): OverlayHandle {
  const card = el("div", "card big");

  // Subtitle
  const sub = el("div", "sub", `LEVEL ${info.levelId} COMPLETE`);
  card.appendChild(sub);

  // Compliment
  const big = el("div", "big");
  big.textContent = info.compliment;
  card.appendChild(big);

  // Word chips
  const foundList = el("div", "found-list");
  for (const word of info.words) {
    const chip = el("span", "chip", word);
    foundList.appendChild(chip);
  }
  card.appendChild(foundList);

  // Coin reward
  if (info.coinsEarned > 0) {
    const reward = el("div", "reward");
    const coinIcon = el("span", "coin");
    const amount = el("span", "", `+${LEVEL_REWARD}`);
    reward.appendChild(coinIcon);
    reward.appendChild(amount);
    card.appendChild(reward);

    if (info.packCompleted) {
      const note = el("div", "reward-note", `Pack complete! +${PACK_REWARD}`);
      card.appendChild(note);
    }
  }

  // Bonus count note
  if (info.bonusCount > 0) {
    const note = el("div", "reward-note", `+${info.bonusCount} bonus words this level`);
    card.appendChild(note);
  }

  // Next button
  const pillBtn = el("button", "pill-btn", info.nextLabel);
  pillBtn.type = "button";
  pillBtn.addEventListener("click", () => {
    overlayHandle.close();
    info.onNext();
  });
  card.appendChild(pillBtn);

  // Not dismissable by scrim
  const overlayHandle = openOverlay(ctx.overlayHost, card, { dismissOnScrim: false });
  return overlayHandle;
}

