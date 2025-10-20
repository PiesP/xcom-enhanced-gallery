/**
 * @fileoverview CSS Utilities
 * @description CSS 클래스 및 변수 조작을 위한 간단한 유틸리티 함수들
 */

/**
 * 클래스명 결합 유틸리티
 * @param classes - 결합할 클래스명 배열 (falsy 값은 자동 필터링)
 * @returns 공백으로 구분된 클래스명 문자열
 * @example
 * ```typescript
 * combineClasses('btn', 'btn-primary', undefined, false) // 'btn btn-primary'
 * ```
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 클래스 토글 유틸리티
 * @param element - 대상 HTML 요소
 * @param className - 토글할 클래스명
 * @param condition - 토글 조건 (명시하지 않으면 현재 상태 반대)
 * @returns void
 * @example
 * ```typescript
 * toggleClass(element, 'active'); // 토글
 * toggleClass(element, 'active', true); // 추가
 * ```
 */
export function toggleClass(element: HTMLElement, className: string, condition?: boolean): void {
  const shouldHave = condition ?? !element.classList.contains(className);
  element.classList.toggle(className, shouldHave);
}

/**
 * CSS 변수 설정
 * @param element - 대상 HTML 요소 (null 시 무시)
 * @param variable - CSS 변수명 ('--' 접두사 자동 추가)
 * @param value - CSS 변수값
 * @returns void
 * @example
 * ```typescript
 * setCSSVariable(element, 'color-primary', 'oklch(...)')
 * // element.style.setProperty('--color-primary', 'oklch(...)')
 * ```
 */
export function setCSSVariable(element: HTMLElement | null, variable: string, value: string): void {
  if (!element) return;
  const varName = variable.startsWith('--') ? variable : `--${variable}`;
  element.style.setProperty(varName, value);
}

/**
 * 여러 CSS 변수를 한 번에 설정
 * @param element - 대상 HTML 요소 (null 시 무시)
 * @param variables - CSS 변수명-값 객체
 * @returns void
 * @example
 * ```typescript
 * setCSSVariables(element, {
 *   'color-primary': 'oklch(...)',
 *   'space-md': '1rem'
 * })
 * ```
 */
export function setCSSVariables(
  element: HTMLElement | null,
  variables: Record<string, string>
): void {
  if (!element) return;
  Object.entries(variables).forEach(([key, value]) => {
    setCSSVariable(element, key, value);
  });
}

/**
 * 컴포넌트 상태에 따른 클래스 업데이트
 * @param element - 대상 HTML 요소
 * @param state - 적용할 상태 ('loading' | 'error' | 'success' | 'idle')
 * @param baseClass - 기본 클래스명 (기본값: 'component')
 * @returns void
 * @example
 * ```typescript
 * updateComponentState(element, 'loading', 'modal')
 * // 'modal--loading' 클래스 추가, 기존 상태 클래스 제거
 * ```
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
 * @param baseClass - 기본 클래스명
 * @param theme - 테마명 (기본값: 'auto')
 * @returns 테마가 적용된 클래스명
 * @example
 * ```typescript
 * createThemedClassName('button', 'dark') // 'button--dark'
 * createThemedClassName('button', 'auto') // 'button'
 * ```
 */
export function createThemedClassName(baseClass: string, theme: string = 'auto'): string {
  return theme === 'auto' ? baseClass : `${baseClass}--${theme}`;
}
