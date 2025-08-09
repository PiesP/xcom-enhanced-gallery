/**
 * @fileoverview 🟢 GREEN: 통합 유틸리티 네임스페이스 (Phase 1.2 업데이트)
 * @description 스타일과 성능 유틸리티의 단일 진입점 제공, 중복 제거 완료
 * @version 2.0.0 - TDD 기반 스타일 통합 완료
 */

// 🟢 GREEN: 성능 유틸리티 통합 (Phase 1.1 완료)
import { Performance, throttle, debounce, rafThrottle, measurePerformance } from './performance';
import { memo } from './optimization/memo';

// 🟢 GREEN: 스타일 유틸리티 통합 (Phase 1.2 완료) - 새로운 통합 모듈 사용
import { setCSSVariable, getCSSVariable, setCSSVariables, toggleClass, applyTheme } from './styles';

// 🟢 GREEN: 추가 스타일 기능들은 원본에서 직접 import
import { createThemedClassName, updateComponentState } from '@shared/styles/style-service';

export { Performance, throttle, debounce, rafThrottle, measurePerformance, memo };

// 🟢 GREEN: 통합된 스타일 유틸리티 re-export
export {
  setCSSVariable,
  getCSSVariable,
  setCSSVariables,
  toggleClass,
  applyTheme,
  createThemedClassName,
  updateComponentState,
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
    measurePerformance,
    memo,
    Performance,
  },

  // 스타일 관련 유틸리티
  styles: {
    setCSSVariable,
    getCSSVariable,
    setCSSVariables,
    createThemedClassName,
    updateComponentState,
    applyTheme,
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
