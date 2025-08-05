/**
 * @fileoverview 통합 스타일 서비스
 * @description 모든 스타일 관련 기능을 통합한 서비스
 */

// 타입 정의들
export type GlassmorphismIntensity = 'subtle' | 'medium' | 'strong';
export type ComponentState = 'default' | 'hover' | 'active' | 'disabled';
export type Theme = Record<string, string>;
export interface GlassmorphismConfig {
  intensity: GlassmorphismIntensity;
  background?: string;
  blur?: string;
}

// 기본 CSS 변수 관리 함수들
export function setCSSVariable(name: string, value: string, element?: Element): void {
  const target = element || document.documentElement;
  if (target instanceof HTMLElement) {
    target.style.setProperty(name.startsWith('--') ? name : `--${name}`, value);
  }
}

export function getCSSVariable(name: string, element?: Element): string {
  const target = element || document.documentElement;
  const computedStyle = getComputedStyle(target);
  return computedStyle.getPropertyValue(name.startsWith('--') ? name : `--${name}`).trim();
}

export function setCSSVariables(variables: Record<string, string>, element?: Element): void {
  Object.entries(variables).forEach(([name, value]) => {
    setCSSVariable(name, value, element);
  });
}

export function setTheme(theme: Record<string, string>): void {
  setCSSVariables(theme);
}

export function updateComponentState(state: Record<string, string>): void {
  setCSSVariables(state);
}

export function applyUtilityClasses(element: Element, classes: string[]): void {
  element.classList.add(...classes);
}

export function createThemedClassName(base: string, theme?: string): string {
  return theme ? `${base}--${theme}` : base;
}

// 통합 스타일 서비스 인스턴스
export const unifiedStyleService = {
  setCSSVariable,
  getCSSVariable,
  setCSSVariables,
  setTheme,
  updateComponentState,
  applyUtilityClasses,
  createThemedClassName,
};

// 팩토리 함수 (하위 호환성)
export function getUnifiedStyleService() {
  return unifiedStyleService;
}

// 하위 호환성을 위한 별칭
export const styleService = unifiedStyleService;
