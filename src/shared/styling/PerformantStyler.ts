/**
 * @fileoverview 성능 최적화된 스타일링 헬퍼
 * @description 배치 업데이트, 가상화, 메모이제이션을 통한 고성능 스타일링
 * @version 1.0.0
 */

/**
 * 성능 최적화된 스타일러
 * 배치 업데이트와 메모이제이션을 통해 DOM 조작을 최소화
 */
export class PerformantStyler {
  /** 배치 업데이트 대기 중인 스타일들 */
  private readonly pendingUpdates = new Map<HTMLElement, Record<string, string>>();

  /** 애니메이션 프레임 ID */
  private animationFrame: number | null = null;

  /** 스타일 캐시 */
  private readonly styleCache = new Map<string, string>();

  /** 계산된 스타일 캐시 */
  private computedStyleCache = new WeakMap<HTMLElement, Record<string, string>>();

  /**
   * 배치 스타일 업데이트 스케줄링
   * 여러 스타일 변경을 한 번에 적용하여 리플로우 최소화
   */
  public scheduleStyleUpdate(element: HTMLElement, styles: Record<string, string>): void {
    // 기존 업데이트에 병합
    const existing = this.pendingUpdates.get(element) || {};
    this.pendingUpdates.set(element, { ...existing, ...styles });

    // 다음 프레임에 일괄 적용
    if (!this.animationFrame) {
      this.animationFrame = requestAnimationFrame(() => {
        this.applyPendingUpdates();
      });
    }
  }

  /**
   * CSS 변수 업데이트 (배치 처리)
   */
  public updateCSSVariables(element: HTMLElement, variables: Record<string, string>): void {
    const cssVarStyles = Object.entries(variables).reduce(
      (acc, [key, value]) => {
        const varKey = key.startsWith('--') ? key : `--${key}`;
        acc[varKey] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    this.scheduleStyleUpdate(element, cssVarStyles);
  }

  /**
   * 즉시 스타일 적용 (애니메이션 등 즉시 적용이 필요한 경우)
   */
  public applyStylesImmediately(element: HTMLElement, styles: Record<string, string>): void {
    Object.entries(styles).forEach(([property, value]) => {
      if (property.startsWith('--')) {
        element.style.setProperty(property, value);
      } else {
        (element.style as unknown as Record<string, string>)[property] = value;
      }
    });
  }

  /**
   * Get computed style (cached)
   */
  public getComputedStyle(element: HTMLElement, property: string): string {
    let cached = this.computedStyleCache.get(element);

    if (!cached || !(property in cached)) {
      const computedStyle = getComputedStyle(element);
      cached = cached || {};
      cached[property] = computedStyle.getPropertyValue(property);
      this.computedStyleCache.set(element, cached);
    }

    return cached[property] || '';
  }

  /**
   * 스타일 문자열 생성 (메모이제이션)
   */
  public createStyleString(styles: Record<string, string>): string {
    const cacheKey = JSON.stringify(styles);

    if (this.styleCache.has(cacheKey)) {
      return this.styleCache.get(cacheKey)!;
    }

    const styleString = Object.entries(styles)
      .map(([property, value]) => `${this.kebabCase(property)}: ${value}`)
      .join('; ');

    this.styleCache.set(cacheKey, styleString);
    return styleString;
  }

  /**
   * 변형 효과 적용 (GPU 가속 활용)
   */
  public applyTransform(
    element: HTMLElement,
    transforms: {
      translateX?: number;
      translateY?: number;
      translateZ?: number;
      scale?: number;
      rotate?: number;
    }
  ): void {
    const transformParts: string[] = [];

    if (transforms.translateX !== undefined || transforms.translateY !== undefined) {
      const x = transforms.translateX || 0;
      const y = transforms.translateY || 0;
      const z = transforms.translateZ || 0;
      transformParts.push(`translate3d(${x}px, ${y}px, ${z}px)`);
    }

    if (transforms.scale !== undefined) {
      transformParts.push(`scale(${transforms.scale})`);
    }

    if (transforms.rotate !== undefined) {
      transformParts.push(`rotate(${transforms.rotate}deg)`);
    }

    const transformValue = transformParts.join(' ');
    this.scheduleStyleUpdate(element, {
      transform: transformValue,
      willChange: 'transform', // GPU 가속 힌트
    });
  }

  /**
   * 불투명도 애니메이션 (GPU 가속)
   */
  public fadeElement(element: HTMLElement, opacity: number, duration = 300): Promise<void> {
    return new Promise(resolve => {
      this.applyStylesImmediately(element, {
        transition: `opacity ${duration}ms ease-out`,
        willChange: 'opacity',
      });

      // 다음 프레임에 불투명도 변경
      requestAnimationFrame(() => {
        this.scheduleStyleUpdate(element, { opacity: opacity.toString() });
      });

      // 애니메이션 완료 후 정리
      setTimeout(() => {
        this.scheduleStyleUpdate(element, {
          willChange: 'auto',
          transition: '',
        });
        resolve();
      }, duration);
    });
  }

  /**
   * 크기 변경 (레이아웃 스레싱 최소화)
   */
  public resizeElement(element: HTMLElement, width?: number, height?: number): void {
    const styles: Record<string, string> = {};

    if (width !== undefined) {
      styles.width = `${width}px`;
    }

    if (height !== undefined) {
      styles.height = `${height}px`;
    }

    // contain 속성으로 레이아웃 영향 최소화
    styles.contain = 'layout style';

    this.scheduleStyleUpdate(element, styles);
  }

  /**
   * 위치 변경 (translate 사용으로 리플로우 방지)
   */
  public positionElement(element: HTMLElement, x: number, y: number): void {
    this.applyTransform(element, { translateX: x, translateY: y });
  }

  /**
   * 클래스 기반 상태 전환
   */
  public transitionState(element: HTMLElement, fromClass: string, toClass: string): void {
    element.classList.remove(fromClass);
    element.classList.add(toClass);
  }

  /**
   * 반응형 스타일 적용
   */
  public applyResponsiveStyles(
    element: HTMLElement,
    breakpointStyles: {
      mobile?: Record<string, string>;
      tablet?: Record<string, string>;
      desktop?: Record<string, string>;
    }
  ): void {
    const breakpoints = {
      mobile: '(max-width: 767px)',
      tablet: '(min-width: 768px) and (max-width: 1023px)',
      desktop: '(min-width: 1024px)',
    };

    Object.entries(breakpointStyles).forEach(([breakpoint, styles]) => {
      const mediaQuery = breakpoints[breakpoint as keyof typeof breakpoints];
      if (mediaQuery && window.matchMedia(mediaQuery).matches) {
        this.scheduleStyleUpdate(element, styles);
      }
    });
  }

  /**
   * 캐시 정리
   */
  public clearCache(): void {
    this.styleCache.clear();
    this.computedStyleCache = new WeakMap();
  }

  /**
   * 정리 및 해제
   */
  public cleanup(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.pendingUpdates.clear();
    this.clearCache();
  }

  // Private 메서드들

  /**
   * 배치 업데이트 적용
   */
  private applyPendingUpdates(): void {
    this.pendingUpdates.forEach((styles, element) => {
      Object.entries(styles).forEach(([property, value]) => {
        if (property.startsWith('--')) {
          element.style.setProperty(property, value);
        } else {
          (element.style as unknown as Record<string, string>)[property] = value;
        }
      });
    });

    this.pendingUpdates.clear();
    this.animationFrame = null;
  }

  /**
   * 카멜케이스를 케밥케이스로 변환
   */
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

/**
 * CSS 클래스 관리 헬퍼
 */
export class CSSClassManager {
  /** 클래스 상태 추적 */
  private classStates = new WeakMap<HTMLElement, Set<string>>();

  /**
   * 조건부 클래스 적용
   */
  public applyConditionalClasses(element: HTMLElement, classes: Record<string, boolean>): void {
    Object.entries(classes).forEach(([className, shouldApply]) => {
      if (shouldApply) {
        this.addClass(element, className);
      } else {
        this.removeClass(element, className);
      }
    });
  }

  /**
   * 클래스 토글 (상태 추적)
   */
  public toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
    const currentClasses = this.getTrackedClasses(element);
    const hasClass = currentClasses.has(className);
    const shouldAdd = force !== undefined ? force : !hasClass;

    if (shouldAdd && !hasClass) {
      this.addClass(element, className);
      return true;
    } else if (!shouldAdd && hasClass) {
      this.removeClass(element, className);
      return false;
    }

    return shouldAdd;
  }

  /**
   * 클래스 추가 (중복 방지)
   */
  public addClass(element: HTMLElement, className: string): void {
    const trackedClasses = this.getTrackedClasses(element);

    if (!trackedClasses.has(className)) {
      element.classList.add(className);
      trackedClasses.add(className);
    }
  }

  /**
   * 클래스 제거
   */
  public removeClass(element: HTMLElement, className: string): void {
    const trackedClasses = this.getTrackedClasses(element);

    if (trackedClasses.has(className)) {
      element.classList.remove(className);
      trackedClasses.delete(className);
    }
  }

  /**
   * 모든 추적된 클래스 제거
   */
  public clearTrackedClasses(element: HTMLElement): void {
    const trackedClasses = this.getTrackedClasses(element);

    trackedClasses.forEach(className => {
      element.classList.remove(className);
    });

    trackedClasses.clear();
  }

  /**
   * 클래스 상태 확인
   */
  public hasClass(element: HTMLElement, className: string): boolean {
    return this.getTrackedClasses(element).has(className);
  }

  /**
   * 추적된 클래스 목록 가져오기
   */
  public getTrackedClasses(element: HTMLElement): Set<string> {
    if (!this.classStates.has(element)) {
      this.classStates.set(element, new Set());
    }
    return this.classStates.get(element)!;
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.classStates = new WeakMap();
  }
}

/**
 * 기본 인스턴스들
 */
export const performantStyler = new PerformantStyler();
export const cssClassManager = new CSSClassManager();
