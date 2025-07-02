/**
 * @fileoverview 통합 디자인 시스템 진입점
 * @description 모든 디자인 관련 기능의 단일 진입점 (v2.0)
 * @version 2.0.0
 */

// 통합 디자인 토큰
export * from './tokens/UnifiedDesignTokens';

// 통합 디자인 시스템 매니저
export * from './DesignSystemManager';

// 편의 타입 및 상수
export type Theme = 'light' | 'dark';
export type ThemeOption = Theme | 'auto';

/**
 * 디자인 시스템 상수
 */
export const DESIGN_SYSTEM_CONSTANTS = {
  STYLE_ID_PREFIX: 'xeg-unified-design-system',
  CSS_VAR_PREFIX: '--xeg-',
  CLASS_PREFIX: 'xeg-',
  THEME_ATTRIBUTE: 'data-theme',
  GALLERY_ACTIVE_CLASS: 'xeg-gallery-active',
} as const;

// 하위 호환성을 위한 레거시 export (점진적 제거 예정)
// @deprecated - UnifiedDesignTokens 사용 권장
export { DesignSystem } from './DesignSystem';

// @deprecated - DesignSystemManager 사용 권장
export { getDesignTokens, DESIGN_TOKENS } from './tokens/DesignTokens';
