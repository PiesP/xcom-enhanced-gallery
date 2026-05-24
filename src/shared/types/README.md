# Shared Types System

## 📚 Overview

`src/shared/types/` directory contains shared type definitions.

- **Domain separation**: Import directly from specific type files as needed
- **No barrel exports**: Follows CODE_STANDARDS.md no-barrel-imports rule
- **Organized by domain**: Each file contains related types

---

## 🏗️ Directory Structure

```
src/shared/types/
├── app.types.ts              # App-level types (AppConfig, Brand types)
├── ui.types.ts               # UI/theme types (Theme, Button variants)
├── component.types.ts        # Component Props (BaseComponentProps)
├── media.types.ts            # Media domain types
├── result.types.ts           # Result pattern & ErrorCode
├── navigation.types.ts       # Navigation types
├── toolbar.types.ts          # Toolbar UI state types
├── lifecycle.types.ts        # Lifecycle/cleanup types
└── core/                     # Core infrastructure types
    ├── base-service.types.ts # BaseService definition
    ├── core-types.ts         # Gallery domain types
    ├── cookie.types.ts       # Cookie API types
    └── userscript.d.ts       # UserScript API definitions
```

---

## 📖 Import Patterns

### ✅ Recommended - Direct imports

```typescript
// Import from specific domain files
import type { MediaInfo } from "@shared/types/media.types";
import type { Theme } from "@shared/types/ui.types";
import type { Result } from "@shared/types/result.types";
import type { GalleryState } from "@shared/types/core/core-types";
```

### ❌ Not Allowed - Barrel exports

```typescript
// Do NOT use barrel imports - violates CODE_STANDARDS.md 3.2
import type { MediaInfo } from "@shared/types";
import type { Theme } from "@shared/types";
```

---

## 📖 File Descriptions

### `app.types.ts`

- **Purpose**: App-level type definitions
- **Includes**: AppConfig, Brand types (UserId, TweetId, etc.), DeepPartial, Option, Optional

- **Purpose**: Unified management of multiple domain types
- **Sections**:
  - SERVICE TYPES: Service base interfaces
  - GALLERY TYPES: Gallery state, actions, events
  - MEDIA MAPPING TYPES: Media mapping strategies
  - LIFECYCLE TYPES: Lifecycle interfaces
  - RESULT TYPES: Result pattern utility functions

#### `core/base-service.types.ts` - BaseService definition

- **Purpose**: Base service interface
- **Size**: 12 lines (very small)
- **Reason**: Separated to prevent circular dependency

#### `core/extraction.types.ts` - Backward compatibility bridge

- **Status**: Removed; extraction types now imported from `media.types.ts`
- **Reason**: Consolidation to reduce file duplication
- **Note**: Legacy guides should reference `@shared/types/media.types`

#### `core/userscript.d.ts` - UserScript API (205 lines)

- **Purpose**: Type definitions for UserScript API
- **Includes**: GM\_\* function declarations (download, getValue, setValue, etc.)
- **Characteristic**: Infrastructure/definition file only

---

## 💡 Usage Guide

### Basic Usage

```typescript
// Recommended: Import from barrel export
import type { BaseService, MediaInfo, Result } from "@shared/types";

// When detailed types needed
import type { MediaExtractionOptions } from "@shared/types/media.types";
import type { ToolbarState } from "@shared/types/toolbar.types";

// Using Result pattern
import { failure, isSuccess, success } from "@shared/types";
```

### Import Principles

| Situation       | Recommended Import              |
| --------------- | ------------------------------- |
| General types   | `@shared/types`                 |
| Detailed types  | `@shared/types/{domain}`        |
| UI types only   | `@shared/types/ui.types`        |
| Component Props | `@shared/types/component.types` |

### ❌ Patterns to Avoid

```typescript
// Legacy path (removed during gallery cleanup)
import type { GalleryConfig } from "@features/gallery/types";

// Use shared types directly instead
import type { ToolbarState } from "@shared/types/toolbar.types";
```

---

## 🔄 Major Migrations

### Phase 195: media.types.ts Integration

- core/media.types.ts → @shared/types/media.types.ts (moved to root)
- Reason: Media is a shared domain

### Phase 196: Type File Separation

- ui.types.ts, component.types.ts newly created
- app.types.ts structured

### Phase 197: Structure Clarification

- app.types.ts simplified (350 lines → 205 lines)
- BaseService duplication removed
- JSDoc enhanced

### Phase 197.1: Circular Dependency Resolution

- toolbar.types @features → @shared/types moved
- Reason: @shared code depends on it
- Backward compat maintained via re-export from @features

---

## 📋 File Size Reference

| File               | Size | Description       |
| ------------------ | ---- | ----------------- |
| media.types.ts     | 558  | Media domain      |
| core-types.ts      | 613  | Integrated domain |
| userscript.d.ts    | 205  | UserScript API    |
| component.types.ts | 356  | Component Props   |
| app.types.ts       | 205  | App level + hub   |

---

## ⚠️ Known Considerations

### 1. core-types.ts Size

- Currently 613 lines, somewhat large
- Unified management of multiple domain types
- Advantage: Single file → simple import path
- Disadvantage: Diverse responsibilities

### 2. Re-export Chain

- app.types.ts re-exports from multiple files
- Complex but provides single import point

### 3. Backward Compatibility

- extraction.types.ts: Maintains backward compat
- Gallery toolbar types now live solely under `@shared/types/toolbar.types.ts`
- Previous `@features/gallery/types` barrel was removed (Phase 360 cleanup)

---

## 🚀 Planned Improvements

### Phase 197.2

- Review core-types.ts domain-specific optimization
- Optimize media.types.ts size

### Phase 198+

- Continuous Types README updates
- Unused type cleanup
- Review structure when adding new domain types
