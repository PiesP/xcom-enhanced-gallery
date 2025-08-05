/**
 * @fileoverview 통합된 스타일 유틸리티 모듈
 * @description 스타일 관련 유틸리티 함수들의 통합 인터페이스
 * @version 4.0.0 - Phase 3: 통합
 */

// Core CSS utilities
// 스타일 관련 유틸리티 (StyleManager를 사용하세요)
export {
  setCSSVariable,
  getCSSVariable,
  setCSSVariables,
  createThemedClassName,
  updateComponentState,
} from './styles/css-utilities';

// Backward compatibility - exports commonly used style utilities
export { applyTheme } from './styles/style-utils';

// Theme utilities
export { getXEGVariable, setGalleryTheme } from '../styles/theme-utils';

// Core DOM style utilities
export { safeAddClass, safeRemoveClass, safeSetStyle } from './core-utils';
