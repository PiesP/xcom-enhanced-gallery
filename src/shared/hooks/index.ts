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
* 1. **useToolbarState**
 *    - State: isDownloading, isLoading, hasError
 *    - Actions: setDownloading, setLoading, setError, resetState
 *    - Features: Download debounce (300ms minimum display), state sync
 *
* 2. **useFocusTrap**
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
* @fileoverview Shared hooks layer - barrel export
* @version 11.0.0 - Comprehensive documentation + pattern consolidation
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
export type { ToolbarActions, ToolbarState } from '@shared/types/toolbar.types';
export {
  type ToolbarSettingsControllerResult,
  useToolbarSettingsController,
  type UseToolbarSettingsControllerOptions,
} from './toolbar/use-toolbar-settings-controller';
export { useToolbarState } from './use-toolbar-state';
