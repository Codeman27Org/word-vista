import { el } from "./dom";

export interface Loader {
  el: HTMLElement;
  setMessage(text: string): void;
  destroy(): void;
}

/** Animated loading view: hopping letter tiles, spinner ring, cycling status text. */
export function createLoader(title: string, messages: readonly string[]): Loader {
  const root = el("div", "loader");
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");

  const tiles = el("div", "loader-tiles");
  tiles.setAttribute("aria-hidden", "true");
  for (const letter of ["S", "Y", "N", "C"]) {
    tiles.appendChild(el("span", "", letter));
  }
  root.appendChild(tiles);

  root.appendChild(el("h2", "", title));

  const ring = el("div", "loader-ring");
  ring.setAttribute("aria-hidden", "true");
  root.appendChild(ring);

  const msg = el("p", "loader-msg", messages[0] ?? "");
  root.appendChild(msg);

  let interval: number | null = null;
  let fadeTimer: number | null = null;

  function stop(): void {
    if (interval !== null) {
      window.clearInterval(interval);
      interval = null;
    }
    if (fadeTimer !== null) {
      window.clearTimeout(fadeTimer);
      fadeTimer = null;
    }
  }

  if (messages.length > 1) {
    let i = 0;
    interval = window.setInterval(() => {
      i = (i + 1) % messages.length;
      msg.classList.add("fade");
      fadeTimer = window.setTimeout(() => {
        msg.textContent = messages[i] ?? "";
        msg.classList.remove("fade");
        fadeTimer = null;
      }, 200);
    }, 1400);
  }

  function setMessage(text: string): void {
    stop();
    msg.textContent = text;
    msg.classList.remove("fade");
  }

  function destroy(): void {
    stop();
    root.remove();
  }

  return { el: root, setMessage, destroy };
}
