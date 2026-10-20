import { el, play, SHAKE_KEYFRAMES } from "./dom";

export interface CoinPill {
  el: HTMLElement;
  set(coins: number, animate?: boolean): void;
  shake(): Promise<void>;
  rect(): DOMRect;
}

export function createCoinPill(coins: number): CoinPill {
  const pill = el("div", "coin-pill");
  const coinSpan = el("span", "coin");
  const countSpan = el("span", "coin-count", String(coins));
  pill.appendChild(coinSpan);
  pill.appendChild(countSpan);

  let currentCoins = coins;

  function set(n: number, animate = false): void {
    currentCoins = n;
    if (animate) {
      void play(pill, [
        { transform: "scale(1)" },
        { transform: "scale(1.2)" },
        { transform: "scale(1)" },
      ], { duration: 250, easing: "ease" });
      animateCount(n);
    } else {
      countSpan.textContent = String(n);
    }
  }

  function animateCount(target: number): void {
    const start = currentCoins;
    const diff = target - start;
    const duration = 400;
    const startTime = performance.now();

    function tick(now: number): void {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      countSpan.textContent = String(Math.round(start + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  async function shake(): Promise<void> {
    void play(pill, SHAKE_KEYFRAMES, { duration: 320, easing: "ease" });
  }

  function rect(): DOMRect {
    return pill.getBoundingClientRect();
  }

  return { el: pill, set, shake, rect };
}
