# Shared Types System

## 📚 Overview

`src/shared/types/` directory is responsible for shared type definitions across
the entire project.

- **Single import point**: `@shared/types`
- **Domain separation**: Detailed files for each domain
- **Re-export hub**: app.types.ts provides centralized export
- **Backward Compatibility**: Previous import paths also supported to a limited
  extent

---

## 🏗️ Directory Structure

```
src/shared/types/
├── index.ts                      # Barrel export (recommended import point)
├── app.types.ts (205 lines)     # App level + re-export hub
├── ui.types.ts                   # UI/theme related types
├── component.types.ts           # Component Props/events
├── media.types.ts (558 lines)   # Media & extraction domain
├── result.types.ts              # Result pattern & ErrorCode
├── navigation.types.ts          # Navigation types
├── toolbar.types.ts             # Toolbar UI state (Phase 197.1)
└── core/                        # Infrastructure & core domain
    ├── index.ts                 # Core barrel
    ├── core-types.ts (613 lines) # Integrated domain types
    ├── base-service.types.ts    # BaseService definition
    ├── extraction.types.ts      # Backward compat layer
    └── userscript.d.ts (205 lines) # UserScript API
```

---

## 📖 Purpose of Each File

### Root Level Files

#### `index.ts` - Barrel export

- **Purpose**: Single entry point for entire type system
- **Role**: Re-export all public types
- **Usage**: `import type { Result, MediaInfo } from '@shared/types'`

#### `app.types.ts` - App-level types

- **Purpose**: App global type definitions + re-export hub for subordinate files
- **Includes**: AppConfig, Cleanupable, Nullable, DeepPartial
- **Brand types**: UserId, TweetId etc.
- **Size**: 205 lines (reduced from 350 lines in Phase 197)

#### `ui.types.ts` - UI/theme types

- **Purpose**: UI-related types
- **Includes**: Theme, GalleryTheme, ButtonVariant
- **Usage**: UI components, theme system

#### `component.types.ts` - Component types

- **Purpose**: Component Props and event types
- **Includes**: BaseComponentProps, InteractiveComponentProps
- **Role**: Basic Props definition that all components inherit

#### `media.types.ts` - Media & extraction types

- **Purpose**: Media domain types (size: 558 lines)
- **Includes**: MediaInfo, MediaExtractionOptions, TweetInfo
- **Characteristic**: Includes ExtractionError class

#### `result.types.ts` - Result pattern & ErrorCode

- **Purpose**: Explicit representation of success/failure
- **Includes**: BaseResult, ResultSuccess, ResultError
- **ErrorCode**: Integrated generic + media-specific

#### `navigation.types.ts` - Navigation types

- **Purpose**: Gallery navigation-related types
- **Includes**: NavigationSource ('button' | 'keyboard' | 'scroll' |
  'auto-focus')

#### `toolbar.types.ts` - Toolbar UI types (Phase 197.1 new)

- **Purpose**: Toolbar UI state types
- **Includes**: ToolbarDataState, ToolbarState, ToolbarActions, FitMode
- **Reason**: @shared code depends on this, moved from @features

### Core Layer Files

#### `core/index.ts` (removed) - Legacy core barrel

- **Status**: Removed after Phase 364 simplification
- **Reason**: Direct imports from `core/core-types.ts` and `userscript.d.ts`
  replace the barrel

#### `core/core-types.ts` - Integrated domain types (613 lines)

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

#### `core/extraction.types.ts` (removed) - Backward compatibility bridge

- **Status**: Removed; extraction types now imported from `media.types.ts`
- **Note**: Legacy guides should reference `@shared/types/media.types`

#### `core/userscript.d.ts` - UserScript API (205 lines)

- **Purpose**: Type definitions for UserScript API
- **Includes**: GM\_\* function declarations (download, getValue, setValue,
  etc.)
- **Characteristic**: Infrastructure/definition file

---

## 💡 Usage Guide

### Basic Usage

```typescript
// Recommended: Import from barrel export
import type { Result, MediaInfo, BaseService } from '@shared/types';

// When detailed types needed
import type { MediaExtractionOptions } from '@shared/types/media.types';
import type { ToolbarState } from '@shared/types/toolbar.types';

// Using Result pattern
import { success, failure, isSuccess } from '@shared/types';
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
import type { GalleryConfig } from '@features/gallery/types';

// Use shared types directly instead
import type { ToolbarState } from '@shared/types/toolbar.types';
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
