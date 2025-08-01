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

export {
  useScrollDirection,
  type UseScrollDirectionOptions,
  type UseScrollDirectionReturn,
} from './useScrollDirection';

export { useDOMReady } from './useDOMReady';
export { useKeyboardNavigation } from './useAccessibility';

// Related scroll types (moved to individual hook files)
export type { ScrollDirection } from './useScrollDirection';
