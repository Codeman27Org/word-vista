# Agent Instructions

You are building **Word Vista**: a browser word-puzzle game with the Wordscapes gameplay loop (swipe letters on a wheel → fill a crossword → next level). TypeScript + Vite + plain DOM/SVG/CSS. No frameworks, no ads, no accounts, no network calls except loading the app's own files.

## Workflow: one task per chat
1. Open `docs/PROGRESS.md`. The **first unchecked task** is your task. Do only that task.
2. Open that task file in `docs/tasks/`. Read the docs listed under **Read first** (only the sections named, if sections are given). Do not read other task files.
3. Create or edit **only** the files listed under **Files**.
4. Run every command under **Verify**. If something fails, read the error, fix the code, and run it again. Repeat until everything passes.
5. In `docs/PROGRESS.md`, change that task's `[ ]` to `[x]` and add a short note after it. Then stop and give a summary of what you did.

## App versioning
- Always bump the displayed app version in `src/ui/overlays/settingsSheet.ts` once per completed app change, before committing or pushing. This file is allowed for the version update even if it is not listed under the task's **Files**.
- Use `MAJOR.MINOR.PATCH`: small fixes, polish, and minor UI changes increment PATCH (for example, `1.3.0` -> `1.3.1`).
- Bigger changes, such as substantial features or enhancements, increment MINOR and reset PATCH (for example, `1.3.1` -> `1.4.0`).
- The biggest changes, such as major redesigns or breaking changes, increment MAJOR and reset MINOR and PATCH (for example, `1.4.0` -> `2.0.0`).
- Update the adjacent commit label to the latest implementation commit's short hash. Do not bump again merely to commit or push an already-versioned change; documentation-only and instruction-only changes need no bump.

## Hard rules
- TypeScript `strict`. Never use `any`, `@ts-ignore`, or `@ts-expect-error`.
- `src/core/**` is pure logic: no DOM, no `window`, no `document`, no `localStorage`, no `fetch`, no `Math.random()`. Randomness comes from an `Rng` parameter.
- Only `src/ui/**` touches the DOM. Views get data + callbacks; they do not import `src/data/*` or `src/core/game.ts`.
- Do not change `src/core/types.ts` or `src/core/constants.ts` unless your task says so.
- Use the **exact** file names, function names and signatures from the docs. If a doc and existing code disagree, follow the doc.
- Do not install packages. The full dependency list is in `package.json` (T01).
- Always write complete files. Never leave placeholders like `// ... existing code ...` or `// TODO: implement`.
- Named exports only (no `export default`), except `vite.config.ts`.
- Game words and letters are UPPERCASE. Only files in `data/words/` are lowercase.
- Keep files under ~250 lines; split helpers into the files the docs name.
- Do not edit files in `docs/`, `design/`, `data/words/`, or `public/icons/` (except ticking `docs/PROGRESS.md`).

## Commands
`npm run typecheck` · `npm test` · `npm test -- <file>` · `npm run build` · `npm run dev` · `npm run levels` · `npm run validate-levels`

## Docs
- `docs/01-game-design.md`: rules, economy, progression
- `docs/02-visual-design.md`: colors, layout, animation, sound (CSS lives in `design/mockup.html`)
- `docs/03-architecture.md`: folder tree, layering, module APIs, event flow
- `docs/04-data-contracts.md`: exact `types.ts`, `constants.ts`, JSON and save formats
- `docs/05-level-generator.md`: offline level generation algorithm
- `docs/06-testing-and-qa.md`: tests to write, manual QA checklist
