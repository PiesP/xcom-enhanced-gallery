# types/ — Global Type Definitions

> Top-level ambient declarations and vendor stubs that do not belong in
> application source code.

## Overview

The `types/` directory hosts **global build-time variables** and
**third-party/DOM augmentations** that need to be visible everywhere. All
domain-specific application types live under `src/shared/types/`.

## Directory Structure

```
types/
├── babel-preset-solid.d.ts   # Stub for babel-preset-solid dynamic import
├── css-modules.d.ts          # CSS (module + global) module declarations
├── env.d.ts                  # Build-time globals from Vite define()
├── tests-dom-augment.d.ts    # JSDOM-specific HTMLElement helpers
└── README.md                 # This document
```

## File Guide

### env.d.ts

- Declares build flags injected by `vite.config.ts` (`__DEV__`, `__IS_DEV__`,
  `__VERSION__`, and `__FEATURE_MEDIA_EXTRACTION__`).
- Preferred over `import.meta.env` for tree-shaking because the constants are
  statically replaced during bundling.
- Example:

  ```typescript
  if (__IS_DEV__) {
    logger.debug(`Running v${__VERSION__}`);
  }
  ```

### css-modules.d.ts

- Provides typings for `*.module.css` (returns a readonly class map) and plain
  `*.css` imports (treated as strings). Supports both CSS Modules and global
  stylesheet side-effect imports.

### babel-preset-solid.d.ts

- Minimal declaration so that dynamic imports of `babel-preset-solid` (used by
  Playwright harness build tooling) receive a `PluginItem` type instead of
  `any`.

### tests-dom-augment.d.ts

- Extends `HTMLElement` with `asImage(): HTMLImageElement | null` for test-only
  helpers. The runtime patch is applied in `test/setup.ts`.

## Configuration

- `tsconfig.json` includes `types/**/*`, so ambient declarations are available
  project-wide without manual imports.
- Avoid adding business logic types here; prefer colocating them under
  `src/shared/types/` or feature-specific folders.

---

**Last Updated**: 2025-11-10 (Types directory cleanup)
