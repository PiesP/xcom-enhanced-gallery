/**
 * @fileoverview 스타일 서비스 (레거시 호환)
 * @description unified-style-service를 참조하는 래퍼
 */

export {
  unifiedStyleService as StyleService,
  unifiedStyleService as styleService,
  setCSSVariable,
  getCSSVariable,
  setCSSVariables,
  setTheme,
  updateComponentState,
  applyUtilityClasses,
  createThemedClassName,
} from './unified-style-service';

// 타입 정의
export type GlassmorphismIntensity = 'subtle' | 'medium' | 'strong';
export type ComponentState = 'default' | 'hover' | 'active' | 'disabled';
