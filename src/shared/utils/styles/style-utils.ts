/**
 * @fileoverview 간단한 스타일 유틸리티
 * @description StyleStateManager를 간소화한 유틸리티 함수들
 * @version 1.0.0
 */

/**
 * 조건부 클래스명 결합
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 조건부 클래스 토글
 */
export function toggleClass(element: HTMLElement, className: string, condition: boolean): void {
  element.classList.toggle(className, condition);
}

/**
 * CSS 변수 설정 (개별)
 */
export function setStyleCSSVariable(element: HTMLElement, variable: string, value: string): void {
  const varName = variable.startsWith('--') ? variable : `--${variable}`;
  element.style.setProperty(varName, value);
}

/**
 * 여러 CSS 변수를 한번에 설정
 */
export function setCSSVariables(element: HTMLElement, variables: Record<string, string>): void {
  Object.entries(variables).forEach(([key, value]) => {
    setStyleCSSVariable(element, key, value);
  });
}

/**
 * 컴포넌트 상태 클래스 관리
 */
export function updateComponentState(
  element: HTMLElement,
  baseClass: string,
  states: Record<string, boolean>
): void {
  Object.entries(states).forEach(([state, active]) => {
    const stateClass = `${baseClass}--${state}`;
    toggleClass(element, stateClass, active);
  });
}

/**
 * 스타일 유틸리티 객체
 */
export const styleUtils = {
  combineClasses,
  toggleClass,
  setCSSVariable: setStyleCSSVariable,
  setCSSVariables,
  updateComponentState,
} as const;
