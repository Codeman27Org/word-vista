# T23 — Final QA pass

**Goal:** everything in the checklist works; fix what doesn't.
**Read first:** `docs/06-testing-and-qa.md` (whole file); `AGENTS.md`.
**Depends on:** T22.

## Files
Any file under `src/`, `tests/`, `tools/levelgen/`, `public/` (except icons) that needs a bug fix. **No new features.**

## Steps
1. Run:
   ```
   npm run typecheck
   npm test
   npm run validate-levels
   npm run build
   ```
   Fix every failure.
2. `npm run dev`, then walk through **every** item of the manual QA checklist at 390×844, 320×568 and a desktop window. Write each failure down as a one-line bug in your reply, then fix them one at a time. After each fix, re-run `npm run typecheck && npm test`.
3. Search the code for leftovers and remove them: `console.log`, `TODO`, `any`, temporary stub code from T15–T18.
4. `npm run build && npm run preview` and complete the PWA checklist.
5. Compare each screen side by side with `design/mockup.html` and fix visual differences in CSS.

## Done when
All commands pass, every checklist item passes, and there are no console errors or warnings.
