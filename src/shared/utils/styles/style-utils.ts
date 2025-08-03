/**
 * @fileoverview 스타일 유틸리티 함수들
 * @description DOM 스타일 조작 및 테마 관련 유틸리티
 * @version 2.0.0
 */

/**
 * CSS 클래스 토글
 */
export function toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
  return element.classList.toggle(className, force);
}

/**
 * CSS 변수 값 가져오기
 */
export function getCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  return getComputedStyle(element)
    .getPropertyValue(name.startsWith('--') ? name : `--${name}`)
    .trim();
}

/**
 * 테마 적용
 */
export function applyTheme(
  theme: Record<string, string>,
  element: HTMLElement = document.documentElement
): void {
  Object.entries(theme).forEach(([key, value]) => {
    element.style.setProperty(key.startsWith('--') ? key : `--${key}`, value);
  });
}
