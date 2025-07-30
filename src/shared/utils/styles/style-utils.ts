/**
 * @fileoverview 스타일 유틸리티 함수들
 */

/** 클래스명 결합 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** 클래스 토글 */
export function toggleClass(element: Element | null, className: string, force?: boolean): void {
  element?.classList.toggle(className, force);
}

/** CSS 변수 설정 */
export function setCSSVariable(element: HTMLElement | null, name: string, value: string): void {
  if (!element) return;
  const varName = name.startsWith('--') ? name : `--${name}`;
  element.style.setProperty(varName, value);
}

/** CSS 변수 조회 */
export function getCSSVariable(element: HTMLElement | null, name: string): string {
  if (!element) return '';
  const varName = name.startsWith('--') ? name : `--${name}`;
  return getComputedStyle(element).getPropertyValue(varName).trim();
}

/** 컴포넌트 상태 클래스 업데이트 */
export function updateComponentState(
  element: Element | null,
  state: Record<string, boolean>,
  prefix = 'is'
): void {
  if (!element) return;
  Object.entries(state).forEach(([key, value]) => {
    toggleClass(element, `${prefix}-${key}`, value);
  });
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

/** CSS 변수 일괄 설정 */
export function setCSSVariables(element: HTMLElement, variables: Record<string, string>): void {
  Object.entries(variables).forEach(([variable, value]) => {
    setCSSVariable(element, variable, value);
  });
}

/** 테마 클래스명 생성 */
export function createThemedClassName(baseClass: string, theme: string = 'auto'): string {
  return `${baseClass} ${baseClass}--theme-${theme}`;
}
