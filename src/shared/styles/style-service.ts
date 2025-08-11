/**
 * @fileoverview 🟢 GREEN: 통합 스타일 관리자 - 단일 진실 소스
 * @description 모든 스타일 관련 기능을 통합한 단일 API (CoreStyleManager 기능 포함)
 * @version 3.0.0 - TDD GREEN: 완전 통합 및 단순화
 */

import { logger } from '@shared/logging';

// 🟢 GREEN: CoreStyleManager와 StyleManager 타입 통합
export type GlassmorphismIntensity = 'light' | 'medium' | 'strong' | 'ultra' | 'subtle';
import { type Theme } from '@shared/services/theme-service';

export interface GlassmorphismConfig {
  intensity: GlassmorphismIntensity;
  background: string;
  blur: string;
  border: string;
  shadow: string;
}

export interface ComponentState {
  [key: string]: boolean | string | number;
}

/**
 * 🟢 GREEN: 통합 스타일 관리자 - 모든 스타일 기능 통합
 * CoreStyleManager의 기능을 포함하여 단일 API 제공
 */
class StyleManager {
  // 🟢 GREEN: CoreStyleManager와 통합된 글래스모피즘 프리셋
  private static readonly GLASSMORPHISM_PRESETS: Record<
    GlassmorphismIntensity,
    GlassmorphismConfig
  > = {
    // 기존 StyleManager 프리셋
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
      background: 'rgba(255, 255, 255, 0.45)',
      blur: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
    ultra: {
      intensity: 'ultra',
      background: 'rgba(255, 255, 255, 0.25)',
      blur: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
    },
    // 🟢 GREEN: CoreStyleManager의 'subtle' 옵션 추가
    subtle: {
      intensity: 'subtle',
      background: 'rgba(255, 255, 255, 0.8)',
      blur: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      shadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
    },
  };

  // 디자인 토큰 매핑
  private static readonly TOKEN_MAPPING: Record<string, string> = {
    '--xeg-primary': '--xeg-color-primary-500',
    '--xeg-secondary': '--xeg-color-neutral-500',
    '--xeg-success': '--xeg-color-success-500',
    '--xeg-error': '--xeg-color-error-500',
    '--xeg-warning': '--xeg-color-warning-500',
    // 🟢 GREEN: CoreStyleManager에서 사용되던 변수 추가
    '--xeg-glass-opacity': '--xeg-glassmorphism-opacity',
  };

  /**
   * 🟢 GREEN: 클래스명 결합 유틸리티 (CoreStyleManager와 동일한 API)
   * null, undefined, false 값을 자동으로 필터링
   */
  static combineClasses(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  /**
   * 🟢 GREEN: CoreStyleManager의 setGlassmorphism 메서드 통합
   */
  static setGlassmorphism(intensity: GlassmorphismIntensity): void {
    if (intensity === 'subtle' || intensity === 'medium' || intensity === 'strong') {
      // CoreStyleManager 방식 호환성
      const values = {
        subtle: '0.8',
        medium: '0.6',
        strong: '0.4',
      };
      this.setTokenValue('--xeg-glass-opacity', values[intensity]);
    } else {
      // 기존 StyleManager 방식
      this.applyGlassmorphism(document.documentElement, intensity);
    }
  }

  /**
   * CSS 변수 설정 (토큰 매핑 지원)
   */
  static setTokenValue(
    property: string,
    value: string,
    element: HTMLElement = document.documentElement
  ): void {
    if (!element?.style) {
      logger.warn('StyleManager: 유효하지 않은 DOM 요소입니다.', element);
      return;
    }

    try {
      const mappedProperty = this.TOKEN_MAPPING[property] || property;
      const cssProperty = mappedProperty.startsWith('--') ? mappedProperty : `--${mappedProperty}`;
      element.style.setProperty(cssProperty, value);
    } catch (error) {
      logger.warn('StyleManager: CSS 변수 설정 실패', { property, value, error });
    }
  }

  /**
   * CSS 변수 조회 (토큰 매핑 지원)
   */
  static getTokenValue(property: string, element: HTMLElement = document.documentElement): string {
    if (!element?.style) {
      logger.warn('StyleManager: 유효하지 않은 DOM 요소입니다.', element);
      return '';
    }

    try {
      const mappedProperty = this.TOKEN_MAPPING[property] || property;
      const cssProperty = mappedProperty.startsWith('--') ? mappedProperty : `--${mappedProperty}`;
      return getComputedStyle(element).getPropertyValue(cssProperty).trim();
    } catch (error) {
      logger.warn('StyleManager: CSS 변수 조회 실패', { property, error });
      return '';
    }
  }

  /**
   * 다중 CSS 변수 설정
   */
  static setMultipleTokens(
    variables: Record<string, string>,
    element: HTMLElement = document.documentElement
  ): void {
    Object.entries(variables).forEach(([property, value]) => {
      this.setTokenValue(property, value, element);
    });
  }

  /**
   * 글래스모피즘 효과 적용
   */
  static applyGlassmorphism(element: HTMLElement, intensity: GlassmorphismIntensity): void {
    if (!element?.style) {
      logger.warn('StyleManager: 유효하지 않은 DOM 요소입니다.', element);
      return;
    }

    // 접근성 고려사항 확인
    if (this.isHighContrastMode() || this.isReducedTransparencyMode()) {
      this.applyAccessibleGlassmorphism(element);
      return;
    }

    // 글래스모피즘 지원 여부 확인
    if (!this.supportsGlassmorphism()) {
      this.applyFallbackGlassmorphism(element);
      return;
    }

    // 글래스모피즘 적용
    const config = this.GLASSMORPHISM_PRESETS[intensity];
    Object.assign(element.style, {
      background: config.background,
      backdropFilter: config.blur,
      webkitBackdropFilter: config.blur, // Safari 지원
      border: config.border,
      borderRadius: '8px',
      boxShadow: config.shadow,
      // 성능 최적화
      willChange: 'backdrop-filter, transform',
      transform: 'translateZ(0)',
      contain: 'layout style paint',
    });
  }

  /**
   * 접근성을 고려한 글래스모피즘 (고대비/투명도 감소 모드)
   */
  private static applyAccessibleGlassmorphism(element: HTMLElement): void {
    Object.assign(element.style, {
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'none',
      webkitBackdropFilter: 'none',
      border: '2px solid rgba(0, 0, 0, 0.8)',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    });
  }

  /**
   * 폴백 글래스모피즘 (backdrop-filter 미지원 브라우저)
   */
  private static applyFallbackGlassmorphism(element: HTMLElement): void {
    Object.assign(element.style, {
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    });
  }

  /**
   * 컴포넌트 상태 업데이트
   */
  static updateComponentState(
    element: HTMLElement,
    state: ComponentState,
    prefix: string = 'is'
  ): void {
    if (!element?.classList) {
      logger.warn('StyleManager: 유효하지 않은 DOM 요소입니다.', element);
      return;
    }

    try {
      Object.entries(state).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          const className = `${prefix}-${key}`;
          element.classList.toggle(className, value);
        } else if (typeof value === 'string') {
          this.setTokenValue(`component-${key}`, value, element);
        }
      });
    } catch (error) {
      logger.error('StyleManager: 컴포넌트 상태 업데이트 실패', { state, error });
    }
  }

  /**
   * 테마 설정
   */
  static setTheme(
    element: HTMLElement = document.documentElement,
    theme?: Theme,
    prefix: string = 'theme'
  ): void {
    if (!element?.classList || !theme) {
      logger.warn('StyleManager: 유효하지 않은 요소 또는 테마입니다.', { element, theme });
      return;
    }

    try {
      // 기존 테마 클래스 제거
      Array.from(element.classList)
        .filter(cls => cls.startsWith(`${prefix}-`))
        .forEach(cls => element.classList.remove(cls));

      // 새 테마 클래스 추가
      element.classList.add(`${prefix}-${theme}`);
      element.setAttribute('data-theme', theme);
    } catch (error) {
      logger.error('StyleManager: 테마 설정 실패', { theme, error });
    }
  }

  /**
   * 유틸리티 클래스 적용
   */
  static applyUtilityClass(element: HTMLElement, ...utilities: string[]): void {
    if (!element?.classList) {
      logger.warn('StyleManager: 유효하지 않은 DOM 요소입니다.', element);
      return;
    }

    try {
      utilities.filter(Boolean).forEach(utility => {
        element.classList.add(utility);
      });
    } catch (error) {
      logger.error('StyleManager: 유틸리티 클래스 적용 실패', { utilities, error });
    }
  }

  /**
   * 글래스모피즘 지원 여부 감지
   */
  static supportsGlassmorphism(): boolean {
    return (
      'backdropFilter' in document.documentElement.style ||
      'webkitBackdropFilter' in document.documentElement.style
    );
  }

  /**
   * 고대비 모드 감지
   */
  static isHighContrastMode(): boolean {
    try {
      return window?.matchMedia?.('(prefers-contrast: high)')?.matches || false;
    } catch {
      return false;
    }
  }

  /**
   * 투명도 감소 모드 감지
   */
  static isReducedTransparencyMode(): boolean {
    try {
      return window?.matchMedia?.('(prefers-reduced-transparency: reduce)')?.matches || false;
    } catch {
      return false;
    }
  }

  // 하위 호환성을 위한 별칭
  static setCSSVariable = StyleManager.setTokenValue;
  static getCSSVariable = StyleManager.getTokenValue;
  static setCSSVariables = StyleManager.setMultipleTokens;
}

// Named exports for backward compatibility
export const setCSSVariable = StyleManager.setTokenValue.bind(StyleManager);
export const getCSSVariable = StyleManager.getTokenValue.bind(StyleManager);
export const setCSSVariables = StyleManager.setMultipleTokens.bind(StyleManager);
export const updateComponentState = StyleManager.updateComponentState.bind(StyleManager);
export const createThemedClassName = StyleManager.combineClasses.bind(StyleManager);
export const applyTheme = StyleManager.setTheme.bind(StyleManager);

export default StyleManager;
