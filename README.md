# Word Vista

A relaxing word-puzzle game with the Wordscapes gameplay loop: swipe letters on a wheel to make words, fill the crossword, move on to the next level. 600 levels across 10 scenic areas. No ads, no purchases, no accounts — just the game. Runs in any browser and installs to a phone home screen (PWA, works offline).

> "Wordscapes" is a trademark of PeopleFun. This project only borrows the genre's gameplay loop; it uses its own name, art, words and code.

## Status
Planning complete; implementation is done task-by-task by a coding agent. See [docs/PROGRESS.md](docs/PROGRESS.md).

## What's already here
| Path | What |
|---|---|
| [AGENTS.md](AGENTS.md) | Rules the coding agent reads every chat |
| [docs/](docs/) | Game design, visual design, architecture, data contracts, generator, testing |
| [docs/tasks/](docs/tasks/) | 23 small, ordered build tasks (T01–T23) |
| [design/mockup.html](design/mockup.html) | Visual reference: open in a browser |
| [data/words/](data/words/) | Prebuilt word lists for the level generator |
| [public/icons/](public/icons/) | App icons |
| [tools/wordlists/](tools/wordlists/) | Script that rebuilt the word lists (already run) |

## Running the game (after the tasks are done)
```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests
npm run build        # static site in dist/ — host anywhere
npm run preview      # serve dist/ (test offline/PWA)
```
Dev helpers: `http://localhost:5173/?level=250` jumps to a level; `?reset` wipes progress.

## Building it with Qwen 2.5 Coder 14B (LM Studio + VS Code)

### LM Studio settings
- **Model:** `Qwen2.5-Coder-14B-Instruct` (Q4_K_M or Q5_K_M GGUF; Q6_K if you have VRAM to spare).
- **Context length:** `32768` (the model's native maximum). The VS Code agent's system prompt and tool definitions use a big part of this, which is why the docs are split into small files.
- **Temperature:** `0.2` (low = more precise code). Top-P `0.9`. Repeat penalty `1.05`.
- Make sure the LM Studio server is running, with tool use enabled for the model.

### Workflow: one task = one fresh chat
1. Open this folder in VS Code and start a **new chat** with the Qwen model in agent mode.
2. Send:
   > Read AGENTS.md, then do the next unchecked task in docs/PROGRESS.md. Follow the task file exactly and run its Verify commands.
3. When it reports done, check the result yourself (run the Verify commands; for UI tasks look at `npm run dev`).
4. Start a **new chat** for the next task. Small chats keep the model inside its context window and stop it from drifting.

### When the model struggles
- **It edits the wrong files or skips steps:** reply "Re-read docs/tasks/TXX-….md and list the Files and Verify sections, then continue."
- **It loops on a failing test:** paste the exact error and say "Fix only this error."
- **The file is too big for it to rewrite:** ask it to change one function at a time.
- **Tool calls fail (no file edits happen):** paste the task file into a plain chat, have Qwen write each file in full, and save them yourself.
- **The hardest tasks** are T08/T09 (generator), T16 (wheel input) and T19 (game wiring). If needed, split them into halves in your prompt ("only do `words.ts` first").
- Tests and the level validator are the safety net. Never let it delete or weaken a test to make it pass.

## Tech overview
TypeScript (strict) + Vite + plain DOM/SVG/CSS; Vitest for tests; levels are pre-generated offline (`npm run levels`) into `public/levels/*.json`; progress is saved in `localStorage`; a hand-written service worker gives offline play. Full details: [docs/03-architecture.md](docs/03-architecture.md).

## Credits
See [CREDITS.md](CREDITS.md).
