/**
 * @fileoverview 통합 스타일 시스템 진입점 (v4.0.0)
 * @description 새로운 통합 스타일 관리자 기반 시스템
 * @version 4.0.0
 */

// === 새로운 통합 스타일 시스템 ===
// 핵심 관리자
export { UnifiedStyleManager, unifiedStyleManager, StylePriority } from './unified-style-manager';

// 부트스트래퍼
export {
  initializeStyleSystem,
  updateDynamicStyles,
  updateTheme,
  cleanupStyleSystem,
} from './style-bootstrapper';

// === 레거시 호환성 (점진적 제거 예정) ===
// 기존 스타일 매니저 (deprecated)
export { default as StyleManager } from './style-service';

// 기존 시스템과의 호환성
export { generateZIndexCSS, getZIndex } from './z-index-system';
export { getToken as getDesignToken } from './token-manager';

// 테마 유틸리티 함수들 (deprecated - 새 시스템에서는 updateTheme 사용)
export { getXEGVariable, setGalleryTheme, STYLE_CONSTANTS as themeDetector } from './theme-utils';

// 네임스페이스된 스타일 시스템 (deprecated)
export {
  initializeNamespacedStyles,
  cleanupNamespacedStyles,
  createNamespacedClass,
  createNamespacedSelector,
} from './namespaced-styles';

// 타입 export
export type { ComponentState } from './style-service';
