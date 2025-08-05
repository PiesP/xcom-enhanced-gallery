/**
 * @fileoverview 통합 유틸리티 모듈 - Week 2 TDD 구현
 * @description 스타일과 성능 유틸리티의 단일 진입점 제공
 * @version 1.0.0 - TDD GREEN Phase
 */

// 성능 유틸리티 통합
import {
  PerformanceUtils,
  throttle,
  debounce,
  rafThrottle,
  createDebouncer,
  measurePerformance,
  memo,
} from './performance-consolidated';

// 스타일 유틸리티 통합
import {
  setCSSVariable,
  getCSSVariable,
  setCSSVariables,
  createThemedClassName,
  updateComponentState,
  applyTheme,
  getXEGVariable,
  setGalleryTheme,
  safeAddClass,
  safeRemoveClass,
  safeSetStyle,
} from './styles';

// 성능 유틸리티 re-export
export {
  PerformanceUtils,
  throttle,
  debounce,
  rafThrottle,
  createDebouncer,
  measurePerformance,
  memo,
};

// 스타일 유틸리티 re-export
export {
  setCSSVariable,
  getCSSVariable,
  setCSSVariables,
  createThemedClassName,
  updateComponentState,
  applyTheme,
  getXEGVariable,
  setGalleryTheme,
  safeAddClass,
  safeRemoveClass,
  safeSetStyle,
};

/**
 * 통합 유틸리티 네임스페이스
 * 스타일과 성능 기능을 구조화된 방식으로 제공
 */
export const IntegratedUtils = {
  // 성능 관련 유틸리티
  performance: {
    throttle,
    debounce,
    rafThrottle,
    createDebouncer,
    measurePerformance,
    memo,
    PerformanceUtils,
  },

  // 스타일 관련 유틸리티
  styles: {
    setCSSVariable,
    getCSSVariable,
    setCSSVariables,
    createThemedClassName,
    updateComponentState,
    applyTheme,
    getXEGVariable,
    setGalleryTheme,
    safeAddClass,
    safeRemoveClass,
    safeSetStyle,
  },
} as const;

/**
 * 타입 안전한 통합 인터페이스
 */
export type IntegratedUtilsType = typeof IntegratedUtils;

/**
 * Backward compatibility를 위한 기본 export
 */
export default IntegratedUtils;
