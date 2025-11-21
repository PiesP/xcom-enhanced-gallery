# types/ — Global Type Definitions

> Ambient declarations that the entire workspace relies on during builds and
> tests. Feature-/domain-specific types continue to live under
> `src/shared/types/`.

## Overview

`types/` now focuses on two concerns:

1. **Build-time globals** provided by Vite (`env.d.ts`).
2. **Tooling/vendor shims** that do not ship to production bundles
  (`css-modules.d.ts`, `babel-preset-solid.d.ts`, `config-load-local-config.d.ts`).

Legacy DOM augmentations, WeakRef shims, and design-token unions have been
removed to keep the directory lean. Tests should prefer locally-scoped helpers
under `test/`, while CSS token typing is generated inside
`src/shared/types/generated/`.

## Directory Structure

```
types/
├── README.md
├── babel-preset-solid.d.ts        # Stub for babel-preset-solid dynamic import
├── config-load-local-config.d.ts  # Module declaration for CI-safe loader
├── css-modules.d.ts               # CSS module/global stylesheet typings
└── env.d.ts                       # Build-time globals from Vite define()
```

## File Guide

### env.d.ts

- Declares build flags injected via `vite.config.ts` (`__DEV__`, `__IS_DEV__`,
  `__VERSION__`, `__FEATURE_MEDIA_EXTRACTION__`) plus the optional
  `__XEG_DEBUG__` surface for dev/test tracing.
- Prefer these symbols over `import.meta.env` for tree-shakable conditionals.

### css-modules.d.ts

- Returns a readonly class map for `*.module.css` imports.
- Treats plain `*.css` imports as strings so both side-effect and inline
  consumption stay type-safe.

### config-load-local-config.d.ts

- Provides a reusable `LoadLocalConfig` signature and module declarations for
  both `./config/utils/load-local-config` and the emitted `.js` stub used by
  tooling. This keeps dynamic imports typed inside `vite.config.ts` without
  pulling the entire `config/` folder into `tsconfig`.

### babel-preset-solid.d.ts

- Minimal ESM declaration so that Playwright/test harness tooling can
  dynamically import `babel-preset-solid` and still receive a `PluginItem`
  instead of `any`.

## Related Generators

- `scripts/generate-design-token-types.ts` now writes directly to
  `src/shared/types/generated/design-token-names.ts`, ensuring runtime helpers
  (`assertDesignTokenName`) and TypeScript unions share a single source of
  truth.

## Configuration

- `tsconfig.json` includes `types/**/*`, so ambient declarations stay visible
  everywhere without manual imports.
- Keep this directory dedicated to cross-cutting concerns; application-level
  types belong under `src/shared/` or feature folders.

---

**Last Updated**: 2025-11-21 (Ambient cleanup + design-token pipeline overhaul)
