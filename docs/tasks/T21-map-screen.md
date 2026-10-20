# T21 — Levels map screen

**Goal:** browse areas/packs and replay completed levels.
**Read first:** `docs/02-visual-design.md` (§Levels map); `docs/01-game-design.md` (§Progression); `design/mockup.html` frame 2.
**Depends on:** T19.

## Files
- rewrite `src/ui/screens/mapScreen.ts` (remove stub)

## Spec
```ts
export function createMapScreen(ctx: AppContext): Screen;
```
- `save = ctx.getSave()`; `current = Math.min(save.currentLevel, index.totalLevels)`; `currentPack = packForLevel(index, current)`; `ctx.scene.show(currentPack)`.
- Top bar: reuse `createTopBar({ area: APP_NAME.toUpperCase(), level: "LEVELS", coins: save.coins, onBack: () => ctx.navigate({ name: "home" }) })`.
- `div.map-list` (scrolls). Group `index.packs` by `areaId` (keep order). For each area a `div.area-card`:
  - `h3`: area name uppercase + `<small>${done} / ${total}</small>` where done = completed levels in the area.
  - For each pack a `div.pack-row`: `.swatch` (style `background: linear-gradient(${sky.top}, ${sky.bottom} 60%, ${area.colors[2]} 60%)` from `SKIES[pack.timeOfDay]` and `getAreaTheme(pack.areaId)`), name + `.bar > i` (width = progress %), `.meta` = `${completed}/${levelCount}` or `ICONS.lock` if locked.
    - `completed = clamp(save.currentLevel - pack.firstLevel, 0, pack.levelCount)`; `unlocked = pack.firstLevel <= save.currentLevel`. Locked rows get `.locked` and ignore clicks.
  - Clicking an unlocked row toggles a `div.levels` directly after it (only one open at a time). The current pack starts open.
  - `.levels` has 15 `div.lvl` bubbles: `.done` if `id < save.currentLevel`, `.current` if `id === save.currentLevel`, else `.locked`. Done/current → `ctx.navigate({ name: "game", levelId: id })`.
- After mounting, `requestAnimationFrame(() => openLevelsEl.scrollIntoView({ block: "center" }))`.
- `destroy()`: nothing special (no global listeners).

## Verify
```
npm run typecheck
npm run build
npm run dev
```
Matches mockup frame 2. With a fresh save only Meadow · Dawn is unlocked, level 1 current. After finishing some levels, progress bars update; replaying a done level works and awards no coins.

## Done when
Map checklist items in `docs/06-testing-and-qa.md` pass.
