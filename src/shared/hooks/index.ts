/**
 * Shared Hooks - 공통 커스텀 훅 모듈
 *
 * @description
 * X.com Enhanced Gallery의 공통 커스텀 훅들을 관리합니다.
 * 상태 관리, UI 로직, 비즈니스 로직 분리를 위한 훅들을 제공합니다.
 *
 * @module shared/hooks
 */

// Toolbar 관련 훅
export {
  useToolbarState,
  getToolbarDataState,
  getToolbarClassName,
  type ToolbarState,
  type ToolbarActions,
  type ToolbarDataState,
} from './useToolbarState';

// 스크롤 방향 감지 훅
export {
  useScrollDirection,
  type UseScrollDirectionOptions,
  type UseScrollDirectionReturn,
} from './useScrollDirection';

// DOM 준비 상태 감지 훅
export { useDOMReady } from './useDOMReady';

// 사용자 활동 감지 훅
export { useIdle } from './useIdle';

// 키보드 네비게이션 훅
export { useKeyboardNavigation } from './useAccessibility';

// 스크롤 관련 타입들 (통합된 버전)
export type {
  ScrollPosition,
  GalleryScrollPosition,
  GalleryScrollOptions,
  GalleryScrollState,
  ScrollDirection,
  ScrollBlock,
  ScrollEventHandler,
  ScrollCallback,
} from '../types/scroll.types';
