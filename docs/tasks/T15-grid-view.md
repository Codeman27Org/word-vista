# T15 — Grid view

**Goal:** render the crossword and expose fill/reveal/flash/celebrate animations.
**Read first:** `docs/02-visual-design.md` (§Game screen "Cell size", §Component states, §Motion rows: Found word (pop part only), Already found, Hint reveal, Level complete); `design/mockup.html` frame 3.
**Depends on:** T14.

## Files
- create `src/ui/game/gridView.ts`
- edit `src/ui/screens/gameScreen.ts` (stub) to show the grid for visual checking

## Spec — `src/ui/game/gridView.ts`
```ts
export interface GridView {
  el: HTMLElement;                                   // <main class="grid-area"><div class="grid">…</div></main>
  fillWord(wordIndex: number, animate: boolean): Promise<void>;
  revealCell(key: CellKey, animate: boolean): Promise<void>;
  flashWord(wordIndex: number): Promise<void>;
  celebrate(): Promise<void>;
  cellRect(key: CellKey): DOMRect;
  destroy(): void;
}
export function createGridView(level: Level, filled: ReadonlySet<CellKey>, revealed: ReadonlySet<CellKey>): GridView;
```
- Build cells with `buildCells(level)`. One `div.cell` per cell, `style.gridRow = String(row + 1)`, `style.gridColumn = String(col + 1)`, stored in a `Map<CellKey, HTMLDivElement>`.
- Initial state: callers pass `filled` = cells covered by **solved words** (`filledKeys(level, state.found, [])`) and `revealed` = hint keys (`state.revealed`). Cells in `filled` get `.filled`; other cells in `revealed` get `.hinted`; the rest stay empty.
- **Empty cells have no text** (don't leak answers). Set `textContent = letter` only when a cell becomes filled or hinted.
- Sizing: a `ResizeObserver` on `el` computes `cell` and `gap` with the formula in docs/02 using `el.clientWidth - 36` and `el.clientHeight - 24`, and sets `--rows`, `--cols`, `--cell` (px), `--gap` (px) on the `.grid` element. Disconnect in `destroy()`.
- `fillWord(i, animate)`: for each cell of `level.words[i]` that is not `.filled`: remove `.hinted`, add `.filled`, set text. If `animate`, run pop `scale .6 → 1.12 → 1` (220 ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`) with `delay = k * 50` ms (k = letter index); resolve when all finish.
- `revealCell(key, animate)`: add `.hinted` and text (skip if already filled); animate `scale 0 → 1.15 → 1` (300 ms).
- `flashWord(i)`: cells of word i: `scale 1 → 1.15 → 1 → 1.15 → 1` (400 ms).
- `celebrate()`: every cell `scale 1 → 1.15 → 1` (300 ms) with `delay = (row + col) * 30`; resolve when all finish.
- `cellRect(key)` → `getBoundingClientRect()` of that cell.
- Use `play()` from `ui/dom` for all animations (it handles reduced motion).

## Temporary check in `gameScreen.ts` stub
Load the level: `ctx.repo.getLevel(levelId).then(level => …)` (guard with a `destroyed` flag). Show the scene for its pack, append a `GridView` with `filled` = cells of `level.words[0]` and `revealed` = the first cell key of the last word. After 1 s call `fillWord(1, true)`, after 2 s `flashWord(0)`, after 3 s `celebrate()`.

## Verify
```
npm run typecheck
npm run build
npm run dev
```
Open `/?level=12` and `/?level=450` at 390×844 and 320×568: grid centered, cells square, filled cells accent with white letters, hinted cell white with accent letter, empty cells blank; animations play; resizing the window resizes cells.

## Done when
Visual check passes, no console errors.
