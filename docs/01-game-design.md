# 01 — Game Design

Word Vista recreates the core Wordscapes loop (**swipe letters → fill a crossword → next level**) and nothing else.
There are no ads, purchases, accounts, daily puzzles, tournaments, teams, or online features.

## The core loop

```
Home ──PLAY──▶ Level N ──(all grid words found)──▶ Level Complete card ──NEXT──▶ Level N+1 ...
                  ▲  │
                  │  ├─ swipe letters on the wheel to make words
                  │  ├─ grid words fill the crossword
                  │  ├─ other valid words are "bonus words" → fill a meter → coins
                  │  ├─ coins buy hints (reveal one letter)
                  │  └─ shuffle rearranges the wheel (free)
                  └── progress auto-saves after every action
```

## Rules

### Making a word
1. The player presses on a wheel letter and drags across other letters. Each letter can be used **once per word** (selection is by wheel position, so duplicate letters like the two Es in `LETTER` are separate tiles).
2. Dragging back onto the **previous** letter removes the last letter (backtracking).
3. A live preview of the word appears above the wheel while dragging.
4. Releasing submits the word. Exactly one outcome happens:

| Outcome | Condition (checked in this order) | Result |
|---|---|---|
| `tooShort` | fewer than 3 letters | preview fades, nothing else |
| `found` | word is a grid word not yet solved | letters fly into the grid; cells fill; streak +1; may show a compliment |
| `alreadyFound` | grid word already solved | the word's cells flash; streak resets to 0 |
| `bonus` | word in `level.bonus` and not yet found this level | word flies to the bonus button; bonus meter +1; streak unchanged |
| `bonusAlready` | bonus word already found this level | bonus button wiggles; streak unchanged |
| `invalid` | anything else | preview shakes red-ish and fades; streak resets to 0 |

### Filling cells and auto-solving
- A cell is **filled** if it belongs to any solved word **or** was revealed by a hint.
- After any fill (found word or hint), every unsolved grid word whose cells are now all filled becomes **solved automatically** (`autoFound`). It is added to `found` but gives no compliment.
- The level is complete when **every** grid word is solved.

### Streak compliments
- `streak` counts consecutive `found` results. On `found`, if the new streak is ≥ 2, show `STREAK_COMPLIMENTS[min(streak, 6) - 2]` ("Good!", "Great!", "Awesome!", "Amazing!", "Outstanding!").
- Do not show a streak compliment for the word that completes the level (the level-complete celebration replaces it).

### Shuffle (free)
- Randomly reorders the wheel letters. The new order must differ from the current one when possible (retry up to 10 times).
- The current drag (if any) is cancelled first.

### Hint (costs `HINT_COST` = 25 coins)
- Reveals one random **unfilled** cell. Revealed cells show the letter in accent color on a white cell.
- If the player can't afford it, the coin pill shakes and nothing is spent.
- If no unfilled cells exist, the hint button is disabled.
- A hint can complete words (auto-solve) and even complete the level.

### Bonus words and coins
| Event | Coins |
|---|---|
| New game | start with `START_COINS` = 100 |
| Each new bonus word | bonus meter +1; when it reaches `BONUS_GOAL` = 10 → meter resets to 0 and player gets `BONUS_REWARD` = 25 |
| First completion of a level | `LEVEL_REWARD` = 10 |
| First completion of the last level in a pack | additional `PACK_REWARD` = 50 |
| Replay of an already-completed level | 0 (bonus words still fill the meter) |

The bonus button shows a ring that fills `bonusMeter / BONUS_GOAL` and a badge with the count of bonus words found **this level**. Tapping it opens the Bonus Words sheet (list of this level's found bonus words + meter progress).

## Progression

- **600 levels** = 10 areas × 4 packs × 15 levels. Each pack is an area at a time of day: e.g. "Meadow · Dawn", "Meadow · Day", "Meadow · Dusk", "Meadow · Night", then "Canyon · Dawn"…
- Areas in order: Meadow, Canyon, Forest, Lagoon, Highlands, Desert, Coast, Glacier, Bamboo, Summit.
- The background scene and accent color come from the pack (see 02-visual-design.md).
- `save.currentLevel` is the next unplayed level. All levels `< currentLevel` are completed and replayable. Levels `> currentLevel` are locked.
- Completing `currentLevel` unlocks the next one. Completing an earlier level is a **replay**: no level/pack coins, no saved in-progress state.
- When `currentLevel > totalLevels`, the Home screen shows "All levels complete!" and PLAY opens the Levels map.

### Difficulty curve (generated content)

| Levels | Wheel letters | Grid words | Max grid |
|---|---|---|---|
| 1–10 | 4 | 3–4 | 6×6 |
| 11–40 | 5 | 4–6 | 7×7 |
| 41–120 | 6 | 5–8 | 9×9 |
| 121–300 | 6 | 7–10 | 10×10 |
| 301–600 | 7 | 8–12 | 10×10 |

Every level contains one grid word using all wheel letters. Early levels use only very common words.

## Screens

1. **Home** — scene of the current pack, logo, coin pill, big PLAY button ("LEVEL N"), Levels and Settings buttons.
2. **Levels map** — scrollable list of areas; each shows its 4 packs with progress (`7/15`). Tapping an unlocked pack expands a 5-column grid of level bubbles (done / current / locked). Tapping done or current starts that level.
3. **Game** — top bar (back, area · pack, level number, coins), crossword grid, word preview, wheel with Bonus + Shuffle (left) and Hint (right).
4. **Overlays** — Level Complete card, Bonus Words sheet, Settings sheet (sound on/off, reset progress with confirmation, credits).

Back button in Game → Home (progress is already saved). Browser back is not handled (single-page, no URL routing).

## Desktop keyboard support (nice-to-have, specified in T13)
- Typing a letter selects the first unselected wheel tile with that letter.
- `Backspace` removes the last letter, `Enter` submits, `Escape` clears, `Space` shuffles.

## Explicitly out of scope
Ads, in-app purchases, accounts/cloud save, daily puzzles, tournaments, teams, piggy bank purchases, "Target"/"Rocket"/extra hint types, travel tour, achievements, leaderboards, notifications, analytics, multiple languages, music. Do **not** add these.
