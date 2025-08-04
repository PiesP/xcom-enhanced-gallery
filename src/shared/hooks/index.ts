/**
 * Shared Hooks - 공통 커스텀 훅 모듈
 *
 * Phase 2B Step 2: 공통 커스텀 훅들을 단순화하여 export
 */

// Core hooks
export {
  useToolbarState,
  getToolbarDataState,
  getToolbarClassName,
  type ToolbarState,
  type ToolbarActions,
  type ToolbarDataState,
} from './useToolbarState';

// Simple toolbar hook
export { useToolbar } from './useToolbar';

export {
  useScrollDirection,
  type UseScrollDirectionOptions,
  type UseScrollDirectionReturn,
} from './useScrollDirection';

export { useDOMReady } from './useDOMReady';
export { useKeyboardNavigation as useAccessibility } from './useAccessibility';

// Related scroll types (moved to individual hook files)
export type { ScrollDirection } from './useScrollDirection';
