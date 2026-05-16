# AGENTS.md

AI guidance for the **X.com Enhanced Gallery** userscript (PC-only).
> This file is maintained separately and is not tracked in the main repo history.

## Repository Layout

| Workspace | Path | Runtime | Package Manager | Purpose |
| --- | --- | --- | --- | --- |
| Root | `/` | Node.js | pnpm | Source, build, lint, quality |
| Tests | `/test` | Node.js | pnpm | Isolated test repo |

**Separation rules**
- `test/` is a standalone repo with its own `package.json`/configs.
- Never import from `../src` inside `test/`; use `test/src` (prepared via scripts).
- Root changes go in `/src`; tests live only in `/test`.
- When editing inside `test/`, follow `test/AGENTS.md`.

## Stack

Solid.js 1.9.x · TypeScript 6.0.x · Vite 8.x · Biome 2.x · Node.js 24.x (Volta) · pnpm 10.x

## Build / Lint / Quality (root)

```bash
pnpm install
pnpm build        # prod bundle (runs quality via prebuild)
pnpm build:dev    # dev bundle
pnpm build:fast   # build without quality checks
pnpm check        # tsc (src + tooling)
pnpm lint         # biome lint
pnpm lint:fix     # biome lint --write
pnpm fmt          # biome format check
pnpm fmt:fix      # biome format --write
pnpm quality      # tsc + biome + knip
pnpm quality:fix  # quality with auto-fix
pnpm verify       # build + test:all
```

## Tests (inside `test/` workspace)

```bash
cd test
pnpm install
pnpm test              # unit (Vitest)
pnpm test:watch        # watch mode
pnpm test:cov          # V8 coverage
pnpm test:cov:istanbul # Istanbul coverage
pnpm e2e               # Playwright E2E
pnpm e2e:ui            # E2E UI mode
pnpm mut               # full mutation
pnpm mut:fast          # fast profile
pnpm mut:high          # high-priority modules
pnpm mut:medium        # medium-priority modules
pnpm mut:priority      # priority pipeline
pnpm test:all          # deps:check + test + e2e + mut:priority
pnpm test:all:strict   # + imports:check
```

**Run a single unit test**
```bash
cd test
pnpm test unit/path/to/file.test.ts
# or use Vitest filters
pnpm test -- -t "test name"
```

**Prepare mirrored sources**
```bash
cd test
pnpm run prepare                         # symlink (fast)
pnpm run prepare -- --symlink false      # copy (required for Stryker)
```

## Code Style & Conventions

### Imports
- **Path aliases only** (`@shared/...`, `@features/...`, `@test/...`).
- **No barrel imports** (`index.*` re-exports are forbidden).
- **No relative parent imports** (lint error).
- **Static imports only** (`import()` is forbidden).
- Import order: external → internal types → internal modules → styles last.
- Use `import type` for types.

### TypeScript & Naming
- Strict TypeScript; avoid `any` (use `unknown` + narrowing).
- Explicit return types for exported functions.
- Component props are `readonly`.
- Components in PascalCase (`Component.tsx`), CSS modules in `Component.module.css`.
- Services in kebab-case files (e.g., `theme-service.ts`), class name PascalCase.
- Types: `ComponentName.types.ts` (components), `kebab-case.types.ts` (modules).
- Contracts: `kebab-case.contract.ts` for service interfaces only.

### Solid.js Patterns
- Use `splitProps` for props; avoid direct destructuring.
- Prefer `createMemo` for derived state, `createEffect` for side effects.
- Use `onCleanup` for teardown.
- Event handlers typed with `JSX.EventHandlerUnion`.

### Services & DI
- Prefer accessor functions from `@shared/container/container` (`getThemeService`, `getLanguageService`, `getMediaService`, `getDownloadOrchestrator`).
- Prefer the canonical singleton/getInstance entry points for shared services.
- **Do not** use `CoreServiceRegistry`.

### Styling
- CSS Modules only; no global styles.
- Use design tokens (`--xeg-*`), `oklch()`, and `rem`/`em` units.
- No hardcoded colors/sizes, no `!important`.

### Error Handling & Safety
- Avoid `eval`, `new Function`, or string-based timers.
- Avoid unsanitized `innerHTML`.
- Keep changes small and reversible; update docs when behavior changes.

## Userscript / Bundle Constraints

- Single-file IIFE userscript output only.
- No code splitting, no runtime `import()`.
- Avoid assets that trigger Vite URL handling (`?url`, `new URL()`, `url()` in CSS).
- Prefer static imports or inlined strings for small assets.

## External APIs

- Never call `GM_*` directly; use adapters/services.
- For Solid.js, import runtime functions directly; import types from vendor types.

## Event Handling

```ts
import { EventManager } from "@shared/services/event-manager";
const em = new EventManager();
em.addEventListener(element, "click", handler, { context: "my-component" });
em.cleanup();
```

**Do not use** `@shared/utils/events/core/listener-manager`.

## Output Targets

- Dev bundle: `dist/xcom-enhanced-gallery.dev.user.js`
- Prod bundle: `dist/xcom-enhanced-gallery.user.js`

## Copilot Instructions (source: `.github/copilot-instructions.md`)

- Code/docs/comments in **English**; assistant responses in **Korean**.
- Restate user intent at start of responses (Copilot behavior).
- Apply atomic reasoning for complex tasks; keep edits minimal.
- Require approval before adding dependencies.
- Testing expectation: unit → component → E2E → a11y → mutation (when relevant).
- No barrel imports, no relative parent imports, no dynamic imports.
- No hardcoded colors or `!important`, no touch/pointer events.
- Update docs/tests/changelog when behavior changes.
