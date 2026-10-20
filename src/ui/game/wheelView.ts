import type { WheelOptions, WheelView } from "./wheelTypes";
import { computeD, hitRadius, hitTest, letterCenter, ringRadius } from "./wheelGeometry";
import { el, reducedMotion, svgEl } from "../dom";

export type { WheelOptions, WheelView } from "./wheelTypes";

export function createWheelView(opts: WheelOptions): WheelView {
  let letters = [...opts.letters];
  let selected: number[] = [];
  let activePointer: number | null = null;
  let pointer: { x: number; y: number } | null = null;
  let enabled = true;
  let lastWord = "";
  let D = computeD();

  const root = el("div", "wheel");
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Letter wheel");
  root.style.touchAction = "none";
  const svg = svgEl("svg");
  const line = svgEl("polyline", { class: "line" });
  svg.appendChild(line);
  root.appendChild(svg);

  let letterEls: HTMLDivElement[] = [];

  function center(i: number): { x: number; y: number } {
    return letterCenter(i, letters.length, ringRadius(letters.length, D), D);
  }

  function layout(): void {
    root.style.width = `${D}px`;
    root.style.height = `${D}px`;
    svg.setAttribute("viewBox", `0 0 ${D} ${D}`);
    line.setAttribute("stroke-width", String(D * 0.035));
    const hit = hitRadius(letters.length, D);
    letterEls.forEach((le, i) => {
      const c = center(i);
      le.style.left = `${c.x}px`;
      le.style.top = `${c.y}px`;
      le.style.width = `${hit * 2}px`;
      le.style.height = `${hit * 2}px`;
      le.style.fontSize = `${D * 0.17}px`;
    });
  }

  function buildLetters(): void {
    letterEls.forEach((le) => le.remove());
    letterEls = letters.map((ch, i) => {
      const le = el("div", "letter", ch);
      le.dataset.i = String(i);
      root.appendChild(le);
      return le;
    });
  }

  function currentWord(): string {
    return selected.map((i) => letters[i]).join("");
  }

  function update(): void {
    letterEls.forEach((le, i) => le.classList.toggle("selected", selected.includes(i)));
    const pts = selected.map((i) => {
      const c = center(i);
      return `${c.x},${c.y}`;
    });
    if (pointer && selected.length > 0) pts.push(`${pointer.x},${pointer.y}`);
    line.setAttribute("points", pts.join(" "));
    const word = currentWord();
    if (word !== lastWord) {
      lastWord = word;
      opts.onChange(word);
    }
  }

  function submit(): void {
    const word = currentWord();
    reset();
    lastWord = "";
    update();
    opts.onSubmit(word);
  }

  function reset(): void {
    selected = [];
    activePointer = null;
    pointer = null;
  }

  function local(e: PointerEvent): { x: number; y: number } {
    const rect = root.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function addOrBacktrack(i: number): void {
    if (!selected.includes(i)) {
      selected.push(i);
      opts.onSelect?.(selected.length);
    } else if (selected.length >= 2 && i === selected[selected.length - 2]) {
      selected.pop();
    }
  }

  function onPointerDown(e: PointerEvent): void {
    if (!enabled || activePointer !== null) return;
    const p = local(e);
    const i = hitTest(p.x, p.y, letters.length, D);
    if (i < 0) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    activePointer = e.pointerId;
    pointer = p;
    selected = [i];
    opts.onSelect?.(1);
    update();
  }

  function onPointerMove(e: PointerEvent): void {
    if (e.pointerId !== activePointer) return;
    pointer = local(e);
    const i = hitTest(pointer.x, pointer.y, letters.length, D);
    if (i >= 0) addOrBacktrack(i);
    update();
  }

  function onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== activePointer) return;
    submit();
  }

  function onPointerAbort(e: PointerEvent): void {
    if (e.pointerId !== activePointer) return;
    reset();
    update();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!enabled || activePointer !== null || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[a-z]$/i.test(e.key)) {
      const key = e.key.toUpperCase();
      const i = letters.findIndex((ch, idx) => ch === key && !selected.includes(idx));
      if (i >= 0) {
        selected.push(i);
        opts.onSelect?.(selected.length);
        update();
      }
    } else if (e.key === "Backspace") {
      selected.pop();
      update();
    } else if (e.key === "Escape") {
      cancel();
    } else if (e.key === "Enter") {
      if (selected.length > 0) submit();
    } else if (e.key === " ") {
      e.preventDefault();
      opts.onShuffleKey?.();
    }
  }

  function onResize(): void {
    D = computeD();
    layout();
    update();
  }

  function cancel(): void {
    reset();
    update();
  }

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerAbort);
  root.addEventListener("lostpointercapture", onPointerAbort);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

  buildLetters();
  layout();

  return {
    el: root,
    setLetters(newLetters, animate) {
      cancel();
      if (newLetters.length !== letters.length) {
        letters = [...newLetters];
        buildLetters();
        layout();
        return;
      }
      const pool = [...letterEls];
      const reordered = newLetters.map((ch) => {
        const idx = pool.findIndex((le) => le.textContent === ch);
        return pool.splice(idx, 1)[0];
      });
      reordered.forEach((le, j) => (le.dataset.i = String(j)));
      letterEls = reordered;
      letters = [...newLetters];
      const smooth = animate && !reducedMotion();
      if (smooth) letterEls.forEach((le) => (le.style.transition = "left 300ms ease-in-out, top 300ms ease-in-out"));
      layout();
      if (smooth) {
        setTimeout(() => letterEls.forEach((le) => (le.style.transition = "")), 320);
      }
    },
    setEnabled(on) {
      enabled = on;
      if (!on) cancel();
    },
    cancel,
    letterRects(indexes) {
      return indexes.map((i) => letterEls[i].getBoundingClientRect());
    },
    destroy() {
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerAbort);
      root.removeEventListener("lostpointercapture", onPointerAbort);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    },
  };
}
