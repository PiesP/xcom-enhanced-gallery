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
 * Core 레이어용 기본 글래스모피즘 설정 (infrastructure 레벨)
 */
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
 * @deprecated CoreStyleManager는 제거됨. 개별 함수들을 직접 사용하세요
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
  static setGlassmorphism = setGlassmorphism;

  public combineClasses = combineClasses;
  public setCSSVariable = setCSSVariable;
  public setGlassmorphism = setGlassmorphism;
}

/**
 * Legacy exports for backward compatibility
 */
export const coreStyleManager = new CoreStyleManager();
