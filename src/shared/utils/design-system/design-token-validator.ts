/**
 * @fileoverview 디자인 토큰 검증 유틸리티
 * @description OKLCH 색상과 글래스모피즘 속성을 검증하는 유틸리티
 */

/**
 * 디자인 토큰 검증 유틸리티 클래스
 */
export class DesignTokenValidator {
  /**
   * OKLCH 색상 형식이 유효한지 검증
   * @param color - 검증할 색상 문자열
   * @returns 유효한 OKLCH 형식이면 true
   */
  static validateOKLCH(color: string): boolean {
    const oklchRegex = /oklch\([\d.\s%]+\)/;
    return oklchRegex.test(color);
  }

  /**
   * CSS 커스텀 프로퍼티 값을 가져옴
   * @param propertyName - CSS 커스텀 프로퍼티 이름
   * @returns 프로퍼티 값
   */
  static getCSSCustomProperty(propertyName: string): string {
    if (typeof window === 'undefined' || !window.getComputedStyle) {
      return '';
    }

    const rootElement = document.documentElement;
    const computedStyle = window.getComputedStyle(rootElement);
    return computedStyle.getPropertyValue(propertyName).trim();
  }

  /**
   * 요소의 글래스모피즘 속성을 검증
   * @param element - 검증할 HTML 요소
   * @returns 글래스모피즘 속성이 있으면 true
   */
  static validateGlassProperties(element: HTMLElement): boolean {
    if (typeof window === 'undefined' || !window.getComputedStyle) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const hasBlur = style.backdropFilter?.includes('blur');
    const hasTransparency =
      style.backgroundColor &&
      (style.backgroundColor.includes('rgba') || style.backgroundColor.includes('hsla'));

    return Boolean(hasBlur && hasTransparency);
  }

  /**
   * 필수 디자인 토큰이 모두 정의되어 있는지 검증
   * @param requiredTokens - 필수 토큰 목록
   * @returns 누락된 토큰 목록
   */
  static validateRequiredTokens(requiredTokens: string[]): string[] {
    const missingTokens: string[] = [];

    for (const token of requiredTokens) {
      const value = this.getCSSCustomProperty(token);
      if (!value) {
        missingTokens.push(token);
      }
    }

    return missingTokens;
  }

  /**
   * 브라우저의 OKLCH 지원 여부를 확인
   * @returns OKLCH를 지원하면 true
   */
  static checkOKLCHSupport(): boolean {
    if (typeof CSS === 'undefined' || !CSS.supports) {
      return false;
    }

    return CSS.supports('color', 'oklch(0.7 0.15 220)');
  }

  /**
   * 브라우저의 backdrop-filter 지원 여부를 확인
   * @returns backdrop-filter를 지원하면 true
   */
  static checkBackdropFilterSupport(): boolean {
    if (typeof CSS === 'undefined' || !CSS.supports) {
      return false;
    }

    return (
      CSS.supports('backdrop-filter', 'blur(10px)') ||
      CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
    );
  }

  /**
   * 디자인 시스템의 전체적인 일관성을 검증
   * @returns 검증 결과
   */
  static validateDesignSystemConsistency(): {
    oklchSupport: boolean;
    backdropFilterSupport: boolean;
    missingTokens: string[];
    hasGlassTokens: boolean;
  } {
    const requiredTokens = [
      '--xeg-color-primary-500',
      '--xeg-color-primary-600',
      '--xeg-color-primary-700',
      '--xeg-color-neutral-100',
      '--xeg-color-neutral-500',
      '--xeg-color-neutral-700',
      '--xeg-glass-bg-light',
      '--xeg-glass-bg-medium',
      '--xeg-glass-blur-medium',
      '--xeg-glass-border-light',
      '--xeg-glass-shadow-medium',
    ];

    const glassTokens = [
      '--xeg-glass-bg-light',
      '--xeg-glass-bg-medium',
      '--xeg-glass-blur-medium',
      '--xeg-glass-border-light',
      '--xeg-glass-shadow-medium',
    ];

    const missingTokens = this.validateRequiredTokens(requiredTokens);
    const missingGlassTokens = this.validateRequiredTokens(glassTokens);

    return {
      oklchSupport: this.checkOKLCHSupport(),
      backdropFilterSupport: this.checkBackdropFilterSupport(),
      missingTokens,
      hasGlassTokens: missingGlassTokens.length === 0,
    };
  }
}

/**
 * 글래스모피즘 최적화 유틸리티
 */
export class GlassmorphismOptimizer {
  /**
   * 요소에 글래스모피즘 최적화를 적용
   * @param element - 최적화할 요소
   */
  static optimizeBlur(element: HTMLElement): void {
    // GPU 가속 활성화
    element.style.willChange = 'backdrop-filter, transform';

    // 하드웨어 가속을 위한 레이어 생성
    element.style.transform = 'translateZ(0)';

    // 성능 최적화를 위한 containment
    element.style.contain = 'layout style paint';
  }

  /**
   * 유휴 시간에 콜백을 실행
   * @param callback - 실행할 콜백
   */
  static lazy(callback: () => void): void {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback);
    } else {
      setTimeout(callback, 0);
    }
  }

  /**
   * 접근성 고려사항을 적용
   * @param element - 적용할 요소
   */
  static applyAccessibilityOptimizations(element: HTMLElement): void {
    // 투명도 감소 설정 고려
    const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)');

    if (prefersReducedTransparency.matches) {
      element.style.backdropFilter = 'none';
      element.style.background = 'var(--xeg-color-surface-solid)';
    }

    // 모션 감소 설정 고려
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
      element.style.transition = 'none';
      element.style.animation = 'none';
    }
  }
}
