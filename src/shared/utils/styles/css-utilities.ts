/**
 * @fileoverview CSS 유틸리티 함수들
 * @description CSS 클래스 조작 및 CSS 변수 설정 유틸리티
 * @version 2.0.0
 */

/**
 * CSS 클래스들을 결합하여 하나의 문자열로 반환
 */
export function combineClasses(...classes: (string | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * CSS 변수 설정
 */
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  element.style.setProperty(name.startsWith('--') ? name : `--${name}`, value);
}

/**
 * 여러 CSS 변수를 한번에 설정
 */
export function setCSSVariables(
  variables: Record<string, string>,
  element: HTMLElement = document.documentElement
): void {
  Object.entries(variables).forEach(([name, value]) => {
    setCSSVariable(name, value, element);
  });
}

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
      setCSSVariable(`component-${key}`, value, element);
    }
  });
}

/**
 * 테마 기반 클래스명 생성
 */
export function createThemedClassName(baseClass: string, theme?: string): string {
  return theme ? `${baseClass} ${baseClass}--${theme}` : baseClass;
}
