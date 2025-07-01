/**
 * @fileoverview 간소화된 스타일링 시스템 인덱스
 * @description CSS와 JavaScript 책임 분리를 위한 간소화된 스타일링 모듈
 * @version 2.0.0
 */

export { DesignSystem } from '../design-system/DesignSystem';
export type {
  SpacingToken,
  ColorToken,
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

// 간소화된 스타일 유틸리티 re-export
export * from '../utils/styles/style-utils';
