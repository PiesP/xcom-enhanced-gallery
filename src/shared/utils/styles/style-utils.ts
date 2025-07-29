/**
 * @fileoverview 스타일 유틸리티 함수들
 * @description CSS 클래스 및 스타일 관련 유틸리티 함수들
 * @version 1.0.0
 */

/**
 * 클래스명 결합 유틸리티
 *
 * @param classes - 결합할 클래스명들
 * @returns 결합된 클래스명 문자열
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 클래스 토글 유틸리티
 *
 * @param element - 대상 요소
 * @param className - 토글할 클래스명
 * @param force - 강제 설정 (true: 추가, false: 제거)
 */
export function toggleClass(element: Element | null, className: string, force?: boolean): void {
  if (!element) return;

  if (force !== undefined) {
    element.classList.toggle(className, force);
  } else {
    element.classList.toggle(className);
  }
}

/**
 * CSS 변수 설정 유틸리티
 *
 * @param element - 대상 요소
 * @param name - CSS 변수명 (--prefix 없이)
 * @param value - 설정할 값
 */
export function setCSSVariable(element: HTMLElement | null, name: string, value: string): void {
  if (!element) return;

  const varName = name.startsWith('--') ? name : `--${name}`;
  element.style.setProperty(varName, value);
}

/**
 * CSS 변수 조회 유틸리티
 *
 * @param element - 대상 요소
 * @param name - CSS 변수명 (--prefix 없이)
 * @returns CSS 변수 값
 */
export function getCSSVariable(element: HTMLElement | null, name: string): string {
  if (!element) return '';

  const varName = name.startsWith('--') ? name : `--${name}`;
  return getComputedStyle(element).getPropertyValue(varName).trim();
}

/**
 * 컴포넌트 상태 클래스 업데이트
 *
 * @param element - 대상 요소
 * @param state - 상태 객체
 * @param prefix - 클래스 접두사
 */
export function updateComponentState(
  element: Element | null,
  state: Record<string, boolean>,
  prefix = 'is'
): void {
  if (!element) return;

  Object.entries(state).forEach(([key, value]) => {
    const className = `${prefix}-${key}`;
    toggleClass(element, className, value);
  });
}

/**
 * 테마 클래스 적용
 *
 * @param element - 대상 요소
 * @param theme - 테마명
 * @param themePrefix - 테마 클래스 접두사
 */
export function applyTheme(element: Element | null, theme: string, themePrefix = 'theme'): void {
  if (!element) return;

  // 기존 테마 클래스 제거
  const existingThemeClasses = Array.from(element.classList).filter(cls =>
    cls.startsWith(`${themePrefix}-`)
  );

  existingThemeClasses.forEach(cls => element.classList.remove(cls));

  // 새 테마 클래스 추가
  element.classList.add(`${themePrefix}-${theme}`);
}
