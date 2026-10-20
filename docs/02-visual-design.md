# 02 — Visual Design

**Reference:** open `design/mockup.html` in a browser. It shows Home, Levels map, Game (mid-swipe) and Level Complete at 390×844.
Its `<style>` block is the **source of truth for CSS** (class names, colors, sizes). Its `<script>` contains the reference
scene generator (`createRng`, `mix`, `ridge`, `renderScene`) to port to TypeScript.

## Look & feel
- Calm, scenic, tactile. A generated landscape (sky gradient, sun/moon, 3 layered silhouettes) fills the screen behind everything.
- Game UI floats over the scene as frosted-white rounded shapes with soft shadows. One **accent color per area** is used for filled cells, the swipe line, selected letters, preview pill and primary buttons.
- Font: **Nunito** 800/900 (package `@fontsource/nunito`, self-hosted, works offline). All game letters are 900 weight, uppercase.
- Portrait first. On wide screens the scene fills the window and the UI column is centered with `max-width: 480px`.

## Design tokens (`src/styles/tokens.css`)

```css
:root {
  --font: "Nunito", system-ui, -apple-system, "Segoe UI", sans-serif;
  --ink: #2b2b3a;
  --ink-soft: #5a5a70;
  --glass: rgba(255, 255, 255, 0.88);
  --glass-strong: rgba(255, 255, 255, 0.95);
  --glass-weak: rgba(255, 255, 255, 0.28);
  --shadow-1: 0 2px 0 rgba(0, 0, 0, 0.14);
  --shadow-2: 0 10px 28px rgba(0, 0, 0, 0.22);
  --gold: #f5b82e;
  --gold-dark: #c98a0c;
  --danger: #e5484d;
  --radius-card: 22px;
  --accent: #2e9e5b; /* overwritten at runtime per area */
  --accent-dark: color-mix(in srgb, var(--accent) 78%, black);
  --ease-pop: cubic-bezier(0.34, 1.56, 0.64, 1);
  --safe-top: max(12px, env(safe-area-inset-top));
  --safe-bottom: max(20px, env(safe-area-inset-bottom));
}
```

`--accent` is set on `document.documentElement` whenever the scene changes.

## Areas (`src/data/themes.ts`)

Layer order is far → mid → near. `colors` are the **day** colors of each layer.

| areaId | name | accent | shapes | colors |
|---|---|---|---|---|
| meadow | Meadow | `#2e9e5b` | hills, hills, hills | `#9cc9b0` `#6dae7f` `#3f8a57` |
| canyon | Canyon | `#d0602a` | mesas, mesas, dunes | `#e3b48c` `#cf8558` `#a2552f` |
| forest | Forest | `#1f7a5c` | mountains, pines, pines | `#8fb5b0` `#4f8574` `#2c5e4a` |
| lagoon | Lagoon | `#1a8fb5` | mountains, hills, water | `#93b9c9` `#5e9e8c` `#3c8db0` |
| highlands | Highlands | `#6a5acd` | mountains, mountains, hills | `#a9a6d6` `#7d78b8` `#57508f` |
| desert | Desert | `#c2701c` | dunes, dunes, dunes | `#f0cf9a` `#e2ae6c` `#c98842` |
| coast | Coast | `#2d6fd2` | hills, mesas, water | `#9db8cf` `#6f93b0` `#2f6fa8` |
| glacier | Glacier | `#2f8fc0` | mountains, mountains, water | `#d3e6f2` `#a7cbe0` `#6fa6c8` |
| bamboo | Bamboo | `#4e8f25` | hills, pines, hills | `#a8cf8e` `#6fa552` `#417a2e` |
| summit | Summit | `#c2416b` | mountains, mountains, mountains | `#c9b4c9` `#9c7fa0` `#6b4e74` |

## Skies (time of day)

| timeOfDay | top | bottom | body | bodyColor | x | y | r | darkness |
|---|---|---|---|---|---|---|---|---|
| dawn | `#6c7bd0` | `#ffc1a1` | sun | `#ffe2a8` | 300 | 430 | 46 | 0.08 |
| day | `#3e8edb` | `#cdebff` | sun | `#fff4c9` | 310 | 160 | 40 | 0 |
| dusk | `#40306e` | `#ff8c66` | sun | `#ffb070` | 110 | 440 | 50 | 0.22 |
| night | `#0c1638` | `#34497f` | moon | `#f1f3ff` | 90 | 140 | 30 | 0.55 |

## Scene generation (`src/ui/scene.ts`) — port from mockup

- One full-screen `<svg class="scene">` behind all screens, `viewBox="0 0 W 800"`, `preserveAspectRatio="xMidYMax slice"`, where `W = max(400, round(800 · innerWidth / innerHeight))` (400 on phones; wider on desktop so the sky stays visible). All x-extents below that say 400 use `W`; the sun/moon x is offset by `(W − 400) / 2`. Re-render on window resize when `W` changes.
- `rng = createRng(packId)` so each pack always looks the same.
- Draw in this order:
  1. Rect 400×800 filled with a vertical linear gradient `top → bottom`.
  2. Night only: 40 stars — `circle cx=rng()*400 cy=rng()*450 r=0.6+rng() fill=#fff opacity=0.5+rng()*0.5`.
  3. Glow `circle (x,y) r=r*2.4 fill=bodyColor opacity=0.22`, then body `circle (x,y) r fill=bodyColor`.
  4. For layer `i` in 0..2: `baseY = [520,600,690][i]`, `amp = [110,80,55][i]`, `haze = [0.35,0.15,0][i]`.
     `color = mix(mix(colors[i], sky.bottom, haze), "#0b1026", sky.darkness)`.
     Points every 8px for x = 0..400 from `ridge(shape, baseY, amp, rng)`; path `M0,800 L… L400,800 Z`.
- `ridge` shapes (n is a height in 0..1, `y = baseY - amp * clamp(n,0,1)`, `p1 = rng()*6.28`, `p2 = rng()*6.28`):
  - **hills**: `n = 0.5 + 0.3*sin(0.011x + p1) + 0.2*sin(0.027x + p2)`
  - **dunes**: `n = 0.35 + 0.35*sin(0.016x + p1) + 0.15*sin(0.041x + p2)`
  - **pines**: `n = 0.2 + 0.12*sin(0.011x + p1) + 0.08*sin(0.027x + p2)`, then trees every `9 + rng()*7` px: triangle with base at ridge y+2, height `(18 + rng()*20) * (0.8 + i*0.25)`, half-width `5 + rng()*4`, same color.
  - **water**: `n = 0` (flat), then 6 shimmer rects: `y = baseY + 10 + rng()*(800 - baseY - 20)`, `x = rng()*360`, `w = 40 + rng()*100`, height 2, `fill = mix(color,"#ffffff",0.3)`, opacity 0.5.
  - **mountains**: control points from x=-20 while x<440: alternating peak `0.55 + rng()*0.45` / valley `0.1 + rng()*0.3`, x += `40 + rng()*50`. Linear interpolation between control points.
  - **mesas**: repeating plateaus: `[x, low] [x+10, top] [x+10+w, top] [x+20+w, low]` with `top = 0.8+rng()*0.2`, `w = 50+rng()*60`, `low = 0.2+rng()*0.15`, then x += `20 + w + 30 + rng()*30`. Linear interpolation.
- `mix(a, b, t)` linearly interpolates two `#rrggbb` colors per channel and returns `#rrggbb`.
- The exact `rng()` call order must match the mockup (so results are reproducible), but visual similarity is what matters.

## Screen layouts (390×844 reference; scale fluidly)

### Game screen (top → bottom, flex column, full height)
```
┌──────────────────────────────┐  padding-top: var(--safe-top)
│ (‹)    MEADOW · DAWN    (●125)│  .topbar  56px: grid 56px | 1fr | auto
│          LEVEL 12            │
├──────────────────────────────┤
│                              │  .grid-area  flex:1, padding 12px 18px
│        crossword grid        │  grid centered; cell size computed (below)
│                              │
├──────────────────────────────┤
│           [ PANE ]           │  .preview-row 56px (pill only visible while dragging)
├──────────────────────────────┤
│ (★)                     (💡) │  .wheel-row: grid 1fr | wheel | 1fr
│ (⇄)      ( wheel )           │  left: Bonus over Shuffle; right: Hint
└──────────────────────────────┘  padding-bottom: var(--safe-bottom)
```

**Cell size**: given the grid-area inner size `W×H`, `cell = floor(min(W / (cols + 0.08*(cols-1)), H / (rows + 0.08*(rows-1)), 64))`, `gap = max(3, round(cell*0.08))`. Recompute with a `ResizeObserver`.
Grid is a CSS grid: `grid-template-columns: repeat(cols, cell)`, rows likewise; each cell element gets `grid-row: row+1; grid-column: col+1`. Positions with no letter get no element.

**Wheel**: diameter `D = min(width*0.70, 300, height*0.36)` (window size). Letter ring radius `ring = D/2 * (n <= 3 ? 0.6 : 0.68)`.
Letter `i` center: angle `a = -π/2 + i * 2π/n`, `(D/2 + ring*cos a, D/2 + ring*sin a)`.
Letter tile diameter `2*hit` where `hit = min(D*0.14, 0.9*ring*sin(π/n))`; font-size `D*0.17`.
Swipe line: SVG `polyline` over the wheel through selected letter centers plus the pointer, `stroke-width = D*0.035`, round caps/joins, `stroke = var(--accent)`.

### Home screen
Coin pill top-right; logo at ~15% height ("WORD" white 60px/900 with soft shadow, then "VISTA" as five accent letter tiles 46px);
pack label (`DESERT · DUSK`, 13px/800, letter-spacing .14em) above a big accent pill button `PLAY` with small `LEVEL 278` under it;
below: round buttons Levels (map icon) and Settings (gear). See mockup frame 1.

### Levels map
Top bar (back, title `LEVELS`, coins). Scrollable column of `.area-card`s (white glass cards). Each pack row: 44px sky swatch, pack name, progress bar, `x/15` or a lock icon.
Tapping an unlocked pack toggles a 5-column grid of 15 level bubbles: `.done` (accent, white number), `.current` (white with 4px accent ring), `.locked` (grey). The current pack starts expanded and is scrolled into view.

### Overlays
Scrim `rgba(10,14,30,.45)` + `backdrop-filter: blur(2px)`; centered white card 320px wide, radius 28px.
- **Level Complete**: `LEVEL 102 COMPLETE` (13px/800 caps) → big accent compliment (44px/900, random from `LEVEL_COMPLIMENTS`) → chips of grid words → coin reward line (`+10`, plus `Pack complete! +50` when relevant) → bonus count note → `NEXT LEVEL` pill button. Replays: no reward line; button `CONTINUE`.
- **Bonus Words**: title `BONUS WORDS`, progress bar `bonusMeter / 10` with note `+25 coins every 10 bonus words`, chips of this level's bonus words (or "Find extra words to fill the meter!"), `CLOSE` button.
- **Settings**: Sound toggle row, `Reset progress` (danger color; asks "Are you sure?" with Cancel/Reset), credits text: "Word lists: SCOWL (Kevin Atkinson), ENABLE (public domain). Font: Nunito (OFL)."

## Component states
| Component | States |
|---|---|
| Grid cell | empty (`.cell`, glass, letter transparent), filled (`.cell.filled`, accent bg, white letter), hinted (`.cell.hinted`, white bg, accent letter) |
| Wheel letter | idle (ink letter, no bg), selected (`.selected`: accent circle, white letter) |
| Preview pill | hidden, visible (accent), `.bad` (bg `var(--danger)` during shake) |
| Round button | normal, `:active` (translateY 2px, shadow-1 only), `.disabled` (opacity .45, no events) |
| Hint button | shows gold cost badge `25`; disabled when no unfilled cells |
| Bonus button | gold meter ring (`stroke-dasharray`), accent count badge (hidden when 0) |

## Motion (use Web Animations API `el.animate()`; durations in ms)
| Event | Animation |
|---|---|
| Found word | clone preview letters, fly each to its target cell (350, ease-in-out, stagger 40); then cell pop `scale .6→1.12→1` (220, `--ease-pop`, stagger 50) and add `.filled` |
| Already found | target cells `scale 1→1.15→1` twice (2×200) |
| Bonus | preview pill flies + shrinks to bonus button (450), then button `scale 1→1.25→1` (250); meter ring animates |
| Bonus already | bonus button `rotate 0→-12→12→0deg` (300) |
| Invalid | preview adds `.bad`, `translateX 0,-10,10,-8,8,-4,4,0` (320), then fades (150) |
| Too short | preview fades (150) |
| Shuffle | each letter tile moves from old to new position (300, ease-in-out) |
| Hint reveal | cell `scale 0→1.15→1` with `.hinted` (300, `--ease-pop`) |
| Compliment | big outlined text center screen: `scale .6→1.1→1` (250) then `translateY -30px, opacity 0` (500) after 400 hold |
| Coins added | coin pill `scale 1→1.2→1` (250); number counts up over 400 |
| Not enough coins | coin pill shakes (same keyframes as invalid, 320) |
| Level complete | 300 delay; all cells wave `scale 1→1.15→1` with delay `(row+col)*30`; then overlay scrim fade (200) + card `translateY 40px→0, opacity 0→1` (300, `--ease-pop`) |
| Screen change | new screen fades in (200) |

If `matchMedia('(prefers-reduced-motion: reduce)').matches`, skip fly/wave animations and just apply end states (keep fades ≤150ms).

## Sound (`src/ui/sfx.ts`, Web Audio, synthesized — no audio files)
Master gain 0.15. Each sound is short oscillator notes with an attack 5ms / exponential release envelope.
| Name | Sound |
|---|---|
| `select(i)` | sine, `440 * 2^(i*2/12)` Hz, 70ms — pitch rises as the word grows |
| `found` | sine C6 (1047) then E6 (1319), 90ms each, 70ms apart |
| `bonus` | triangle glide 660→1320 Hz over 180ms |
| `invalid` | square 140 Hz, 120ms, gain ×0.5 |
| `hint` | sine 880 then 1175, 80ms each |
| `coin` | square 1568 Hz 50ms then 2093 Hz 80ms, gain ×0.4 |
| `complete` | sine arpeggio C5 E5 G5 C6 (523, 659, 784, 1047), 120ms each, 100ms apart |
| `shuffle` | 3 quick triangle blips 500/600/700 Hz, 40ms each |
Create the `AudioContext` lazily on the first user gesture. When `settings.sound` is false, all calls are no-ops.

## Accessibility
- All icon buttons have `aria-label`. Wheel has `role="group" aria-label="Letter wheel"`.
- Text on accent backgrounds is white and bold ≥ 16px (all accents give ≥ 3:1 contrast).
- `touch-action: none` on the wheel only; the rest of the page must not scroll or zoom during play (`overscroll-behavior: none` on body, `user-select: none` on game UI).
- Respect reduced motion (above).
