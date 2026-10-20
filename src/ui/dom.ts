export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const elem = document.createElement(tag) as HTMLElementTagNameMap[K];
  if (className) {
    elem.className = className;
  }
  if (text !== undefined) {
    elem.textContent = text;
  }
  return elem;
}

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const elem = document.createElementNS("http://www.w3.org/2000/svg", tag) as SVGElementTagNameMap[K];
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      elem.setAttribute(k, String(v));
    }
  }
  return elem;
}

export function clear(node: Element): void {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function play(
  target: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
): Promise<void> {
  const effectiveOptions = reducedMotion()
    ? { ...options, duration: 0 }
    : options;
  const anim = target.animate(keyframes, { fill: "none", ...effectiveOptions });
  return new Promise<void>((resolve) => {
    anim.finished.then(() => resolve()).catch(() => resolve());
  });
}

export function iconButton(
  iconSvg: string,
  label: string,
  className?: string,
): HTMLButtonElement {
  const btn = document.createElement("button") as HTMLButtonElement;
  btn.type = "button";
  btn.className = className ?? "round-btn";
  btn.setAttribute("aria-label", label);
  btn.innerHTML = iconSvg;
  return btn;
}

export const SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-10px)" },
  { transform: "translateX(10px)" },
  { transform: "translateX(-8px)" },
  { transform: "translateX(8px)" },
  { transform: "translateX(-4px)" },
  { transform: "translateX(4px)" },
  { transform: "translateX(0)" },
];
