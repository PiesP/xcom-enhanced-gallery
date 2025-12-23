/**
 * Shared Types Barrel Export
 *
 * @fileoverview Single import point for entire type ecosystem
 * @version 6.0.0 - Phase 352: Named export optimization
 *
 * **Structure**:
 * ```
 * types/
 * ├── index.ts (current) - barrel export
 * ├── app.types.ts - app global types + re-export hub
 * ├── ui.types.ts - UI/theme types
 * ├── component.types.ts - component Props/events
 * ├── media.types.ts - media-related types
 * ├── result.types.ts - Result pattern & ErrorCode
 * ├── navigation.types.ts - navigation types
 * └── core/ - core domain & infrastructure
 *     ├── core-types.ts - core types
 *     ├── base-service.types.ts - BaseService (circular dependency prevention)
 *     ├── userscript.d.ts - UserScript API
 *     └── index.ts - core barrel
 * ```
 *
 * **Usage Guide**:
 * - General case: `import type { ... } from '@shared/types'`
 * - Detailed types needed: `import type { ... } from '@shared/types/media.types'`
 * - Result pattern only: `import { success, failure } from '@shared/types/result.types'`
 */

// ==========================================
// Phase 352: Explicit Named Exports
// ==========================================

// Media-related types (only most frequently used ones specified)
;
// App global types (Phase 355.2: Result types removed, moved to result.types)
export type {
  AppConfig,
  
  
  
  
  
  
  
  
  
  
  
  
} from './app.types';
// Core types from app.types re-exports
export type {
  
  
  
  
  
  
  
  ViewMode,
} from './core/core-types';
;
;

// Phase 421: ViewMode helpers removed; use VIEW_MODES from '@constants/video-controls'

// Component Props types
export type {
  BaseComponentProps,
  
  
  
  
  
  
  
  
  
  
  
  
  
} from './component.types';
// UserScript API types (re-exported directly from userscript definition)
;

// Navigation state types
;
// Result pattern types (ErrorCode and Result related)
;
// Result utility functions and ErrorCode (Phase: Result Unification - expanded API)
// ErrorCode is re-exported as both value (const object) and type automatically
;
// Toolbar UI state types
export type {
  FitMode,
  
  
  
  
} from './toolbar.types';
// UI/theme types
export type {
  
  
  
  
  
  
  
  
  
  ImageFitMode,
  
  
  
  
} from './ui.types';
