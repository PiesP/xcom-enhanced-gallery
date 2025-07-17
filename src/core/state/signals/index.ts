/**
 * @fileoverview Core Signals Barrel Export
 * @version 1.0.0 - Clean Architecture
 */

// Gallery state management
export * from './gallery.signals';

// Download state management
export * from './download.signals';

// Toolbar state management (간소화된 CSS 호버 시스템용)
export {
  toolbarState,
  updateToolbarMode,
  setHighContrast,
  getCurrentToolbarMode,
  getToolbarInfo,
  // 툴바 전용 addEventListener로 별칭 사용
  addEventListener as addToolbarEventListener,
  // 레거시 호환성
  getCurrentMode,
  type ToolbarState,
  type ToolbarEvents,
} from './toolbar.signals';
