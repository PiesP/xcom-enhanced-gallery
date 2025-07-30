/**
 * @fileoverview CSS Utilities
 * @description CSS 클래스 및 변수 조작을 위한 간단한 유틸리티 함수들
 */

/**
 * 클래스명 결합 유틸리티
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 클래스 토글 유틸리티
 */
export function toggleClass(element: HTMLElement, className: string, condition?: boolean): void {
  const shouldHave = condition ?? !element.classList.contains(className);
  element.classList.toggle(className, shouldHave);
}

/**
 * CSS 변수 설정
 */
export function setCSSVariable(element: HTMLElement, variable: string, value: string): void {
  element.style.setProperty(`--${variable}`, value);
}

/**
 * 여러 CSS 변수를 한 번에 설정
 */
export function setCSSVariables(element: HTMLElement, variables: Record<string, string>): void {
  Object.entries(variables).forEach(([key, value]) => {
    setCSSVariable(element, key, value);
  });
}

/**
 * 컴포넌트 상태에 따른 클래스 업데이트
 */
export function updateComponentState(
  element: HTMLElement,
  state: 'loading' | 'error' | 'success' | 'idle',
  baseClass: string = 'component'
): void {
  const states = ['loading', 'error', 'success', 'idle'];
  states.forEach(s => element.classList.remove(`${baseClass}--${s}`));
  element.classList.add(`${baseClass}--${state}`);
}

/**
 * 테마 기반 클래스명 생성
 */
export function createThemedClassName(baseClass: string, theme: string = 'auto'): string {
  return theme === 'auto' ? baseClass : `${baseClass}--${theme}`;
}
