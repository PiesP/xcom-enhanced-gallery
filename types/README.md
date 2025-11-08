# types/ — Global Type Definitions

> TypeScript global environment and shared type declarations

## Overview

The `types/` root directory manages **global build environment variables** and
**third-party library type augmentation**. Domain-specific business types are
managed in `src/shared/types/`.

## File Structure

```
types/
├── env.d.ts        # Build-time global variables (__DEV__, __PROD__, __VERSION__)
└── README.md       # This document
```

## env.d.ts

**Purpose**: Declare global variables injected by Vite's define plugin

**Variables**:

- `__DEV__: boolean` — Development mode (npm run build:dev)
- `__PROD__: boolean` — Production mode (npm run build:prod)
- `__VERSION__: string` — Project version (package.json)

**Usage Example**:

```typescript
// src/shared/logging/logger.ts
const isDev = __DEV__; // Used instead of import.meta.env for tree-shaking optimization

if (__DEV__) {
  console.log(`App v${__VERSION__} running in development`);
}
```

**Features**:

- **Tree-shaking Optimization**: Better static analysis than `import.meta.env`
- **Type Safety**: TypeScript static verification support
- **Build Injection**: Auto-injected from `vite.config.ts` define plugin

### Definition Location

`vite.config.ts` define option:

```typescript
define: {
  __DEV__: JSON.stringify(isDev),
  __PROD__: JSON.stringify(isProd),
  __VERSION__: JSON.stringify(pkg.version),
}
```

## Type Management Policy

### ✅ Place in types/ root when:

- Global build environment variables (env.d.ts)
- Third-party library type augmentation (if needed)

### ✅ Place in src/shared/types/ when:

- Domain business types (app.types.ts, media.types.ts)
- UI/component types (ui.types.ts, component.types.ts) — **Phase 196 new**
- Core types (core/extraction.types.ts, core/media.types.ts)
- Settings types (settings/types/)

### ✅ Place in src/features/{name}/types/ when (Phase 196):

- Feature-specific state/action types that cannot live in shared types
- Avoid re-export barrels; expose only feature-local definitions
- Examples:
  - _(Deprecated)_ `@features/gallery/types/toolbar.types.ts` → moved to
    `@shared/types/toolbar.types.ts`
  - `@features/settings/types/settings-form.types.ts` (future)

### Phase 196 Migration Summary

**New Files**:

- `src/shared/types/ui.types.ts` (162 lines) — Theme, animation, UI component
  types
- `src/shared/types/component.types.ts` (281 lines) — BaseComponentProps and
  event handlers
- `src/features/gallery/types/toolbar.types.ts` (Phase 196) — Removed in Phase
  360 cleanup

**Improvement Effects**:

- `app.types.ts`: 482 lines → 268 lines (56% reduction)
- Enhanced Single Responsibility: Each file has clear domain ownership
- Clarified layer separation: Shared vs. Features types distinction

## TypeScript Configuration

`tsconfig.json` includes `types/`:

```jsonc
{
  "include": ["src/**/*", "types/**/*", "playwright/**/*", ...]
}
```

---

**Last Updated**: 2025-10-27 (Phase 196: Type file consolidation and layer
separation)
