/**
 * Shared Hooks Layer - Solid.js custom hooks for common functionality
 *
 * **Purpose**: Provide reusable hooks for state management, accessibility, and UI control
 * **Pattern**: Barrel exports only, forbid direct imports of implementation files
 * **Architecture**: Hooks layer above utilities, below features
 *
 * **Public API**:
 * - `useToolbarState`: Toolbar state management (download, loading, error, fit mode)
 * - `useFocusTrap`: Focus trap for modal/dialog accessibility
 * - `useToolbarSettingsController`: Toolbar settings panel orchestration
 *
 * **Hooks Overview**:
 *
 * 1. **useToolbarState** (Phase 2B Step 2)
 *    - State: isDownloading, isLoading, hasError
 *    - Actions: setDownloading, setLoading, setError, resetState
 *    - Features: Download debounce (300ms minimum display), state sync
 *
 * 2. **useFocusTrap** (Phase 3.0.0)
 *    - Wraps @shared/utils/focus-trap utility
 *    - Supports Solid.js accessors, refs, or HTMLElement
 *    - Methods: activate(), deactivate(), isActive getter
 *    - Proper cleanup via onCleanup
 *
 * **Usage Pattern**:
 * ```typescript
 * // ✅ Correct: Use barrel export
 * import {
 *   useToolbarState,
 *   useFocusTrap,
 *   useToolbarSettingsController,
 *   type ToolbarState,
 *   type FocusTrapOptions,
 * } from '@shared/hooks';

 * // ❌ Forbidden: Direct import of implementation
 * import { useToolbarState } from '@shared/hooks/use-toolbar-state';
 * ```
 *
 * **Related Hooks (removed or moved)**:
 * - `useScrollDirection` - Removed (Phase 140.2 cleanup)
 * - `useDOMReady` - Removed (Phase 140.2 cleanup)
 * - `useKeyboardNavigation` - Removed (Phase 140.2 cleanup)
 * - `useFocusScope` - Removed (Phase 140.2 cleanup)
 * - `useGalleryToolbarLogic` - Removed (unused after Phase 140.2)
 *
 * **Service Integration**:
 * - globalTimerManager: Timer management for download debounce
 * - getSolid/getSolidStore: Solid.js vendor getter pattern
 *
 * **Performance**:
 * - Download state debounced (minimum 300ms display)
 * - Focus trap cleanup on component unmount
 * - Lazy listeners (only activate when needed)
 *
 * **Testing Considerations**:
 * - Mock getSolid/getSolidStore for unit tests
 * - Stub globalTimerManager for deterministic timing
 * - Use accessor functions for reactive updates
 *
 * **Related Documentation**:
 * - {@link ../../utils/toolbar-utils.ts} - Toolbar utility functions
 * - {@link ../../utils/focus-trap.ts} - Focus trap implementation
 * - {@link ../../types/toolbar.types.ts} - Toolbar type definitions
 * - {@link ./toolbar/use-toolbar-settings-controller.ts} - Toolbar-specific settings hook
 *
 * @fileoverview Shared hooks layer - barrel export (Phase 376)
 * @version 11.0.0 - Phase 376: Comprehensive documentation + pattern consolidation
 * @internal Implementation details in individual files, not here
 */

// Core hooks (Solid.js custom hooks)
/**
 * **useToolbarState**: Toolbar state management with download debounce
 *
 * Provides toolbar UI state (downloading, loading, error)
 * and action methods to update state.
 *
 * @see useToolbarState - Full hook documentation
 */
export { useToolbarState } from "./use-toolbar-state";
export type { ToolbarState, ToolbarActions } from "@shared/types/toolbar.types";

export {
  useToolbarSettingsController,
  type UseToolbarSettingsControllerOptions,
  type ToolbarSettingsControllerResult,
} from "./toolbar/use-toolbar-settings-controller";

// Phase 376: Removed hooks (archived history)
/**
 * **Deprecated/Removed Hooks** (Phase 140.2 cleanup):
 *
 * These hooks were removed as part of the Phase 140.2 unused code cleanup:
 * - `useDOMReady` - No longer needed
 * - `useKeyboardNavigation` - Functionality moved to event handlers
 * - `useFocusScope` - Replaced by useFocusTrap
 * - `useScrollDirection` - Functionality moved to utils
 * - `useGalleryToolbarLogic` - Unused after Phase 140.2 refactor
 *
 * If you need similar functionality, use:
 * - FocusTrap from @shared/utils/focus-trap (standalone)
 * - EventManager (Phase 329) for keyboard events
 * - Custom effect hooks in your component
 */
