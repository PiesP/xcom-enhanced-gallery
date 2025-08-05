/**
 * @fileoverview 스타일 서비스 (레거시 호환)
 * @description StyleManager를 참조하는 래퍼
 */

import StyleManager from '@shared/styles/style-manager';

export { default as StyleService, default as styleService } from '@shared/styles/style-manager';

// StyleManager에서 유틸리티 함수들 re-export
export const setCSSVariable = StyleManager.setCSSVariable;
export const getCSSVariable = StyleManager.getCSSVariable;
export const setCSSVariables = StyleManager.setCSSVariables;

// 타입 정의 (StyleManager에서 가져옴)
export type { GlassmorphismIntensity, ComponentState } from '@shared/styles/style-manager';
