import type { TimeOfDay } from "../core/types";
import type { Rng } from "../core/types";
import { createRng } from "../core/rng";
import { mix } from "./color";
import { svgEl, clear } from "./dom";
import { getAreaTheme, SKIES, LAYER_BASE, LAYER_AMP, LAYER_HAZE, NIGHT_INK } from "../data/themes";

export type { Rng };

function ridge(
  shape: string,
  baseY: number,
  amp: number,
  rng: Rng,
  W: number,
): [number, number][] {
  const p1 = rng() * 6.28;
  const p2 = rng() * 6.28;
  const pts: [number, number][] = [];

  if (shape === "mountains" || shape === "mesas") {
    const ctrl: [number, number][] = [];
    let x = -20;
    let high = true;
    while (x < W + 40) {
      if (shape === "mountains") {
        ctrl.push([x, high ? 0.55 + rng() * 0.45 : 0.1 + rng() * 0.3]);
        x += 40 + rng() * 50;
      } else {
        const top = 0.8 + rng() * 0.2;
        const w = 50 + rng() * 60;
        const low = 0.2 + rng() * 0.15;
        const gap = 30 + rng() * 30;
        ctrl.push([x, low], [x + 10, top], [x + 10 + w, top], [x + 20 + w, low]);
        x += 20 + w + gap;
      }
      high = !high;
    }
    for (let px = 0; px <= W; px += 8) {
      let i = 0;
      while (i < ctrl.length - 2 && ctrl[i + 1][0] < px) i++;
      const [x0, n0] = ctrl[i];
      const [x1, n1] = ctrl[i + 1];
      const t = Math.min(1, Math.max(0, (px - x0) / (x1 - x0 || 1)));
      pts.push([px, baseY - amp * (n0 + (n1 - n0) * t)]);
    }
  } else {
    for (let px = 0; px <= W; px += 8) {
      let n: number;
      if (shape === "dunes") {
        n = 0.35 + 0.35 * Math.sin(0.016 * px + p1) + 0.15 * Math.sin(0.041 * px + p2);
      } else if (shape === "pines") {
        n = 0.2 + 0.12 * Math.sin(0.011 * px + p1) + 0.08 * Math.sin(0.027 * px + p2);
      } else if (shape === "water") {
        n = 0;
      } else {
        n = 0.5 + 0.3 * Math.sin(0.011 * px + p1) + 0.2 * Math.sin(0.027 * px + p2);
      }
      pts.push([px, baseY - amp * Math.max(0, Math.min(1, n))]);
    }
  }
  return pts;
}


export function renderScene(
  svg: SVGSVGElement,
  areaId: string,
  timeOfDay: TimeOfDay,
  seed: number,
  W = 400,
): void {
  const area = getAreaTheme(areaId);
  const sky = SKIES[timeOfDay];
  const rng = createRng(seed);

  clear(svg);
  svg.setAttribute("viewBox", `0 0 ${W} 800`);
  const bodyX = sky.x + (W - 400) / 2;
  svg.setAttribute("preserveAspectRatio", "xMidYMax slice");

  const gradId = `sky-${seed}-${timeOfDay}`;
  const defs = svgEl("defs") as SVGDefsElement;
  svg.appendChild(defs);

  const grad = svgEl("linearGradient", {
    id: gradId,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1",
  }) as SVGLinearGradientElement;
  defs.appendChild(grad);

  const stop0 = svgEl("stop", {
    offset: "0",
    "stop-color": sky.top,
  }) as SVGStopElement;
  grad.appendChild(stop0);

  const stop1 = svgEl("stop", {
    offset: "1",
    "stop-color": sky.bottom,
  }) as SVGStopElement;
  grad.appendChild(stop1);

  const bgRect = svgEl("rect", {
    x: "0",
    y: "0",
    width: String(W),
    height: "800",
    fill: `url(#${gradId})`,
  }) as SVGRectElement;
  svg.appendChild(bgRect);

  if (sky.body === "moon") {
    for (let i = 0; i < 40; i++) {
      const star = svgEl("circle", {
        cx: String(rng() * W),
        cy: String(rng() * 450),
        r: String(0.6 + rng()),
        fill: "#ffffff",
        opacity: String(0.5 + rng() * 0.5),
      }) as SVGCircleElement;
      svg.appendChild(star);
    }
  }

  const glow = svgEl("circle", {
    cx: String(bodyX),
    cy: String(sky.y),
    r: String(sky.r * 2.4),
    fill: sky.bodyColor,
    opacity: "0.22",
  }) as SVGCircleElement;
  svg.appendChild(glow);

  const body = svgEl("circle", {
    cx: String(bodyX),
    cy: String(sky.y),
    r: String(sky.r),
    fill: sky.bodyColor,
  }) as SVGCircleElement;
  svg.appendChild(body);

  area.shapes.forEach((shape: string, i: number) => {
    const baseY = LAYER_BASE[i];
    const amp = LAYER_AMP[i];
    const haze = LAYER_HAZE[i];
    const color = mix(
      mix(area.colors[i], sky.bottom, haze),
      NIGHT_INK,
      sky.darkness,
    );

    const pts = ridge(shape, baseY, amp, rng, W);
    const pathD =
      "M0,800 " +
      pts.map(([x, y]) => `L${x},${y.toFixed(1)}`).join(" ") +
      ` L${W},800 Z`;

    const path = svgEl("path", {
      d: pathD,
      fill: color,
    }) as SVGPathElement;
    svg.appendChild(path);

    if (shape === "pines") {
      for (let x = 0; x < W; x += 9 + rng() * 7) {
        const yb = pts[Math.min(pts.length - 1, Math.round(x / 8))][1] + 2;
        const h = (18 + rng() * 20) * (0.8 + i * 0.25);
        const w = 5 + rng() * 4;
        const tree = svgEl("path", {
          d: `M${x - w},${yb} L${x},${yb - h} L${x + w},${yb} Z`,
          fill: color,
        }) as SVGPathElement;
        svg.appendChild(tree);
      }
    }

    if (shape === "water") {
      for (let k = 0; k < 6; k++) {
        const wy = LAYER_BASE[i] + 10 + rng() * (800 - LAYER_BASE[i] - 20);
        const wx = rng() * (W - 40);
        const ww = 40 + rng() * 100;
        const shimmer = svgEl("rect", {
          x: String(wx),
          y: String(wy),
          width: String(ww),
          height: "2",
          rx: "1",
          fill: mix(color, "#ffffff", 0.3),
          opacity: "0.5",
        }) as SVGRectElement;
        svg.appendChild(shimmer);
      }
    }
  });
}

export interface Scene {
  el: SVGSVGElement;
  show(pack: import("../core/types").PackMeta): void;
}

export function createScene(): Scene {
  const el = svgEl("svg", {
    class: "scene",
    "aria-hidden": "true",
  }) as SVGSVGElement;
  el.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;";

  let lastPackId: number | null = null;
  let lastPack: import("../core/types").PackMeta | null = null;
  let lastW = 0;

  const sceneWidth = (): number => Math.max(400, Math.round((800 * window.innerWidth) / Math.max(1, window.innerHeight)));

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const W = sceneWidth();
      if (lastPack && W !== lastW) {
        lastW = W;
        renderScene(el, lastPack.areaId, lastPack.timeOfDay, lastPack.id, W);
      }
    }, 150);
  });

  return {
    el,
    show(pack: import("../core/types").PackMeta): void {
      if (pack.id === lastPackId) return;
      lastPackId = pack.id;
      lastPack = pack;
      lastW = sceneWidth();

      renderScene(el, pack.areaId, pack.timeOfDay, pack.id, lastW);

      const accent = getAreaTheme(pack.areaId).accent;
      document.documentElement.style.setProperty("--accent", accent);

      const sky = SKIES[pack.timeOfDay];
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", sky.top);
      }
    },
  };
}
