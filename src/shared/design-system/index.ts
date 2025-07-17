/**
 * @fileoverview 통합 디자인 시스템 진입점
 * @description 모든 디자인 관련 기능의 단일 진입점 (v3.1.0)
 * @version 3.1.0
 */

// 통합 디자인 토큰
export * from './tokens/DesignTokens';

// 통합 디자인 시스템 매니저
export * from './DesignSystem';

// 디자인 유틸리티 (중복 제거)
export {
  getCSSVariable,
  setCSSVariable,
  tokenToCSSVariable,
  getColorToken,
  getSpacingToken,
  getTypographyToken,
  getShadowToken,
  getThemeColorToken,
  validateDesignTokens,
  getBreakpointToken,
  createMediaQuery,
  createCSSProperties,
  createStyleString,
  getSystemTheme,
} from './utils/design-utils';

// 편의 타입 및 상수
export type Theme = 'light' | 'dark';
export type ThemeOption = Theme | 'auto';

/**
 * 디자인 시스템 상수
 */
export const DESIGN_SYSTEM_CONSTANTS = {
  STYLE_ID_PREFIX: 'xg-design-system',
  CSS_VAR_PREFIX: '--xeg-',
  CLASS_PREFIX: 'xeg-',
  THEME_ATTRIBUTE: 'data-theme',
} as const;

/**
 * 편의 함수들 (통합된 API)
 */
export {
  designSystem,
  initDesignSystem,
  getDesignToken,
  getCSSVar,
  switchTheme,
  getTheme,
  isDesignSystemReady,
  diagnoseDesignSystem,
} from './DesignSystem';
