/**
 * @fileoverview Design System
 * @description 디자인 시스템 중앙 관리
 */

import { DESIGN_TOKENS, createCSSVariable, getThemeTokenValue } from './tokens/DesignTokens';
import { logger } from '../../infrastructure/logging/logger';
import type { Cleanupable } from '../../infrastructure/types/lifecycle.types';

/**
 * CSS 스타일시트 ID
 */
const DESIGN_SYSTEM_STYLE_ID = 'xg-design-system';

/**
 * 디자인 시스템
 */
export class DesignSystem implements Cleanupable {
  private static instance: DesignSystem | null = null;
  private isInitialized = false;
  private currentTheme: 'light' | 'dark' = 'light';
  private mediaQuery: MediaQueryList | null = null;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): DesignSystem {
    if (!DesignSystem.instance) {
      DesignSystem.instance = new DesignSystem();
    }
    return DesignSystem.instance;
  }

  /**
   * 디자인 시스템 초기화
   */
  public async initialize(
    options: {
      theme?: 'light' | 'dark' | 'auto';
      injectGlobalStyles?: boolean;
      validateTokens?: boolean;
    } = {}
  ): Promise<void> {
    if (this.isInitialized) {
      logger.debug('[DesignSystem] Already initialized');
      return;
    }

    try {
      const { theme = 'auto', injectGlobalStyles = true, validateTokens = true } = options;

      logger.info('🎨 Initializing design system...');

      // 1. CSS 변수 주입
      this.injectCSSVariables();

      // 2. 전역 스타일 주입 (옵션)
      if (injectGlobalStyles) {
        this.injectGlobalStyles();
      }

      // 3. 테마 설정
      this.setupTheme(theme);

      // 4. 토큰 검증 (옵션)
      if (validateTokens && !this.validateTokens()) {
        logger.warn('Some design tokens are missing or invalid');
      }

      this.isInitialized = true;
      logger.info(`✅ Design system initialized (theme: ${this.currentTheme})`);
    } catch (error) {
      logger.error('❌ Failed to initialize design system:', error);
      throw error;
    }
  }

  /**
   * 현재 테마 반환
   */
  public getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * 테마 변경
   */
  public changeTheme(theme: 'light' | 'dark'): void {
    try {
      this.currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      logger.info(`🎨 Theme changed to ${theme}`);
    } catch (error) {
      logger.error('❌ Failed to change theme:', error);
      throw error;
    }
  }

  /**
   * 디자인 토큰 값 반환
   */
  public getToken(path: string): string {
    return getThemeTokenValue(path, this.currentTheme);
  }

  /**
   * CSS 변수 반환
   */
  public getCSSVariable(path: string): string {
    return createCSSVariable(path);
  }

  /**
   * 현재 테마의 토큰 객체 반환
   */
  public getTokens(): typeof DESIGN_TOKENS {
    return DESIGN_TOKENS;
  }

  /**
   * 디자인 시스템 상태 진단
   */
  public diagnose(): {
    isInitialized: boolean;
    currentTheme: string;
    cssVariablesInjected: boolean;
    globalStylesInjected: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      currentTheme: this.currentTheme,
      cssVariablesInjected: !!document.getElementById(`${DESIGN_SYSTEM_STYLE_ID}-variables`),
      globalStylesInjected: !!document.getElementById(`${DESIGN_SYSTEM_STYLE_ID}-globals`),
    };
  }

  /**
   * 초기화 상태 확인
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * CSS 변수 주입
   */
  private injectCSSVariables(): void {
    const styleId = `${DESIGN_SYSTEM_STYLE_ID}-variables`;

    if (document.getElementById(styleId)) {
      return;
    }

    const cssVariables = this.generateCSSVariables();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssVariables;
    document.head.appendChild(style);

    logger.debug('🎨 CSS variables injected');
  }

  /**
   * 전역 스타일 주입
   */
  private injectGlobalStyles(): void {
    const styleId = `${DESIGN_SYSTEM_STYLE_ID}-globals`;

    if (document.getElementById(styleId)) {
      return;
    }

    const globalStyles = this.generateGlobalStyles();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = globalStyles;
    document.head.appendChild(style);

    logger.debug('🎨 Global styles injected');
  }

  /**
   * CSS 변수 생성
   */
  private generateCSSVariables(): string {
    const { colors, spacing, typography, layout, animation } = DESIGN_TOKENS;

    return `
      :root {
        /* 색상 시스템 */
        ${this.generateColorVariables(colors)}

        /* 간격 시스템 */
        ${Object.entries(spacing)
          .map(([key, value]) => `--xeg-spacing-${key}: ${value};`)
          .join('\n        ')}

        /* 타이포그래피 */
        ${Object.entries(typography.fontSize)
          .map(([key, value]) => `--xeg-font-size-${key}: ${value};`)
          .join('\n        ')}
        ${Object.entries(typography.fontWeight)
          .map(([key, value]) => `--xeg-font-weight-${key}: ${value};`)
          .join('\n        ')}
        ${Object.entries(typography.lineHeight)
          .map(([key, value]) => `--xeg-line-height-${key}: ${value};`)
          .join('\n        ')}

        /* 레이아웃 */
        ${Object.entries(layout.borderRadius)
          .map(([key, value]) => `--xeg-radius-${key}: ${value};`)
          .join('\n        ')}
        ${Object.entries(layout.zIndex)
          .map(([key, value]) => `--xeg-z-${key}: ${value};`)
          .join('\n        ')}
        ${Object.entries(layout.shadow)
          .map(([key, value]) => `--xeg-shadow-${key}: ${value};`)
          .join('\n        ')}

        /* 애니메이션 */
        ${Object.entries(animation.duration)
          .map(([key, value]) => `--xeg-duration-${key}: ${value};`)
          .join('\n        ')}
        ${Object.entries(animation.easing)
          .map(([key, value]) => `--xeg-easing-${key}: ${value};`)
          .join('\n        ')}
      }

      /* 다크 테마 */
      [data-theme='dark'] {
        --xeg-color-surface: var(--xeg-color-surface-dark);
        --xeg-color-text-primary: var(--xeg-color-neutral-50);
        --xeg-color-text-secondary: var(--xeg-color-neutral-300);
      }

      /* 시스템 테마 감지 */
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme]) {
          --xeg-color-surface: var(--xeg-color-surface-dark);
          --xeg-color-text-primary: var(--xeg-color-neutral-50);
          --xeg-color-text-secondary: var(--xeg-color-neutral-300);
        }
      }
    `;
  }

  /**
   * 색상 변수 생성
   */
  private generateColorVariables(colors: typeof DESIGN_TOKENS.colors): string {
    let css = '';

    // Primary colors
    Object.entries(colors.primary).forEach(([key, value]) => {
      css += `--xeg-color-primary-${key}: ${value};\n        `;
    });

    // Neutral colors
    Object.entries(colors.neutral).forEach(([key, value]) => {
      css += `--xeg-color-neutral-${key}: ${value};\n        `;
    });

    // Semantic colors
    Object.entries(colors.semantic).forEach(([category, scale]) => {
      Object.entries(scale).forEach(([key, value]) => {
        css += `--xeg-color-${category}-${key}: ${value};\n        `;
      });
    });

    // Surface colors
    Object.entries(colors.surface).forEach(([key, value]) => {
      if (typeof value === 'string') {
        css += `--xeg-color-surface-${key}: ${value};\n        `;
      } else {
        Object.entries(value).forEach(([subKey, subValue]) => {
          css += `--xeg-color-surface-${key}-${subKey}: ${subValue};\n        `;
        });
      }
    });

    // 기본 색상 별칭
    css += `
        --xeg-color-primary: var(--xeg-color-primary-500);
        --xeg-color-surface: var(--xeg-color-surface-light);
        --xeg-color-text-primary: var(--xeg-color-neutral-900);
        --xeg-color-text-secondary: var(--xeg-color-neutral-600);
    `;

    return css;
  }

  /**
   * 전역 스타일 생성
   */
  private generateGlobalStyles(): string {
    return `
      /* CSS Reset & Base */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      body {
        font-family: ${DESIGN_TOKENS.typography.fontFamily.sans};
        background: var(--xeg-color-surface);
        color: var(--xeg-color-text-primary);
        transition: background-color var(--xeg-duration-normal) var(--xeg-easing-easeOut),
                    color var(--xeg-duration-normal) var(--xeg-easing-easeOut);
      }

      /* 스크롤바 스타일링 */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: var(--xeg-color-surface-overlay-light);
        border-radius: var(--xeg-radius-sm);
      }

      ::-webkit-scrollbar-thumb {
        background: var(--xeg-color-surface-overlay-medium);
        border-radius: var(--xeg-radius-sm);
        transition: background-color var(--xeg-duration-fast) var(--xeg-easing-easeOut);
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--xeg-color-surface-overlay-strong);
      }

      /* 포커스 링 */
      :focus-visible {
        outline: 2px solid var(--xeg-color-primary);
        outline-offset: 2px;
        border-radius: var(--xeg-radius-sm);
      }

      /* XEG 갤러리 활성화 */
      .xeg-gallery-active {
        overflow: hidden !important;
      }

      /* 유틸리티 클래스 */
      .xeg-transition {
        transition: all var(--xeg-duration-normal) var(--xeg-easing-easeOut);
      }

      .xeg-sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
    `;
  }

  /**
   * 테마 설정
   */
  private setupTheme(themeOption: 'light' | 'dark' | 'auto'): void {
    if (themeOption === 'auto') {
      this.setupAutoTheme();
    } else {
      this.changeTheme(themeOption);
    }
  }

  /**
   * 자동 테마 설정
   */
  private setupAutoTheme(): void {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      const newTheme = e.matches ? 'dark' : 'light';
      this.changeTheme(newTheme);
    };

    // 초기 설정
    updateTheme(this.mediaQuery);

    // 변경 감지
    this.mediaQuery.addEventListener('change', updateTheme);
  }

  /**
   * 자동 테마 모드 활성화
   */
  public enableAutoTheme(): void {
    if (!window.matchMedia) {
      logger.warn('matchMedia not supported, auto theme disabled');
      return;
    }

    this.setupAutoTheme();
    logger.info('Auto theme enabled');
  }

  /**
   * 토큰 검증
   */
  private validateTokens(): boolean {
    try {
      const requiredTokens = [
        'color-primary-500',
        'color-neutral-500',
        'spacing-md',
        'font-size-base',
        'shadow-md',
        'duration-normal',
        'easing-easeOut',
      ];

      for (const token of requiredTokens) {
        const cssVar = `--xeg-${token}`;
        const computedStyle = getComputedStyle(document.documentElement);
        const value = computedStyle.getPropertyValue(cssVar);

        if (!value.trim()) {
          logger.warn(`Missing required design token: ${cssVar}`);
          return false;
        }
      }

      logger.info('All required design tokens are available');
      return true;
    } catch (error) {
      logger.error('Design token validation failed:', error);
      return false;
    }
  }

  /**
   * 정리 (메모리 해제)
   */
  public cleanup(): void {
    // 미디어 쿼리 리스너 제거
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', () => {});
      this.mediaQuery = null;
    }

    // 스타일시트 제거
    const variablesStyle = document.getElementById(`${DESIGN_SYSTEM_STYLE_ID}-variables`);
    const globalsStyle = document.getElementById(`${DESIGN_SYSTEM_STYLE_ID}-globals`);

    variablesStyle?.remove();
    globalsStyle?.remove();

    this.isInitialized = false;
    logger.debug('🧹 Design system cleaned up');
  }

  /**
   * 테스트용 인스턴스 리셋
   */
  public static resetInstance(): void {
    DesignSystem.instance?.cleanup();
    DesignSystem.instance = null;
  }
}

/**
 * 전역 디자인 시스템 인스턴스
 */
export const designSystem = DesignSystem.getInstance();

/**
 * 편의 함수들
 */
export const initDesignSystem = (options?: Parameters<typeof designSystem.initialize>[0]) =>
  designSystem.initialize(options);

export const getDesignToken = (path: string) => designSystem.getToken(path);

export const getCSSVar = (path: string) => designSystem.getCSSVariable(path);

export const switchTheme = (theme: 'light' | 'dark') => designSystem.changeTheme(theme);

export const getTheme = () => designSystem.getCurrentTheme();

export const isDesignSystemReady = () => designSystem.isReady();

export const diagnoseDesignSystem = () => designSystem.diagnose();
