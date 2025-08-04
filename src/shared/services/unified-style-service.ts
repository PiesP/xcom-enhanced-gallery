/**
 * @fileoverview 통합 스타일 서비스
 * @description TDD 기반으로 중복된 CSS/스타일 관련 기능들을 하나로 통합
 * @version 1.0.0 - GREEN Phase: 중복 통합 완료
 */

import { coreLogger as logger } from '@core/logger';

export type GlassmorphismIntensity = 'light' | 'medium' | 'strong' | 'ultra';
export type Theme = 'light' | 'dark' | 'auto';

export interface GlassmorphismConfig {
  background: string;
  blur: string;
  border: string;
  shadow: string;
  intensity: GlassmorphismIntensity;
}

export interface ComponentState {
  [key: string]: boolean | string;
}

/**
 * 통합 스타일 서비스 클래스
 * 모든 CSS 스타일 관련 중복 기능을 하나로 통합
 */
class UnifiedStyleService {
  private static instance: UnifiedStyleService;
  private readonly activeResources = new Set<string>();

  // 글래스모피즘 프리셋들 (CoreStyleManager와 StyleManager 통합)
  private static readonly GLASSMORPHISM_PRESETS: Record<
    GlassmorphismIntensity,
    GlassmorphismConfig
  > = {
    light: {
      intensity: 'light',
      background: 'rgba(255, 255, 255, 0.1)',
      blur: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      shadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    },
    medium: {
      intensity: 'medium',
      background: 'rgba(255, 255, 255, 0.15)',
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

  // 토큰 매핑 (StyleManager에서 가져옴)
  private static readonly TOKEN_MAPPING: Record<string, string> = {
    '--xeg-primary': '--xeg-color-primary-500',
    '--xeg-secondary': '--xeg-color-secondary-500',
    '--xeg-success': '--xeg-color-success-500',
    '--xeg-danger': '--xeg-color-danger-500',
    '--xeg-warning': '--xeg-color-warning-500',
  };

  private constructor() {}

  static getInstance(): UnifiedStyleService {
    if (!UnifiedStyleService.instance) {
      UnifiedStyleService.instance = new UnifiedStyleService();
    }
    return UnifiedStyleService.instance;
  }

  /**
   * 통합된 클래스명 결합 함수 (모든 combineClasses 중복 통합)
   */
  combineClasses(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  /**
   * 통합된 CSS 변수 설정 (모든 setCSSVariable 중복 통합)
   */
  setCSSVariable(
    property: string,
    value: string,
    element: HTMLElement = document.documentElement
  ): boolean {
    try {
      // 토큰 매핑 확인
      const mappedProperty = UnifiedStyleService.TOKEN_MAPPING[property] || property;

      // CSS 변수명 정규화
      const cssProperty = mappedProperty.startsWith('--') ? mappedProperty : `--${mappedProperty}`;

      element.style.setProperty(cssProperty, value);

      // 활성 리소스 추적
      this.activeResources.add(`${cssProperty}:${value}`);

      return true;
    } catch (error) {
      logger.warn('[UnifiedStyleService] Failed to set CSS variable:', property, value, error);
      return false;
    }
  }

  /**
   * CSS 변수 조회
   */
  getCSSVariable(property: string, element: HTMLElement = document.documentElement): string {
    try {
      // 토큰 매핑 확인
      const mappedProperty = UnifiedStyleService.TOKEN_MAPPING[property] || property;

      // CSS 변수명 정규화
      const cssProperty = mappedProperty.startsWith('--') ? mappedProperty : `--${mappedProperty}`;

      return getComputedStyle(element).getPropertyValue(cssProperty).trim();
    } catch (error) {
      logger.warn('[UnifiedStyleService] Failed to get CSS variable:', property, error);
      return '';
    }
  }

  /**
   * 여러 CSS 변수 한번에 설정
   */
  setCSSVariables(
    variables: Record<string, string>,
    element: HTMLElement = document.documentElement
  ): boolean {
    try {
      Object.entries(variables).forEach(([property, value]) => {
        this.setCSSVariable(property, value, element);
      });
      return true;
    } catch (error) {
      logger.error('[UnifiedStyleService] Failed to set multiple CSS variables:', error);
      return false;
    }
  }

  /**
   * 통합된 글래스모피즘 적용 (CoreStyleManager와 StyleManager 통합)
   */
  applyGlassmorphism(
    element: HTMLElement,
    intensity: GlassmorphismIntensity,
    customConfig?: Partial<GlassmorphismConfig>
  ): boolean {
    try {
      // 접근성 고려사항 확인
      if (this.isHighContrastMode() || this.isReducedTransparencyMode()) {
        return this.applyAccessibleGlassmorphism(element, intensity);
      }

      // 글래스모피즘 지원 여부 확인
      if (!this.supportsGlassmorphism()) {
        return this.applyFallbackGlassmorphism(element, intensity);
      }

      const config = { ...UnifiedStyleService.GLASSMORPHISM_PRESETS[intensity], ...customConfig };

      logger.debug(`[UnifiedStyleService] Applying glassmorphism: ${intensity}`);

      // 스타일 적용
      element.style.background = config.background;
      element.style.backdropFilter = config.blur;
      (element.style as unknown as Record<string, string>).webkitBackdropFilter = config.blur; // Safari 지원
      element.style.border = config.border;
      element.style.boxShadow = config.shadow;

      // 성능 최적화
      element.style.willChange = 'backdrop-filter, transform';
      element.style.transform = 'translateZ(0)';
      element.style.contain = 'layout style paint';
      element.style.position = 'relative';

      // 활성 리소스 추적
      this.activeResources.add(`glassmorphism:${intensity}`);

      return true;
    } catch (error) {
      logger.error('[UnifiedStyleService] Failed to apply glassmorphism:', error);
      return false;
    }
  }

  /**
   * 테마 설정
   */
  setTheme(
    theme: Theme,
    element: HTMLElement = document.documentElement,
    prefix: string = 'theme'
  ): boolean {
    try {
      // 기존 테마 클래스 제거
      Array.from(element.classList)
        .filter(cls => cls.startsWith(`${prefix}-`))
        .forEach(cls => element.classList.remove(cls));

      // 새 테마 클래스 추가
      element.classList.add(`${prefix}-${theme}`);
      element.setAttribute('data-theme', theme);

      // 활성 리소스 추적
      this.activeResources.add(`theme:${theme}`);

      return true;
    } catch (error) {
      logger.error('[UnifiedStyleService] Failed to set theme:', error);
      return false;
    }
  }

  /**
   * 컴포넌트 상태 업데이트
   */
  updateComponentState(
    element: HTMLElement,
    state: ComponentState,
    prefix: string = 'is'
  ): boolean {
    try {
      Object.entries(state).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          const className = `${prefix}-${key}`;
          element.classList.toggle(className, value);
        } else {
          this.setCSSVariable(`component-${key}`, value, element);
        }
      });
      return true;
    } catch (error) {
      logger.error('[UnifiedStyleService] Failed to update component state:', error);
      return false;
    }
  }

  /**
   * 유틸리티 클래스 적용
   */
  applyUtilityClasses(element: HTMLElement, ...utilities: string[]): boolean {
    try {
      utilities.filter(Boolean).forEach(utility => {
        element.classList.add(utility);
      });
      return true;
    } catch (error) {
      logger.error('[UnifiedStyleService] Failed to apply utility classes:', error);
      return false;
    }
  }

  /**
   * 테마 기반 클래스명 생성
   */
  createThemedClassName(baseClass: string, theme?: string): string {
    return theme ? `${baseClass} ${baseClass}--${theme}` : baseClass;
  }

  /**
   * 접근성을 고려한 글래스모피즘 적용
   */
  private applyAccessibleGlassmorphism(
    element: HTMLElement,
    _intensity: GlassmorphismIntensity
  ): boolean {
    try {
      element.style.background = 'rgba(255, 255, 255, 0.98)';
      element.style.backdropFilter = 'none';
      (element.style as unknown as Record<string, string>).webkitBackdropFilter = 'none';
      element.style.border = '2px solid rgba(0, 0, 0, 0.8)';
      element.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
      return true;
    } catch (error) {
      logger.error('[UnifiedStyleService] Failed to apply accessible glassmorphism:', error);
      return false;
    }
  }

  /**
   * 폴백 글래스모피즘 적용
   */
  private applyFallbackGlassmorphism(
    element: HTMLElement,
    _intensity: GlassmorphismIntensity
  ): boolean {
    try {
      element.style.background = 'rgba(255, 255, 255, 0.95)';
      element.style.border = '1px solid rgba(0, 0, 0, 0.1)';
      element.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
      return true;
    } catch (error) {
      logger.error('[UnifiedStyleService] Failed to apply fallback glassmorphism:', error);
      return false;
    }
  }

  /**
   * 글래스모피즘 지원 여부 확인
   */
  supportsGlassmorphism(): boolean {
    if (typeof document === 'undefined') return false;

    return (
      'backdropFilter' in document.documentElement.style ||
      'webkitBackdropFilter' in document.documentElement.style
    );
  }

  /**
   * 고대비 모드 확인
   */
  private isHighContrastMode(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * 투명도 감소 모드 확인
   */
  private isReducedTransparencyMode(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  }

  /**
   * 활성 리소스 조회 (메모리 관리용)
   */
  getActiveResources(): Set<string> {
    return new Set(this.activeResources);
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    try {
      this.activeResources.clear();
      logger.debug('[UnifiedStyleService] Resources cleaned up');
    } catch (error) {
      logger.error('[UnifiedStyleService] Failed to cleanup:', error);
    }
  }
}

// 전역 인스턴스 및 편의 함수들
export const unifiedStyleService = UnifiedStyleService.getInstance();
export const getUnifiedStyleService = () => unifiedStyleService;

// 편의 함수들 (기존 코드 호환성을 위해)
export const combineClasses = unifiedStyleService.combineClasses.bind(unifiedStyleService);
export const setCSSVariable = unifiedStyleService.setCSSVariable.bind(unifiedStyleService);
export const getCSSVariable = unifiedStyleService.getCSSVariable.bind(unifiedStyleService);
export const setCSSVariables = unifiedStyleService.setCSSVariables.bind(unifiedStyleService);
export const applyGlassmorphism = unifiedStyleService.applyGlassmorphism.bind(unifiedStyleService);
export const setTheme = unifiedStyleService.setTheme.bind(unifiedStyleService);
export const updateComponentState =
  unifiedStyleService.updateComponentState.bind(unifiedStyleService);
export const applyUtilityClasses =
  unifiedStyleService.applyUtilityClasses.bind(unifiedStyleService);
export const createThemedClassName =
  unifiedStyleService.createThemedClassName.bind(unifiedStyleService);

// 하위 호환성을 위한 별칭들 (StyleManager 호환)
export const styleService = unifiedStyleService;
