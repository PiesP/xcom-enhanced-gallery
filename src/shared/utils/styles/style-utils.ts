/**
 * @fileoverview Style Utilities
 * @description CSS 조작을 위한 유틸리티 함수 (css-utilities 기반)
 */

// Re-export from css-utilities (canonical source)
export {
  combineClasses,
  toggleClass,
  setCSSVariable,
  setCSSVariables,
  createThemedClassName,
  updateComponentState,
} from './css-utilities';

/** CSS 변수 조회 */
export function getCSSVariable(element: HTMLElement | null, name: string): string {
  if (!element) return '';
  const varName = name.startsWith('--') ? name : `--${name}`;
  return getComputedStyle(element).getPropertyValue(varName).trim();
}

/** 테마 클래스 적용 */
export function applyTheme(element: Element | null, theme: string, themePrefix = 'theme'): void {
  if (!element) return;

  // 기존 테마 클래스 제거 후 새 테마 적용
  Array.from(element.classList)
    .filter(cls => cls.startsWith(`${themePrefix}-`))
    .forEach(cls => element.classList.remove(cls));

  element.classList.add(`${themePrefix}-${theme}`);
}
