/**
 * @fileoverview 통합 스타일 유틸리티 시스템
 * @description X.com Enhanced Gallery 스타일 관리를 위한 유틸리티 함수들
 * @version 2.0.0
 */

/**
 * 조건부 클래스명 결합 유틸리티
 *
 * @param classes - 클래스명 배열 (undefined, false, null은 필터링됨)
 * @returns 공백으로 구분된 클래스명 문자열
 *
 * @example
 * ```typescript
 * const className = combineClasses(
 *   'base-class',
 *   isActive && 'active',
 *   isDisabled && 'disabled',
 *   customClass
 * );
 * ```
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 조건부 클래스 토글
 *
 * @param element - 대상 HTML 요소
 * @param className - 토글할 클래스명
 * @param condition - 토글 조건
 */
export function toggleClass(
  element: HTMLElement | null,
  className: string,
  condition: boolean
): void {
  if (!element) return;
  element.classList.toggle(className, condition);
}

/**
 * CSS 변수 설정 (개별)
 *
 * @param element - 대상 HTML 요소
 * @param variable - CSS 변수명 (--prefix 자동 추가)
 * @param value - 설정할 값
 */
export function setStyleCSSVariable(
  element: HTMLElement | null,
  variable: string,
  value: string
): void {
  if (!element) return;
  const varName = variable.startsWith('--') ? variable : `--${variable}`;
  element.style.setProperty(varName, value);
}

/**
 * 여러 CSS 변수를 한번에 설정
 *
 * @param element - 대상 HTML 요소
 * @param variables - CSS 변수 객체 { 변수명: 값 }
 */
export function setCSSVariables(element: HTMLElement, variables: Record<string, string>): void {
  Object.entries(variables).forEach(([key, value]) => {
    setStyleCSSVariable(element, key, value);
  });
}

/**
 * 컴포넌트 상태 클래스 관리
 *
 * @param element - 대상 HTML 요소
 * @param baseClass - 기본 클래스명
 * @param states - 상태 객체 { 상태명: 활성화여부 }
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
 * CSS 변수 값 읽기
 *
 * @param element - 대상 HTML 요소 (기본값: document.documentElement)
 * @param variableName - CSS 변수명
 * @returns CSS 변수 값
 */
export function getCSSVariable(variableName: string, element?: HTMLElement): string {
  if (typeof document === 'undefined') return '';
  const targetElement = element || document.documentElement;
  const varName = variableName.startsWith('--') ? variableName : `--xeg-${variableName}`;
  return getComputedStyle(targetElement).getPropertyValue(varName).trim();
}

/**
 * 반응형 클래스명 생성
 *
 * @param base - 기본 클래스명
 * @param modifiers - 수식어 객체 { 수식어: 조건 }
 * @returns 조건에 맞는 클래스명
 */
export function createResponsiveClassName(
  base: string,
  modifiers: Record<string, boolean> = {}
): string {
  const classes = [base];

  Object.entries(modifiers).forEach(([modifier, condition]) => {
    if (condition) {
      classes.push(`${base}--${modifier}`);
    }
  });

  return classes.join(' ');
}

/**
 * 테마 기반 클래스명 생성
 *
 * @param baseClass - 기본 클래스명
 * @param theme - 테마 타입
 * @returns 테마가 적용된 클래스명
 */
export function createThemedClassName(
  baseClass: string,
  theme: 'light' | 'dark' | 'auto' = 'auto'
): string {
  return `${baseClass} ${baseClass}--theme-${theme}`;
}

/**
 * 컴포넌트 데이터 속성 생성
 *
 * @param attributes - 데이터 속성 객체
 * @returns data-* 속성 객체
 */
export function createDataAttributes(
  attributes: Record<string, string | boolean | number>
): Record<string, string> {
  const dataAttrs: Record<string, string> = {};

  Object.entries(attributes).forEach(([key, value]) => {
    const dataKey = key.startsWith('data-') ? key : `data-${key}`;
    dataAttrs[dataKey] = String(value);
  });

  return dataAttrs;
}

/**
 * 스타일 상태 관리 클래스
 */
export class StyleStateManager {
  private readonly element: HTMLElement;
  private readonly baseClass: string;

  constructor(element: HTMLElement, baseClass: string) {
    this.element = element;
    this.baseClass = baseClass;
  }

  /**
   * 상태 업데이트
   */
  updateState(states: Record<string, boolean>): void {
    updateComponentState(this.element, this.baseClass, states);
  }

  /**
   * CSS 변수 설정
   */
  setVariables(variables: Record<string, string>): void {
    setCSSVariables(this.element, variables);
  }

  /**
   * 클래스 추가
   */
  addClass(className: string): void {
    this.element.classList.add(className);
  }

  /**
   * 클래스 제거
   */
  removeClass(className: string): void {
    this.element.classList.remove(className);
  }

  /**
   * 클래스 토글
   */
  toggleClass(className: string, condition?: boolean): void {
    if (condition !== undefined) {
      this.element.classList.toggle(className, condition);
    } else {
      this.element.classList.toggle(className);
    }
  }
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
  getCSSVariable,
  createResponsiveClassName,
  createThemedClassName,
  createDataAttributes,
  StyleStateManager,
} as const;
