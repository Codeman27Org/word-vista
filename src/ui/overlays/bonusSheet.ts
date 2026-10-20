import type { OverlayHandle } from "./overlay";
import { el } from "../dom";
import { BONUS_GOAL, BONUS_REWARD } from "../../core/constants";
import { openOverlay } from "./overlay";

export function openBonusSheet(
  host: HTMLElement,
  info: { words: string[]; meter: number; onClose?: () => void },
): OverlayHandle {
  const card = el("div", "card");

  // Title
  const title = el("h2", "", "BONUS WORDS");
  card.appendChild(title);

  // Progress bar
  const bar = el("div", "bar");
  const inner = el("i", "");
  const pct = Math.min(info.meter / BONUS_GOAL, 1) * 100;
  inner.style.width = `${pct}%`;
  bar.appendChild(inner);
  card.appendChild(bar);

  // Note
  const note = el("div", "reward-note", `${info.meter} / ${BONUS_GOAL} — +${BONUS_REWARD} coins every ${BONUS_GOAL} bonus words`);
  card.appendChild(note);

  // Word chips or empty message
  const foundList = el("div", "found-list");
  if (info.words.length > 0) {
    const sorted = [...info.words].sort();
    for (const word of sorted) {
      const chip = el("span", "chip", word);
      foundList.appendChild(chip);
    }
  } else {
    const empty = el("span", "reward-note", "Find extra words to fill the meter!");
    foundList.appendChild(empty);
  }
  card.appendChild(foundList);

  // Close button
  const closeBtn = el("button", "pill-btn secondary", "CLOSE");
  closeBtn.type = "button";
  closeBtn.addEventListener("click", () => {
    handle.close();
  });
  card.appendChild(closeBtn);

  const handle = openOverlay(host, card, { dismissOnScrim: true, onClose: info.onClose });
  return handle;
}
