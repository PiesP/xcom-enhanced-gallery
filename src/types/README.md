# src/types/ — Global Type Definitions

> Ambient declarations that the entire workspace relies on during builds and tests.

## Overview

This directory contains global type definitions that are not specific to any single feature or module. These declarations are merged into the global namespace and must remain minimal and stable to avoid conflicts.

## File Guide

### env.d.ts

Build flags injected at compile time via `vite.config.ts`:

- `__DEV__`: Development mode flag (boolean)
- `__VERSION__`: Package version (string)
- `__BUILD_TIME__`: Build timestamp (string)
- `__FEATURE_MEDIA_EXTRACTION__`: Feature toggle (boolean)

**Usage Pattern**:

```typescript
// ✅ GOOD: Tree-shakable conditionals
if (__DEV__) {
  console.log(`v${__VERSION__} (built: ${__BUILD_TIME__})`);
}

// ❌ BAD: Use import.meta.env instead
if (import.meta.env.DEV) {
  console.log("dev mode");
}
```

**Why**: Build flags allow compile-time elimination of dead code and are faster than runtime checks.

---

### css-modules.d.ts

Global type stubs for CSS imports:

- **CSS Modules** (`*.module.css`): Returns `readonly` class name map
- **Plain CSS** (`*.css`): Returns string (URL or inlined content)

**Usage Pattern**:

```typescript
// ✅ GOOD: CSS Module import
import styles from "./Button.module.css";
const className = styles.container; // readonly string

// ✅ GOOD: Side-effect import
import "@shared/styles/globals.css";

// ❌ BAD: Treating plain CSS as module
import css from "./global.css";
const cls = css.container; // Type error
```

**Why**: Separate types for side-effect vs. scoped consumption ensure both patterns stay type-safe.

---

### babel-preset-solid.d.ts

Stub declaration for `babel-preset-solid` dynamic import compatibility.

**Context**: Solid.js tooling may dynamically import this preset during certain build phases. This stub prevents TypeScript errors when the preset is not available at type-check time.

---

## Guidelines for New Global Types

### When to Add

- **✅ Add to `src/types/`**: Declarations needed by multiple workspaces (root & `/test/`)
- **✅ Add to `src/types/`**: Build-time environment flags or vendor stubs
- **❌ Don't add**: Type definitions specific to a single module (use `.types.ts` files instead)
- **❌ Don't add**: Service contracts (use `.contract.ts` files instead)

### Naming & Organization

- Use **kebab-case** for file names: `my-feature.d.ts`
- Use **PascalCase** for exported types: `MyType`
- Add **JSDoc comments** for complex types
- Keep **single responsibility**: one concern per file

### Example: Adding a New Global Type

```typescript
// ✅ GOOD: Global vendor stub
// src/types/my-vendor.d.ts
declare module "my-vendor" {
  export interface MyVendorAPI {
    readonly version: string;
    readonly init: () => Promise<void>;
  }
}

declare const MY_VENDOR_API: MyVendorAPI;
```

---

## File Structure

```
src/types/
├── README.md                  ← This file
├── env.d.ts                   ← Build environment flags
├── css-modules.d.ts           ← CSS import type stubs
└── babel-preset-solid.d.ts    ← Solid.js tooling compatibility
```

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) — Project context and architecture
- [AGENTS.md](../AGENTS.md) — Workspace and service patterns
