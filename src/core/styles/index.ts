/**
 * @fileoverview 통합 스타일 관리자
 * @description 모든 스타일 관련 기능을 하나로 통합한 관리자
 * @version 2.0.0 - 구조 개선
 */

import { coreLogger as logger } from '../logger';

export type GlassmorphismIntensity = 'light' | 'medium' | 'strong' | 'ultra';
export type Theme = 'light' | 'dark' | 'auto';

export interface GlassmorphismConfig {
  intensity: GlassmorphismIntensity;
  background?: string;
  blur?: string;
  border?: string;
  shadow?: string;
}

export interface ComponentState {
  [key: string]: boolean;
}

/**
 * 통합 스타일 관리자
 * 모든 스타일 관련 작업을 중앙에서 관리
 */
export class CoreStyleManager {
  private static instance: CoreStyleManager;

  // 글래스모피즘 프리셋
  private static readonly GLASSMORPHISM_PRESETS: Record<
    GlassmorphismIntensity,
    GlassmorphismConfig
  > = {
    light: {
      intensity: 'light',
      background: 'rgba(255, 255, 255, 0.85)',
      blur: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    },
    medium: {
      intensity: 'medium',
      background: 'rgba(255, 255, 255, 0.65)',
      blur: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    },
    strong: {
      intensity: 'strong',
      background: 'rgba(0, 0, 0, 0.85)',
      blur: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
    ultra: {
      intensity: 'ultra',
      background: 'rgba(0, 0, 0, 0.95)',
      blur: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      shadow: '0 12px 48px rgba(0, 0, 0, 0.25)',
    },
  };

  private constructor() {}

  static getInstance(): CoreStyleManager {
    if (!CoreStyleManager.instance) {
      CoreStyleManager.instance = new CoreStyleManager();
    }
    return CoreStyleManager.instance;
  }

  /**
   * 클래스명 결합
   */
  combineClasses(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  /**
   * CSS 변수 설정
   */
  setCSSVariable(
    property: string,
    value: string,
    element: HTMLElement = document.documentElement
  ): void {
    const cssProperty = property.startsWith('--') ? property : `--${property}`;
    element.style.setProperty(cssProperty, value);
  }

  /**
   * CSS 변수 조회
   */
  getCSSVariable(property: string, element: HTMLElement = document.documentElement): string {
    const cssProperty = property.startsWith('--') ? property : `--${property}`;
    return getComputedStyle(element).getPropertyValue(cssProperty).trim();
  }

  /**
   * 다중 CSS 변수 설정
   */
  setCSSVariables(
    variables: Record<string, string>,
    element: HTMLElement = document.documentElement
  ): void {
    Object.entries(variables).forEach(([property, value]) => {
      this.setCSSVariable(property, value, element);
    });
  }

  /**
   * 테마 설정
   */
  setTheme(theme: Theme, element: HTMLElement = document.documentElement, prefix = 'theme'): void {
    // 기존 테마 클래스 제거
    Array.from(element.classList)
      .filter(cls => cls.startsWith(`${prefix}-`))
      .forEach(cls => element.classList.remove(cls));

    // 새 테마 클래스 추가
    element.classList.add(`${prefix}-${theme}`);
    element.setAttribute('data-theme', theme);
  }

  /**
   * 컴포넌트 상태 클래스 업데이트
   */
  updateComponentState(element: HTMLElement, state: ComponentState, prefix = 'is'): void {
    Object.entries(state).forEach(([key, value]) => {
      const className = `${prefix}-${key}`;
      element.classList.toggle(className, value);
    });
  }

  /**
   * 글래스모피즘 효과 적용
   */
  applyGlassmorphism(
    element: HTMLElement,
    intensity: GlassmorphismIntensity,
    customConfig?: Partial<GlassmorphismConfig>
  ): void {
    const config = { ...CoreStyleManager.GLASSMORPHISM_PRESETS[intensity], ...customConfig };

    logger.debug(`Applying glassmorphism: ${intensity} to element`);

    // 스타일 적용
    element.style.background = config.background!;
    element.style.backdropFilter = config.blur!;
    (element.style as unknown as Record<string, string>)['webkitBackdropFilter'] = config.blur!;
    element.style.border = config.border!;
    element.style.boxShadow = config.shadow!;

    // 성능 최적화
    element.style.willChange = 'backdrop-filter, transform';
    element.style.transform = 'translateZ(0)';
    element.style.contain = 'layout style paint';
    element.style.position = 'relative';
  }

  /**
   * 접근성을 고려한 글래스모피즘 적용
   */
  applyAccessibleGlassmorphism(element: HTMLElement, intensity: GlassmorphismIntensity): void {
    // 고대비 모드나 투명도 감소 모드 확인
    if (this.isHighContrastMode() || this.isReducedTransparencyMode()) {
      element.style.background = 'rgba(255, 255, 255, 0.98)';
      element.style.backdropFilter = 'none';
      (element.style as unknown as Record<string, string>)['webkitBackdropFilter'] = 'none';
      element.style.border = '2px solid rgba(0, 0, 0, 0.8)';
      return;
    }

    // 글래스모피즘 지원 확인
    if (!this.supportsGlassmorphism()) {
      element.style.background = 'rgba(255, 255, 255, 0.95)';
      element.style.border = '1px solid rgba(0, 0, 0, 0.1)';
      element.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
      return;
    }

    this.applyGlassmorphism(element, intensity);
  }

  /**
   * 클래스 토글
   */
  toggleClass(element: HTMLElement, className: string, force?: boolean): void {
    element.classList.toggle(className, force);
  }

  /**
   * 유틸리티 클래스 적용
   */
  applyUtilityClasses(element: HTMLElement, ...utilities: string[]): void {
    utilities.filter(Boolean).forEach(utility => {
      element.classList.add(utility);
    });
  }

  /**
   * 유틸리티 클래스 제거
   */
  removeUtilityClasses(element: HTMLElement, ...utilities: string[]): void {
    utilities.filter(Boolean).forEach(utility => {
      element.classList.remove(utility);
    });
  }

  /**
   * Glassmorphism 지원 여부 확인
   */
  supportsGlassmorphism(): boolean {
    return (
      'backdropFilter' in document.documentElement.style ||
      'webkitBackdropFilter' in document.documentElement.style
    );
  }

  /**
   * 고대비 모드 확인
   */
  private isHighContrastMode(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * 투명도 감소 모드 확인
   */
  private isReducedTransparencyMode(): boolean {
    return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  }
}

// 전역 인스턴스 export
export const coreStyleManager = CoreStyleManager.getInstance();

// 편의 함수들
export const combineClasses = (...classes: (string | undefined | false | null)[]): string =>
  coreStyleManager.combineClasses(...classes);

export const setCSSVariable = (property: string, value: string, element?: HTMLElement): void =>
  coreStyleManager.setCSSVariable(property, value, element);

export const getCSSVariable = (property: string, element?: HTMLElement): string =>
  coreStyleManager.getCSSVariable(property, element);

export const setTheme = (theme: Theme, element?: HTMLElement, prefix?: string): void =>
  coreStyleManager.setTheme(theme, element, prefix);

export const updateComponentState = (
  element: HTMLElement,
  state: ComponentState,
  prefix?: string
): void => coreStyleManager.updateComponentState(element, state, prefix);

export const applyGlassmorphism = (
  element: HTMLElement,
  intensity: GlassmorphismIntensity,
  customConfig?: Partial<GlassmorphismConfig>
): void => coreStyleManager.applyGlassmorphism(element, intensity, customConfig);

export const applyAccessibleGlassmorphism = (
  element: HTMLElement,
  intensity: GlassmorphismIntensity
): void => coreStyleManager.applyAccessibleGlassmorphism(element, intensity);

export const supportsGlassmorphism = (): boolean => coreStyleManager.supportsGlassmorphism();
