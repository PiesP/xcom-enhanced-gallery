/**
 * @fileoverview 🟢 GREEN: 스타일 유틸리티 통합 모듈
 * @description TDD로 중복된 스타일 함수들을 단일 진입점으로 통합
 * @version 1.0.0 - Style utility consolidation (Phase 1.2)
 */

import { logger } from '@shared/logging';

// 🟢 GREEN: 통합된 CSS 변수 관리 - 단일 구현으로 모든 중복 해결
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  try {
    const cssVarName = name.startsWith('--') ? name : `--${name}`;
    element.style.setProperty(cssVarName, value);

    logger.debug(`CSS variable set: ${cssVarName} = ${value}`);
  } catch (error) {
    logger.error('setCSSVariable failed:', error);
  }
}

export function getCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  try {
    const cssVarName = name.startsWith('--') ? name : `--${name}`;
    const computedStyle = getComputedStyle(element);
    const value = computedStyle.getPropertyValue(cssVarName).trim();

    return value;
  } catch (error) {
    logger.error('getCSSVariable failed:', error);
    return '';
  }
}

export function setCSSVariables(
  variables: Record<string, string>,
  element: HTMLElement = document.documentElement
): void {
  try {
    Object.entries(variables).forEach(([key, value]) => {
      setCSSVariable(key, value, element);
    });

    logger.debug(`CSS variables set: ${Object.keys(variables).length} variables`);
  } catch (error) {
    logger.error('setCSSVariables failed:', error);
  }
}

// 🟢 GREEN: 기본 스타일 유틸리티들 (중복 제거 완료)
export { applyTheme } from '@shared/utils/styles/style-utils';
export { toggleClass } from '@shared/dom'; // DOM 서비스에서 통합된 toggleClass 사용

// 🟢 GREEN: StyleManager 고급 기능들 (static 메서드는 클래스에서 직접 호출)
export { createThemedClassName, updateComponentState } from '@shared/styles/style-service';

// 🟢 GREEN: 테마 관련 유틸리티들
export { getXEGVariable, setGalleryTheme } from '../styles/theme-utils';

// 🟢 GREEN: DOM 안전 유틸리티들
export { safeAddClass, safeRemoveClass, safeSetStyle } from '@shared/dom';
