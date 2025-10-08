/**
 * @fileoverview 스타일 유틸리티 export
 * @description CSS 클래스 및 스타일 관련 유틸리티
 * @version 2.0.0
 */

// CSS utilities
export * from './css-utilities';

// Style utility functions (combineClasses, toggleClass 등 - 하위 호환성 유지)
export {
  combineClasses,
  toggleClass,
  setCSSVariable,
  getCSSVariable,
  updateComponentState,
  applyTheme,
} from './style-utils';
