/**
 * @fileoverview 통합 스타일 관리자
 * @description 모든 스타일 관련 중복을 통합하는 단일 인터페이스
 * @version 1.0.0
 */

/**
 * 글래스모피즘 강도 타입
 */
export type GlassmorphismIntensity = 'light' | 'medium' | 'strong' | 'ultra';

/**
 * 테마 타입
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * CSS 변수 접두사 타입
 */
export type CSSVariablePrefix = '--xeg-' | '--xeg-isolated-' | '';

/**
 * 컴포넌트 상태 타입
 */
export interface ComponentState {
  [key: string]: boolean;
}

/**
 * 글래스모피즘 설정 인터페이스
 */
export interface GlassmorphismConfig {
  intensity: GlassmorphismIntensity;
  background?: string;
  blur?: string;
  border?: string;
  shadow?: string;
}

/**
 * 통합 스타일 관리자 클래스
 * 모든 스타일 관련 유틸리티를 하나의 클래스로 통합
 */
class UnifiedStyleManager {
  // 글래스모피즘 프리셋 정의
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

  // 디자인 토큰 매핑
  private static readonly TOKEN_MAPPING: Record<string, string> = {
    '--xeg-primary': '--xeg-color-primary-500',
    '--xeg-secondary': '--xeg-color-neutral-500',
    '--xeg-success': '--xeg-color-success-500',
    '--xeg-error': '--xeg-color-error-500',
    '--xeg-warning': '--xeg-color-warning-500',
  };

  /**
   * 클래스명 결합 유틸리티
   * null, undefined, false 값을 자동으로 필터링
   */
  static combineClasses(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  /**
   * 글래스모피즘 효과 적용
   * @param element - 대상 HTML 요소
   * @param intensity - 글래스모피즘 강도
   * @param customConfig - 커스텀 설정 (선택사항)
   */
  static applyGlassmorphism(
    element: HTMLElement,
    intensity: GlassmorphismIntensity,
    customConfig?: Partial<GlassmorphismConfig>
  ): void {
    const config = { ...this.GLASSMORPHISM_PRESETS[intensity], ...customConfig };

    // 글래스모피즘 스타일 적용
    element.style.background = config.background!;
    element.style.backdropFilter = config.blur!;
    (element.style as unknown as Record<string, string>).webkitBackdropFilter = config.blur!; // Safari 지원
    element.style.border = config.border!;
    element.style.boxShadow = config.shadow!;

    // 성능 최적화 속성 추가
    element.style.willChange = 'backdrop-filter, transform';
    element.style.transform = 'translateZ(0)';
    element.style.contain = 'layout style paint';

    // 접근성을 위한 overflow 처리
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
  }

  /**
   * 테마 설정
   * @param element - 대상 HTML 요소 (기본값: document.documentElement)
   * @param theme - 테마 타입
   * @param prefix - 테마 클래스 접두사
   */
  static setTheme(
    element: HTMLElement = document.documentElement,
    theme: Theme,
    prefix: string = 'theme'
  ): void {
    // 기존 테마 클래스 제거
    Array.from(element.classList)
      .filter(cls => cls.startsWith(`${prefix}-`))
      .forEach(cls => element.classList.remove(cls));

    // 새 테마 클래스 추가
    element.classList.add(`${prefix}-${theme}`);

    // data-theme 속성도 설정
    element.setAttribute('data-theme', theme);
  }

  /**
   * CSS 변수 설정 (토큰 매핑 지원)
   * @param property - CSS 변수명
   * @param value - 설정할 값
   * @param element - 대상 요소 (기본값: document.documentElement)
   */
  static setTokenValue(
    property: string,
    value: string,
    element: HTMLElement = document.documentElement
  ): void {
    // 토큰 매핑 확인
    const mappedProperty = this.TOKEN_MAPPING[property] || property;

    // CSS 변수명 정규화
    const cssProperty = mappedProperty.startsWith('--') ? mappedProperty : `--${mappedProperty}`;

    element.style.setProperty(cssProperty, value);
  }

  /**
   * CSS 변수 조회
   * @param property - CSS 변수명
   * @param element - 대상 요소 (기본값: document.documentElement)
   */
  static getTokenValue(property: string, element: HTMLElement = document.documentElement): string {
    // 토큰 매핑 확인
    const mappedProperty = this.TOKEN_MAPPING[property] || property;

    // CSS 변수명 정규화
    const cssProperty = mappedProperty.startsWith('--') ? mappedProperty : `--${mappedProperty}`;

    return getComputedStyle(element).getPropertyValue(cssProperty).trim();
  }

  /**
   * 컴포넌트 상태 클래스 업데이트
   * @param element - 대상 요소
   * @param state - 상태 객체
   * @param prefix - 상태 클래스 접두사
   */
  static updateComponentState(
    element: HTMLElement,
    state: ComponentState,
    prefix: string = 'is'
  ): void {
    Object.entries(state).forEach(([key, value]) => {
      const className = `${prefix}-${key}`;
      if (value) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    });
  }

  /**
   * 유틸리티 클래스 적용
   * @param element - 대상 요소
   * @param utilities - 유틸리티 클래스 배열
   */
  static applyUtilityClass(element: HTMLElement, ...utilities: string[]): void {
    utilities.forEach(utility => {
      if (utility) {
        element.classList.add(utility);
      }
    });
  }

  /**
   * 유틸리티 클래스 제거
   * @param element - 대상 요소
   * @param utilities - 제거할 유틸리티 클래스 배열
   */
  static removeUtilityClass(element: HTMLElement, ...utilities: string[]): void {
    utilities.forEach(utility => {
      if (utility) {
        element.classList.remove(utility);
      }
    });
  }

  /**
   * 다중 CSS 변수 설정
   * @param variables - CSS 변수 객체
   * @param element - 대상 요소
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
   * 글래스모피즘 지원 여부 감지
   */
  static supportsGlassmorphism(): boolean {
    // backdrop-filter 지원 여부 확인
    return (
      'backdropFilter' in document.documentElement.style ||
      'webkitBackdropFilter' in document.documentElement.style
    );
  }

  /**
   * 고대비 모드 감지
   */
  static isHighContrastMode(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * 투명도 감소 모드 감지
   */
  static isReducedTransparencyMode(): boolean {
    return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  }

  /**
   * 접근성을 고려한 글래스모피즘 적용
   * @param element - 대상 요소
   * @param intensity - 기본 강도
   */
  static applyAccessibleGlassmorphism(
    element: HTMLElement,
    intensity: GlassmorphismIntensity
  ): void {
    // 고대비 모드나 투명도 감소 모드에서는 글래스모피즘 비활성화
    if (this.isHighContrastMode() || this.isReducedTransparencyMode()) {
      element.style.background = 'rgba(255, 255, 255, 0.98)';
      element.style.backdropFilter = 'none';
      (element.style as unknown as Record<string, string>).webkitBackdropFilter = 'none';
      element.style.border = '2px solid rgba(0, 0, 0, 0.8)';
      return;
    }

    // 글래스모피즘 지원 여부 확인
    if (!this.supportsGlassmorphism()) {
      // 폴백 스타일 적용
      element.style.background = 'rgba(255, 255, 255, 0.95)';
      element.style.border = '1px solid rgba(0, 0, 0, 0.1)';
      element.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
      return;
    }

    // 일반적인 글래스모피즘 적용
    this.applyGlassmorphism(element, intensity);
  }
}

export default UnifiedStyleManager;
