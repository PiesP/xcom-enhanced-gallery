/**
 * @fileoverview 통합 스타일 서비스
 * @description TDD GREEN Phase: 모든 스타일 관련 중복을 통합하는 단일 서비스
 * @version 1.0.0 - GREEN Phase
 */

import { logger } from '@shared/logging/logger';
import StyleManager from '@shared/styles/StyleManager';
import {
  initializeNamespacedStyles,
  cleanupNamespacedStyles,
  createNamespacedClass,
} from '@shared/styles/namespaced-styles';

/**
 * 글래스모피즘 강도 타입
 */
export type GlassmorphismIntensity = 'light' | 'medium' | 'strong' | 'ultra';

/**
 * 테마 타입
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * 컴포넌트 상태 타입
 */
export interface ComponentState {
  readonly [key: string]: boolean;
}

/**
 * 통합 스타일 서비스 클래스
 * 모든 스타일 관련 기능을 하나로 통합
 */
export class StyleService {
  private static instance: StyleService | null = null;
  private activeResources = 0;

  constructor() {
    this.activeResources = 0;
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): StyleService {
    if (!StyleService.instance) {
      StyleService.instance = new StyleService();
    }
    return StyleService.instance;
  }

  /**
   * 클래스명 결합 유틸리티 (StyleManager 위임)
   */
  combineClasses(...classes: (string | undefined | false | null)[]): string {
    return StyleManager.combineClasses(...classes);
  }

  /**
   * CSS 변수 설정 (StyleManager 위임)
   */
  setCSSVariable(
    name: string,
    value: string,
    element: HTMLElement = document.documentElement
  ): void {
    // CSS 변수명 정규화
    const variableName = name.startsWith('--') ? name : `--${name}`;
    StyleManager.setTokenValue(variableName, value, element);
  }

  /**
   * CSS 변수 조회 (StyleManager 위임)
   */
  getCSSVariable(name: string, element: HTMLElement = document.documentElement): string {
    const variableName = name.startsWith('--') ? name : `--${name}`;
    return StyleManager.getTokenValue(variableName, element);
  }

  /**
   * 여러 CSS 변수 설정
   */
  setCSSVariables(
    variables: Record<string, string>,
    element: HTMLElement = document.documentElement
  ): void {
    StyleManager.setMultipleTokens(variables, element);
  }

  /**
   * 글래스모피즘 적용 (StyleManager 위임)
   */
  applyGlassmorphism(element: HTMLElement, intensity: GlassmorphismIntensity): void {
    StyleManager.applyGlassmorphism(element, intensity);
    this.activeResources++;
  }

  /**
   * 접근성을 고려한 글래스모피즘 적용
   */
  applyAccessibleGlassmorphism(element: HTMLElement, intensity: GlassmorphismIntensity): void {
    StyleManager.applyAccessibleGlassmorphism(element, intensity);
    this.activeResources++;
  }

  /**
   * 테마 설정 (StyleManager 위임)
   */
  setTheme(
    element: HTMLElement = document.documentElement,
    theme: Theme,
    prefix: string = 'theme'
  ): void {
    StyleManager.setTheme(element, theme, prefix);
  }

  /**
   * 컴포넌트 상태 업데이트 (StyleManager 위임)
   */
  updateComponentState(element: HTMLElement, state: ComponentState, prefix: string = 'is'): void {
    StyleManager.updateComponentState(element, state, prefix);
  }

  /**
   * 유틸리티 클래스 적용
   */
  applyUtilityClass(element: HTMLElement, ...utilities: string[]): void {
    StyleManager.applyUtilityClass(element, ...utilities);
  }

  /**
   * 유틸리티 클래스 제거
   */
  removeUtilityClass(element: HTMLElement, ...utilities: string[]): void {
    StyleManager.removeUtilityClass(element, ...utilities);
  }

  /**
   * 네임스페이스된 스타일 초기화 (namespaced-styles 위임)
   */
  initializeNamespacedStyles(): void {
    initializeNamespacedStyles();
    logger.debug('[StyleService] Namespaced styles initialized');
  }

  /**
   * 네임스페이스된 클래스명 생성
   */
  createNamespacedClass(className: string): string {
    return createNamespacedClass(className);
  }

  /**
   * 클래스 토글 유틸리티
   */
  toggleClass(element: HTMLElement, className: string, condition?: boolean): void {
    const shouldHave = condition ?? !element.classList.contains(className);
    element.classList.toggle(className, shouldHave);
  }

  /**
   * 안전한 스타일 설정
   */
  safeSetStyle(element: HTMLElement | null, styles: Partial<CSSStyleDeclaration>): void {
    if (!element) return;

    try {
      Object.assign(element.style, styles);
      this.activeResources++;
    } catch (error) {
      logger.warn('[StyleService] Failed to set styles:', error);
    }
  }

  /**
   * 글래스모피즘 지원 여부 확인
   */
  supportsGlassmorphism(): boolean {
    return StyleManager.supportsGlassmorphism();
  }

  /**
   * 고대비 모드 감지
   */
  isHighContrastMode(): boolean {
    return StyleManager.isHighContrastMode();
  }

  /**
   * 투명도 감소 모드 감지
   */
  isReducedTransparencyMode(): boolean {
    return StyleManager.isReducedTransparencyMode();
  }

  /**
   * 활성 리소스 수 반환 (테스트용)
   */
  getActiveResources(): number {
    return this.activeResources;
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    cleanupNamespacedStyles();
    this.activeResources = 0;
    logger.debug('[StyleService] Cleanup completed');
  }
}

// 싱글톤 인스턴스 export
export const styleService = StyleService.getInstance();

// 기본 export
export default StyleService;
