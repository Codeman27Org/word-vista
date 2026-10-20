import { play } from "../dom";

export interface OverlayHandle {
  el: HTMLElement;
  close(): Promise<void>;
}

export function openOverlay(
  host: HTMLElement,
  card: HTMLElement,
  opts?: { dismissOnScrim?: boolean; onClose?: () => void },
): OverlayHandle {
  const scrim = document.createElement("div");
  scrim.className = "scrim";
  scrim.appendChild(card);
  host.appendChild(scrim);

  let closed = false;

  async function close(): Promise<void> {
    if (closed) return;
    closed = true;
    scrim.style.pointerEvents = "none";
    await Promise.all([
      play(scrim, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" }),
      play(card, [{ transform: "none" }, { transform: "translateY(40px)" }], { duration: 150, easing: "ease" }),
    ]);
    scrim.remove();
    opts?.onClose?.();
  }

  if (opts?.dismissOnScrim) {
    scrim.addEventListener("click", (e) => {
      if (e.target === scrim) void close();
    });
  }

  void play(scrim, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  void play(card, [
    { opacity: 0, transform: "translateY(40px)" },
    { opacity: 1, transform: "none" },
  ], { duration: 300, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });

  return { el: scrim, close };
}
