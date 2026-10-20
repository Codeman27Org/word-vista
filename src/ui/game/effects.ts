import { reducedMotion, wait } from "../dom";

let fxLayer: HTMLDivElement | null = null;

function layer(): HTMLDivElement {
  if (!fxLayer) {
    fxLayer = document.createElement("div");
    fxLayer.className = "fx-layer";
    document.body.appendChild(fxLayer);
  }
  return fxLayer;
}

function centerDelta(from: DOMRect, to: DOMRect): [number, number] {
  return [to.left + to.width / 2 - (from.left + from.width / 2), to.top + to.height / 2 - (from.top + from.height / 2)];
}

function place(el: HTMLElement, r: DOMRect): void {
  el.style.left = `${r.left}px`;
  el.style.top = `${r.top}px`;
  el.style.width = `${r.width}px`;
  el.style.height = `${r.height}px`;
}

async function run(el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions): Promise<void> {
  try {
    await el.animate(keyframes, { fill: "forwards", ...options }).finished;
  } catch {
    // Animation cancelled; still clean up.
  }
  el.remove();
}

export function flyLetters(letters: string[], from: DOMRect[], to: DOMRect[]): Promise<void> {
  if (reducedMotion()) return Promise.resolve();
  const host = layer();
  const n = Math.min(letters.length, from.length, to.length);
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "fly-letter";
    el.textContent = letters[i];
    place(el, from[i]);
    el.style.fontSize = `${from[i].height * 0.7}px`;
    host.appendChild(el);
    const [dx, dy] = centerDelta(from[i], to[i]);
    const s = from[i].width > 0 ? to[i].width / from[i].width : 1;
    jobs.push(
      run(el, [{ transform: "translate(0px, 0px) scale(1)" }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }], {
        duration: 350,
        easing: "ease-in-out",
        delay: i * 40,
      }),
    );
  }
  return Promise.all(jobs).then(() => undefined);
}

export function flyToRect(text: string, from: DOMRect, to: DOMRect): Promise<void> {
  if (reducedMotion()) return Promise.resolve();
  const el = document.createElement("div");
  el.className = "fly-letter";
  el.textContent = text;
  place(el, from);
  el.style.fontSize = `${from.height * 0.6}px`;
  el.style.padding = "0 12px";
  el.style.letterSpacing = ".12em";
  el.style.borderRadius = "14px";
  layer().appendChild(el);
  const [dx, dy] = centerDelta(from, to);
  return run(
    el,
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.2 },
    ],
    { duration: 450, easing: "ease-in" },
  );
}

export async function showCompliment(parent: HTMLElement, text: string): Promise<void> {
  const el = document.createElement("div");
  el.className = "compliment";
  el.textContent = text;
  parent.appendChild(el);
  if (reducedMotion()) {
    await wait(600);
    el.remove();
    return;
  }
  try {
    await el.animate([{ transform: "scale(.6)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], {
      duration: 250,
      easing: "ease-out",
    }).finished;
    await wait(400);
    await el.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: "translateY(-30px)", opacity: 0 },
      ],
      { duration: 500, easing: "ease-in", fill: "forwards" },
    ).finished;
  } catch {
    // Cancelled; fall through to cleanup.
  }
  el.remove();
}
