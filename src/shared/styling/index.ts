/**
 * @fileoverview 통합 스타일링 시스템 인덱스
 * @description CSS와 JavaScript 책임 분리를 위한 통합 스타일링 모듈
 * @version 1.0.0
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

export { StyleStateManager, styleStateManager } from './StyleStateManager';
export {
  PerformantStyler,
  CSSClassManager,
  performantStyler,
  cssClassManager,
} from './PerformantStyler';

// 기본 인스턴스들을 재export
import { DesignSystem } from '../design-system/DesignSystem';
import { styleStateManager } from './StyleStateManager';
import { performantStyler, cssClassManager } from './PerformantStyler';

export const designSystem = DesignSystem;
export const styling = {
  stateManager: styleStateManager,
  performantStyler,
  classManager: cssClassManager,
  designSystem: DesignSystem,
};
