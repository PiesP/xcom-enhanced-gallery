/**
 * @fileoverview 통합된 스타일 유틸리티 모듈
 * @description 스타일 관련 유틸리티 함수들의 통합 인터페이스
 * @version 4.0.0 - Phase 3: 통합
 */

// Core CSS utilities
export {
  combineClasses,
  setCSSVariable,
  setCSSVariables,
  updateComponentState,
  createThemedClassName,
} from './styles/css-utilities';

// toggleClass는 직접 export
export { toggleClass } from './styles/style-utils';

// Legacy style utils (backward compatibility)
export { getCSSVariable, applyTheme } from './styles/style-utils';

// Theme utilities
export { getXEGVariable, setGalleryTheme } from '../styles/theme-utils';

// Core DOM style utilities
export { safeAddClass, safeRemoveClass, safeSetStyle } from './core-utils';
