import { el, svgEl, iconButton, play } from "../dom";
import { ICONS } from "../icons";
import { BONUS_GOAL, HINT_COST } from "../../core/constants";

export interface ActionButtonsView {
  left: HTMLElement;
  right: HTMLElement;
  setBonus(countThisLevel: number, meter: number, animate: boolean): void;
  setHintEnabled(enabled: boolean): void;
  bounceBonus(): Promise<void>;
  wiggleBonus(): Promise<void>;
  bonusRect(): DOMRect;
}

export function createActionButtons(
  cb: { onBonus(): void; onShuffle(): void; onHint(): void },
): ActionButtonsView {
  const C = 2 * Math.PI * 26;

  // --- Bonus button ---
  const bonusBtn = iconButton(ICONS.star, "Bonus words");

  const meterRing = el("div", "meter-ring");
  const meterSvg = svgEl("svg", {
    viewBox: "0 0 58 58",
    width: "58",
    height: "58",
  });
  const meterCircle = svgEl("circle", {
    cx: "29",
    cy: "29",
    r: "26",
    fill: "none",
    stroke: "var(--accent)",
    "stroke-width": "4",
    "stroke-dasharray": `${C} ${C}`,
    "stroke-linecap": "round",
  });
  meterSvg.appendChild(meterCircle);
  meterRing.appendChild(meterSvg);

  const countBadge = el("span", "count-badge");
  countBadge.classList.add("hidden");

  bonusBtn.appendChild(meterRing);
  bonusBtn.appendChild(countBadge);

  // --- Shuffle button ---
  const shuffleBtn = iconButton(ICONS.shuffle, "Shuffle");
  shuffleBtn.addEventListener("click", cb.onShuffle);

  // --- Bonus wrapper (bonus over shuffle) ---
  const leftSide = el("div", "side");
  leftSide.appendChild(bonusBtn);
  leftSide.appendChild(shuffleBtn);

  // --- Hint button ---
  const hintBtn = iconButton(ICONS.hint, "Hint");
  const hintBadge = el("span", "badge");
  hintBadge.textContent = String(HINT_COST);
  hintBtn.appendChild(hintBadge);
  hintBtn.addEventListener("click", cb.onHint);

  // --- Spacer ---
  const spacer = el("div", "spacer");
  spacer.style.width = "52px";
  spacer.style.height = "52px";

  const rightSide = el("div", "side");
  rightSide.appendChild(hintBtn);
  rightSide.appendChild(spacer);

  function setBonus(countThisLevel: number, meter: number, animate: boolean): void {
    countBadge.textContent = String(countThisLevel);
    countBadge.classList.toggle("hidden", countThisLevel === 0);

    const progress = Math.min(meter / BONUS_GOAL, 1);
    const dashLen = C * progress;
    if (animate) {
      meterCircle.style.transition = "stroke-dasharray 400ms ease";
      meterCircle.setAttribute("stroke-dasharray", `${dashLen} ${C}`);
      setTimeout(() => {
        meterCircle.style.transition = "";
      }, 420);
    } else {
      meterCircle.setAttribute("stroke-dasharray", `${dashLen} ${C}`);
    }
  }

  async function bounceBonus(): Promise<void> {
    void play(bonusBtn, [
      { transform: "scale(1)" },
      { transform: "scale(1.25)" },
      { transform: "scale(1)" },
    ], { duration: 250, easing: "ease" });
  }

  async function wiggleBonus(): Promise<void> {
    void play(bonusBtn, [
      { transform: "rotate(0deg)" },
      { transform: "rotate(-12deg)" },
      { transform: "rotate(12deg)" },
      { transform: "rotate(0deg)" },
    ], { duration: 300, easing: "ease" });
  }

  function bonusRect(): DOMRect {
    return bonusBtn.getBoundingClientRect();
  }

  function setHintEnabled(enabled: boolean): void {
    hintBtn.classList.toggle("disabled", !enabled);
    hintBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
  }

  // Bonus button click
  bonusBtn.addEventListener("click", cb.onBonus);

  return {
    left: leftSide,
    right: rightSide,
    setBonus,
    setHintEnabled,
    bounceBonus,
    wiggleBonus,
    bonusRect,
  };
}
