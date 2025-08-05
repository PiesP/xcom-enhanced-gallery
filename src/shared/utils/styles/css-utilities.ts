/**
 * @fileoverview CSS 유틸리티 함수들 (통합된 구현)
 * @description StyleManager 기반 CSS 유틸리티 - 중복 제거됨
 * @version 3.0.0
 */

import StyleManager from '../../styles/style-manager';

/**
 * CSS 변수 설정
 * @deprecated StyleManager.setCSSVariable() 사용 권장
 */
export const setCSSVariable = StyleManager.setCSSVariable;

/**
 * CSS 변수 가져오기
 * @deprecated StyleManager.getTokenValue() 사용 권장
 */
export function getCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  const computedStyle = getComputedStyle(element);
  return computedStyle.getPropertyValue(name.startsWith('--') ? name : `--${name}`).trim();
}

/**
 * 여러 CSS 변수를 한번에 설정
 * @deprecated StyleManager.setCSSVariables() 사용 권장
 */
export const setCSSVariables = StyleManager.setCSSVariables;

/**
 * 컴포넌트 상태에 따른 스타일 업데이트
 */
export function updateComponentState(
  element: HTMLElement,
  state: Record<string, boolean | string>
): void {
  Object.entries(state).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      element.classList.toggle(`state-${key}`, value);
    } else {
      StyleManager.setCSSVariable(`component-${key}`, value, element);
    }
  });
}

/**
 * 테마 기반 클래스명 생성
 */
export function createThemedClassName(baseClass: string, theme?: string): string {
  return theme ? `${baseClass} ${baseClass}--${theme}` : baseClass;
}
