/**
 * Shared Hooks - 공통 커스텀 훅 모듈
 *
 * Phase 2B Step 2: 공통 커스텀 훅들을 단순화하여 export
 * Phase 140.2: 미사용 훅 제거 (use-dom-ready, use-accessibility, use-focus-scope)
 * 2025-10-26:
 *   - useGalleryToolbarLogic 제거 (미사용, Phase 140.2 이후 미정리)
 *   - getToolbarDataState, getToolbarClassName → toolbar-utils로 분리 (Phase 2)
 */

// Core hooks
export { useToolbarState, type ToolbarState, type ToolbarActions } from './use-toolbar-state';

// Toolbar utilities (Phase 2: shared/utils/toolbar-utils로 분리)
export {
  getToolbarDataState,
  getToolbarClassName,
  type ToolbarDataState,
} from '../utils/toolbar-utils';

// useScrollDirection이 제거되었으므로 주석 처리
// export {
//   useScrollDirection,
//   type UseScrollDirectionOptions,
//   type UseScrollDirectionReturn,
// } from './useScrollDirection';

// Removed in Phase 140.2 (unused code cleanup):
// - useDOMReady
// - useKeyboardNavigation (from use-accessibility)
// - useFocusScope

// Related scroll types (moved to individual hook files) - useScrollDirection 제거됨
// export type { ScrollDirection } from './useScrollDirection';
