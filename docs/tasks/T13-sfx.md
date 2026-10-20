# T13 — Sound effects

**Goal:** tiny synthesized sound effects with Web Audio (no audio files).
**Read first:** `docs/02-visual-design.md` (§Sound).
**Depends on:** T11.

## Files
- create `src/ui/sfx.ts`

## Spec
```ts
export type SfxName = "found" | "bonus" | "invalid" | "hint" | "coin" | "complete" | "shuffle";
export interface Sfx {
  unlock(): void;               // create/resume AudioContext; call on first user gesture
  select(index: number): void;  // letter-selection blip, pitch rises with index
  play(name: SfxName): void;
  setEnabled(on: boolean): void;
}
export function createSfx(enabled: boolean): Sfx;
```
Implementation notes:
- Lazily create `AudioContext` in `unlock()` (`new AudioContext()`); if it is `"suspended"`, call `resume()`. Wrap in `try/catch`; if audio is unavailable everything is a no-op.
- One master `GainNode` at 0.15 connected to `destination`.
- Private helper:
  ```ts
  function tone(freq: number, startOffset: number, duration: number,
                type: OscillatorType = "sine", gainMul = 1, glideTo?: number): void
  ```
  Creates an `OscillatorNode` + `GainNode`; `t0 = ctx.currentTime + startOffset`; gain `setValueAtTime(0.0001, t0)`, `exponentialRampToValueAtTime(gainMul, t0 + 0.005)`, `exponentialRampToValueAtTime(0.0001, t0 + duration)`; if `glideTo`, `frequency.exponentialRampToValueAtTime(glideTo, t0 + duration)`; `start(t0)`, `stop(t0 + duration + 0.02)`.
- Each sound uses the frequencies/durations from the docs/02 §Sound table (offsets in seconds, e.g. 70 ms → 0.07).
- If not enabled or no context → return immediately.

## Verify
```
npm run typecheck
npm run build
```
(Audible check happens in T18.)

## Done when
Build passes.
