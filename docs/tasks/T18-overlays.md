# T18 — Overlays: level complete, bonus words, settings

**Goal:** the three modal cards, plus enabling the Settings button on Home.
**Read first:** `docs/02-visual-design.md` (§Overlays); `docs/01-game-design.md` (§Bonus words and coins); `design/mockup.html` frame 4.
**Depends on:** T17.

## Files
- create `src/ui/overlays/levelComplete.ts`
- create `src/ui/overlays/bonusSheet.ts`
- create `src/ui/overlays/settingsSheet.ts`
- edit `src/ui/screens/homeScreen.ts` (enable Settings)
- edit `src/ui/screens/gameScreen.ts` (stub: temporary triggers)

## Spec

### `levelComplete.ts`
```ts
export interface LevelCompleteInfo {
  levelId: number;
  compliment: string;            // e.g. "Splendid!"
  words: string[];               // grid words, longest first
  coinsEarned: number;           // 0 for replays (then hide the reward line)
  packCompleted: PackMeta | null;
  bonusCount: number;            // bonus words found this level
  nextLabel: string;             // "NEXT LEVEL" | "CONTINUE" | "FINISH"
  onNext(): void;
}
export function openLevelComplete(host: HTMLElement, info: LevelCompleteInfo): OverlayHandle;
```
Card content top → bottom: `.sub` `LEVEL n COMPLETE`; `.big` compliment; `.found-list` of `.chip`s; if `coinsEarned > 0`: `.reward` (`.coin` + `+${LEVEL_REWARD}`), and if `packCompleted`: a second `.reward-note` `Pack complete! +${PACK_REWARD}`; `.reward-note` `+${bonusCount} bonus words this level` (omit when 0); `.pill-btn` with `nextLabel`. The button closes the overlay, then calls `onNext()`. Not dismissable by scrim.

### `bonusSheet.ts`
```ts
export function openBonusSheet(host: HTMLElement, info: { words: string[]; meter: number; onClose?: () => void }): OverlayHandle;
```
`h2` `BONUS WORDS`; `.bar` with inner `<i>` width `meter / BONUS_GOAL * 100%`; note `${meter} / ${BONUS_GOAL} — +${BONUS_REWARD} coins every ${BONUS_GOAL} bonus words`; chips of `words` sorted A–Z, or text "Find extra words to fill the meter!" when empty; `.pill-btn.secondary` `CLOSE`. Dismissable by scrim.

### `settingsSheet.ts`
```ts
export function openSettingsSheet(ctx: AppContext): OverlayHandle;
```
- `h2` `SETTINGS`.
- `.row`: "Sound" + `button.toggle` (`.on` when enabled, `aria-pressed`). Click: `ctx.setSave({ ...save, settings: { ...save.settings, sound: !on } })`, `ctx.sfx.setEnabled(!on)`, toggle class.
- `.row`: "Reset progress" + `button.danger` "Reset". First click changes its text to "Tap again to confirm"; second click within 3 s: `ctx.setSave(createNewSave())`, close, `ctx.navigate({ name: "home" })`. After 3 s it reverts.
- `.credits`: "Word lists: SCOWL © Kevin Atkinson; ENABLE (public domain). Font: Nunito (SIL OFL)."
- `.pill-btn.secondary` `CLOSE`. Dismissable by scrim.

### Home
Settings button: remove `.disabled`; click → `openSettingsSheet(ctx)`.

### Temporary triggers in `gameScreen.ts` stub
Bonus button → `openBonusSheet` with `["ALE", "PEA"]`, meter 3. Hint button → `openLevelComplete` with fake info (`coinsEarned: 10`, `packCompleted` = the current pack, `onNext` → home).

## Verify
```
npm run typecheck
npm run build
npm run dev
```
Cards look like mockup frame 4 and animate in/out; Settings toggle persists after reload; Reset works.

## Done when
All three overlays work with no console errors.
