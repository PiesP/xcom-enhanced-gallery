/**
 * Shared Hooks - 공통 커스텀 훅 모듈
 *
 * @description
 * X.com Gallery의 공통 커스텀 훅들을 관리합니다.
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
