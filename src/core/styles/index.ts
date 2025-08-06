/**
 * @fileoverview Core 스타일 - 아키텍처 호환성 보장
 * @description Infrastructure 레이어만 사용하여 아키텍처 규칙 준수
 * @version 4.0.0 - 완전히 분리된 core 구현
 */

// 아키텍처 호환성: Core는 infrastructure만 의존
export type GlassmorphismIntensity = 'none' | 'subtle' | 'medium' | 'high';

/**
 * Core 레이어용 기본 CSS 유틸리티 (infrastructure 레벨)
 */
export function combineClasses(...classes: (string | null | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Core 레이어용 기본 CSS 변수 설정 (infrastructure 레벨)
 */
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  element.style.setProperty(name.startsWith('--') ? name : `--${name}`, value);
}

/**
 * Core 레이어용 기본 CSS 변수 가져오기 (infrastructure 레벨)
 */
export function getCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  const computedStyle = getComputedStyle(element);
  return computedStyle.getPropertyValue(name.startsWith('--') ? name : `--${name}`).trim();
}

/**
 * Core 레이어용 컴포넌트 상태 업데이트 (infrastructure 레벨)
 */
export function updateComponentState(
  element: HTMLElement,
  state: Record<string, boolean | string>
): void {
  Object.entries(state).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      element.classList.toggle(`is-${key}`, value);
    } else {
      setCSSVariable(`component-${key}`, value, element);
    }
  });
}

/**
 * Core 레이어용 글래스모피즘 적용 (setGlassmorphism의 별칭)
 */
export function applyGlassmorphism(
  element: HTMLElement,
  intensity: GlassmorphismIntensity = 'medium'
): void {
  setGlassmorphism(element, intensity);
}
export function setGlassmorphism(
  element: HTMLElement,
  intensity: GlassmorphismIntensity = 'medium'
): void {
  if (intensity === 'none') {
    element.style.background = '';
    element.style.backdropFilter = '';
    element.style.willChange = '';
    return;
  }

  // 인텐시티별 설정
  const configs = {
    subtle: { blur: '4px', opacity: '0.05' },
    medium: { blur: '8px', opacity: '0.1' },
    high: { blur: '16px', opacity: '0.2' },
  };

  const config = configs[intensity];
  element.style.background = `rgba(255, 255, 255, ${config.opacity})`;
  element.style.backdropFilter = `blur(${config.blur})`;
  element.style.willChange = 'backdrop-filter, transform';
}

/**
 * @deprecated CoreStyleManager는 제거 예정입니다.
 * 대신 '@shared/styles/style-manager'를 사용하거나 개별 함수들을 직접 사용하세요.
 *
 * Migration guide:
 * - CoreStyleManager.getInstance().setCSSVariable() → import { setCSSVariable } from '@shared/styles/style-manager'
 * - CoreStyleManager.getInstance().combineClasses() → combineClasses() from this module
 */
export class CoreStyleManager {
  private static instance: CoreStyleManager | null = null;

  public static getInstance(): CoreStyleManager {
    if (!CoreStyleManager.instance) {
      CoreStyleManager.instance = new CoreStyleManager();
    }
    return CoreStyleManager.instance;
  }

  static combineClasses = combineClasses;
  static setCSSVariable = setCSSVariable;
  static getCSSVariable = getCSSVariable;
  static setGlassmorphism = setGlassmorphism;
  static applyGlassmorphism = applyGlassmorphism;
  static updateComponentState = updateComponentState;

  public combineClasses = combineClasses;
  public setCSSVariable = setCSSVariable;
  public getCSSVariable = getCSSVariable;
  public setGlassmorphism = setGlassmorphism;
  public applyGlassmorphism = applyGlassmorphism;
  public updateComponentState = updateComponentState;
}

/**
 * Legacy exports for backward compatibility
 */
export const coreStyleManager = new CoreStyleManager();
