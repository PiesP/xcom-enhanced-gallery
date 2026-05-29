# Shared Types System

## 📚 Overview

`src/shared/types/` directory contains shared type definitions used across the project.

- **Domain separation**: Import directly from specific type files as needed
- **No barrel exports**: Follows CODE_STANDARDS.md no-barrel-imports rule
- **Organized by domain**: Each file contains related types

---

## 🏗️ Directory Structure

```
src/shared/types/
├── lifecycle.types.ts        # Lifecycle/cleanup types
├── media.types.ts            # Media domain types
├── settings.types.ts         # Settings-related types
├── toolbar.types.ts          # Toolbar UI state types
└── core/
    ├── cookie.types.ts       # Cookie API types
    └── userscript.d.ts       # UserScript API definitions
```

---

## 📖 Import Patterns

### ✅ Recommended - Direct imports

```typescript
// Import from specific domain files
import type { MediaInfo } from "@shared/types/media.types";
import type { ImageFitMode } from "@shared/types/settings.types";
import type { ToolbarState } from "@shared/types/toolbar.types";
import type { CookieOptions } from "@shared/types/core/cookie.types";
```

### ❌ Not Allowed - Barrel exports

```typescript
// Do NOT use barrel imports - violates CODE_STANDARDS.md 3.2
import type { MediaInfo } from "@shared/types";
import type { ImageFitMode } from "@shared/types";
```

---

## 📖 File Descriptions

### Root-level files

#### `lifecycle.types.ts`

- **Purpose**: Lifecycle and cleanup type definitions
- **Size**: 34 lines
- **Includes**: Interfaces for component lifecycle management

#### `media.types.ts`

- **Purpose**: Media domain type definitions
- **Size**: 155 lines
- **Includes**: Media extraction options, media info types, and related domain types

#### `settings.types.ts`

- **Purpose**: Settings-related type definitions
- **Size**: 100 lines
- **Includes**: `ImageFitMode` enum, settings configuration types

#### `toolbar.types.ts`

- **Purpose**: Toolbar UI state type definitions
- **Size**: 37 lines
- **Includes**: `ToolbarState`, `ToolbarDataState`, and related UI state types

### `core/` directory

#### `core/cookie.types.ts`

- **Purpose**: Cookie API type definitions
- **Size**: 68 lines
- **Includes**: Cookie options, cookie storage types

#### `core/userscript.d.ts`

- **Purpose**: TypeScript declaration file for UserScript API (GM_* functions)
- **Size**: 134 lines
- **Characteristic**: Declaration file only — no runtime code
- **Includes**: `GM_download`, `GM_getValue`, `GM_setValue`, etc.

---

## 📋 File Size Reference

| File                          | Size | Description               |
| ----------------------------- | ---- | ------------------------- |
| media.types.ts                | 155  | Media domain types        |
| userscript.d.ts               | 134  | UserScript API            |
| settings.types.ts             | 100  | Settings types            |
| core/cookie.types.ts          |  68  | Cookie API types          |
| toolbar.types.ts              |  37  | Toolbar UI state types    |
| lifecycle.types.ts            |  34  | Lifecycle/cleanup types   |

---

## ⚠️ Known Considerations

### File Size

- `media.types.ts` (155 lines) is the largest root-level type file
- `userscript.d.ts` (134 lines) is a declaration-only file, not runtime code
- All other type files are under 100 lines, keeping concerns well-separated

### Naming Convention

- Root-level type files use `kebab-case.types.ts` naming (e.g., `media.types.ts`)
- The `core/` subdirectory follows the same convention with `kebab-case.types.ts`
- Exception: `userscript.d.ts` is a `.d.ts` declaration file, not a `.types.ts` module
