# T01 — Project scaffold

**Goal:** an empty Vite + TypeScript + Vitest project that builds, type-checks and runs tests.
**Read first:** `docs/03-architecture.md` (§Stack only).
**Depends on:** nothing.

## Files
Create exactly these (contents below are exact; copy them):
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `.gitignore`
- `src/main.ts` (temporary)
- `tests/smoke.test.ts` (temporary; delete in T03)

Do **not** touch the existing folders `data/`, `design/`, `docs/`, `public/icons/`, `tools/wordlists/`.

### `package.json`
```json
{
  "name": "word-vista",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "levels": "tsx tools/levelgen/generate.ts",
    "validate-levels": "tsx tools/levelgen/validate.ts",
    "wordlists": "node tools/wordlists/build-wordlists.mjs"
  },
  "dependencies": {
    "@fontsource/nunito": "^5.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.16.0",
    "tsx": "^4.19.0",
    "typescript": "~5.6.3",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "tests", "tools", "vite.config.ts"]
}
```

### `vite.config.ts`
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: { target: "es2022" },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
```

### `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
    <meta name="theme-color" content="#6c7bd0" />
    <link rel="icon" href="./icons/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png" />
    <title>Word Vista</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### `.gitignore`
```
node_modules/
dist/
data/raw/
*.log
.DS_Store
```

### `src/main.ts` (temporary — replaced in T14)
```ts
const root = document.getElementById("app");
if (root) {
  root.textContent = "Word Vista is booting…";
}
```

### `tests/smoke.test.ts` (temporary)
```ts
import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("runs tests", () => {
    expect(1 + 1).toBe(2);
  });
});
```

## Steps
1. Create the files above.
2. Run `npm install`.

## Verify
```
npm install
npm run typecheck
npm test
npm run build
```
All four must succeed. `npm run dev` should serve a page that says "Word Vista is booting…".

## Done when
All verify commands pass and `node_modules/` exists.
