import type { CellKey, Level } from "../../core/types";
import { buildCells, wordCells } from "../../core/grid";
import { el, play } from "../dom";

export interface GridView {
  el: HTMLElement;
  fillWord(wordIndex: number, animate: boolean): Promise<void>;
  revealCell(key: CellKey, animate: boolean): Promise<void>;
  flashWord(wordIndex: number): Promise<void>;
  celebrate(): Promise<void>;
  cellRect(key: CellKey): DOMRect;
  destroy(): void;
}

export function createGridView(
  level: Level,
  filled: ReadonlySet<CellKey>,
  revealed: ReadonlySet<CellKey>,
): GridView {
  const gridEl = el("div", "grid");
  const mainEl = el("main", "grid-area");
  mainEl.appendChild(gridEl);

  const cells = buildCells(level);
  const cellMap = new Map<CellKey, HTMLDivElement>();

  for (const [key, cell] of cells) {
    const div = el("div", "cell");
    div.style.gridRow = String(cell.row + 1);
    div.style.gridColumn = String(cell.col + 1);
    if (filled.has(key)) {
      div.classList.add("filled");
      div.textContent = cell.letter;
    } else if (revealed.has(key)) {
      div.classList.add("hinted");
      div.textContent = cell.letter;
    }
    cellMap.set(key, div);
    gridEl.appendChild(div);
  }

  let resizeObserver: ResizeObserver | null = null;

  function computeSizes(): void {
    const cs = getComputedStyle(mainEl);
    const availW = mainEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = mainEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW <= 0 || availH <= 0) return;
    const cols = level.cols;
    const rows = level.rows;
    let cellSize = Math.min(
      Math.floor(availW / (cols + 0.08 * (cols - 1))),
      Math.floor(availH / (rows + 0.08 * (rows - 1))),
      64,
    );
    const gap = Math.max(2, Math.round(cellSize * 0.08));
    cellSize = Math.min(
      cellSize,
      Math.floor((availW - gap * (cols - 1)) / cols),
      Math.floor((availH - gap * (rows - 1)) / rows),
    );
    gridEl.style.setProperty("--rows", String(rows));
    gridEl.style.setProperty("--cols", String(cols));
    gridEl.style.setProperty("--cell", `${cellSize}px`);
    gridEl.style.setProperty("--gap", `${gap}px`);
  }

  computeSizes();
  resizeObserver = new ResizeObserver(() => computeSizes());
  resizeObserver.observe(mainEl);

  function delay(k: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, k));
  }

  async function fillWord(wordIndex: number, animate: boolean): Promise<void> {
    const word = level.words[wordIndex];
    const wc = wordCells(word);
    const promises: Promise<void>[] = [];
    for (let k = 0; k < wc.length; k++) {
      const cell = wc[k];
      const div = cellMap.get(cell.key);
      if (!div || div.classList.contains("filled")) continue;
      div.classList.remove("hinted");
      div.classList.add("filled");
      div.textContent = cell.letter;
      if (animate) {
        const p = play(div, [{ transform: "scale(0.6)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], {
          duration: 220,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          delay: k * 50,
        });
        promises.push(p);
      }
    }
    if (animate) {
      const maxDelay = (wc.length - 1) * 50 + 220;
      await Promise.all(promises);
      await delay(maxDelay - 220);
    }
  }

  async function revealCell(key: CellKey, animate: boolean): Promise<void> {
    const div = cellMap.get(key);
    if (!div || div.classList.contains("filled")) return;
    const cell = cells.get(key);
    if (!cell) return;
    div.classList.add("hinted");
    div.textContent = cell.letter;
    if (animate) {
      await play(div, [{ transform: "scale(0)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], {
        duration: 300,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      });
    }
  }

  async function flashWord(wordIndex: number): Promise<void> {
    const word = level.words[wordIndex];
    const wc = wordCells(word);
    const promises: Promise<void>[] = [];
    for (const cell of wc) {
      const div = cellMap.get(cell.key);
      if (!div) continue;
      promises.push(
        play(div, [
          { transform: "scale(1)" },
          { transform: "scale(1.15)" },
          { transform: "scale(1)" },
          { transform: "scale(1.15)" },
          { transform: "scale(1)" },
        ], { duration: 400 }),
      );
    }
    await Promise.all(promises);
  }

  async function celebrate(): Promise<void> {
    const allDivs = Array.from(cellMap.values());
    const promises: Promise<void>[] = [];
    for (const div of allDivs) {
      const row = parseInt(div.style.gridRow, 10) - 1;
      const col = parseInt(div.style.gridColumn, 10) - 1;
      promises.push(
        play(div, [{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], {
          duration: 300,
          delay: (row + col) * 30,
        }),
      );
    }
    await Promise.all(promises);
  }

  function cellRect(key: CellKey): DOMRect {
    const div = cellMap.get(key);
    if (!div) throw new Error(`Cell not found: ${key}`);
    return div.getBoundingClientRect();
  }

  function destroy(): void {
    resizeObserver?.disconnect();
    cellMap.clear();
  }

  return {
    el: mainEl,
    fillWord,
    revealCell,
    flashWord,
    celebrate,
    cellRect,
    destroy,
  };
}
