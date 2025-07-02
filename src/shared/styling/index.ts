/**
 * @fileoverview 통합 스타일링 시스템 인덱스
 * @description 통합 디자인 토큰 기반 스타일링 모듈
 * @version 3.0.0
 */

// 통합 디자인 토큰 시스템
export { UNIFIED_DESIGN_TOKENS } from '../design-system/tokens/UnifiedDesignTokens';
export { designSystemManager } from '../design-system/DesignSystemManager';

// 레거시 지원 (deprecated)
/** @deprecated Use UNIFIED_DESIGN_TOKENS instead */
export { DesignSystem } from '../design-system/DesignSystem';

// 타입 exports (레거시 디자인 시스템)
export type {
  FontSizeToken,
  FontWeightToken,
  DurationToken,
  EasingToken,
  RadiusToken,
  ZIndexToken,
  ShadowToken,
  ButtonVariant,
  ButtonSize,
  ButtonState,
  GalleryState,
  GalleryElement,
  ToastVariant,
  ToastState,
  ToolbarState,
  ToolbarSection,
} from '../design-system/DesignSystem';

// 통합 디자인 토큰 타입
export type {
  UnifiedDesignTokens,
  ColorToken,
  SpacingToken,
  TypographyToken,
} from '../design-system/tokens/UnifiedDesignTokens';

// 스타일 유틸리티
export * from '../utils/styles/style-utils';
