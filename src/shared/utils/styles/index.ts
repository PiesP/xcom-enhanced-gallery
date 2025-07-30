/**
 * @fileoverview 스타일 유틸리티 export
 * @description CSS 클래스 및 스타일 관련 유틸리티
 * @version 2.0.0 - Simplified version
 */

// CSS utilities (new simplified version)
export * from './css-utilities';

// Legacy style utils (for backward compatibility)
export {
  combineClasses,
  toggleClass,
  setCSSVariable,
  getCSSVariable,
  updateComponentState,
  applyTheme,
} from './style-utils';
