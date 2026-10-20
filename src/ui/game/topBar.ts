import type { CoinPill } from "../coinPill";
import { createCoinPill } from "../coinPill";
import { el } from "../dom";
import { ICONS } from "../icons";

export interface TopBarView {
  el: HTMLElement;
  coins: CoinPill;
}

export function createTopBar(opts: {
  area: string;
  level: string;
  coins: number;
  onBack(): void;
}): TopBarView {
  const header = el("header", "topbar");

  const backBtn = el("button", "back") as HTMLButtonElement;
  backBtn.type = "button";
  backBtn.setAttribute("aria-label", "Back");
  backBtn.innerHTML = ICONS.back;
  backBtn.addEventListener("click", opts.onBack);
  header.appendChild(backBtn);

  const title = el("div", "title");
  const areaEl = el("div", "area", opts.area);
  const levelEl = el("div", "level", opts.level);
  title.appendChild(areaEl);
  title.appendChild(levelEl);
  header.appendChild(title);

  const coins = createCoinPill(opts.coins);
  header.appendChild(coins.el);

  return { el: header, coins };
}
