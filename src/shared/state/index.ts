/**
 * @fileoverview State Layer Exports
 * @description 상태 관리 관련 exports
 */

// 앱 상태
export * from './app-state';

// 갤러리 시그널들
export * from './signals/gallery.signals';

// 다운로드 시그널들
export * from './signals/download.signals';

// 스크롤 상태
export type { ScrollState, ScrollDirection } from './signals/scroll.signals';
export { INITIAL_SCROLL_STATE } from './signals/scroll.signals';

// 툴바 시그널들 - addEventListener 충돌 해결을 위해 명시적 export
export type { ToolbarState, ToolbarEvents } from './signals/toolbar.signals';
export {
  toolbarState,
  updateToolbarMode,
  setHighContrast,
  getCurrentToolbarMode,
  getToolbarInfo,
  getCurrentMode,
  addEventListener as addToolbarEventListener,
} from './signals/toolbar.signals';
