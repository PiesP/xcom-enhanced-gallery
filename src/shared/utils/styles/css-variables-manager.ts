/**
 * @fileoverview CSS Variables Manager
 * @description Unified CSS variable management system
 * @version 1.0.0
 *
 * This file handles injection, validation, and management of CSS variables.
 * Solves CSS variable initialization issues in UserScript environments.
 */

import { logger } from '../../../infrastructure/logging/logger';
import type { MediaType } from '../../../infrastructure/types/media.types';

/**
 * Critical CSS variables definition
 * Variables that must be available at runtime
 */
const CRITICAL_CSS_VARIABLES = {
  // === Core Color System ===
  '--xeg-color-primary': '#1d9bf0',
  '--xeg-color-primary-hover': '#1a8cd8',
  '--xeg-color-text-primary': '#0f1419',
  '--xeg-color-text-secondary': '#536471',
  '--xeg-color-surface': '#ffffff',
  '--xeg-color-border-primary': '#e5e7eb',

  // === Core Spacing System ===
  '--xeg-spacing-xs': '4px',
  '--xeg-spacing-sm': '8px',
  '--xeg-spacing-md': '16px',
  '--xeg-spacing-lg': '24px',
  '--xeg-spacing-xl': '32px',

  // === Core Z-Index ===
  '--xeg-z-gallery': '10000',
  '--xeg-z-modal': '10001',
  '--xeg-z-toast': '10002',

  // === Core Transitions ===
  '--xeg-transition-fast': 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  '--xeg-transition-normal': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

  // === Core Radius ===
  '--xeg-radius-sm': '4px',
  '--xeg-radius-md': '8px',
  '--xeg-radius-lg': '12px',

  // === Core Shadows ===
  '--xeg-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
  '--xeg-shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
  '--xeg-shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
} as const;

/**
 * CSS Variables Manager Class
 */
export class CSSVariablesManager {
  private static instance: CSSVariablesManager | null = null;
  private readonly injectedVariables = new Set<string>();
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): CSSVariablesManager {
    CSSVariablesManager.instance ??= new CSSVariablesManager();
    return CSSVariablesManager.instance;
  }

  /**
   * Initialize CSS variable system
   * Should be called at application startup
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('[CSSVariablesManager] Already initialized');
      return;
    }

    try {
      // 1. Immediate injection of critical variables
      this.injectCriticalVariables();

      // 2. Wait until DOM is ready
      await this.waitForDOMReady();

      // 3. Variable validation
      const validationResult = this.validateCSSVariables();

      if (!validationResult.isValid) {
        logger.warn(
          '[CSSVariablesManager] CSS variable validation failed:',
          validationResult.missing
        );
        // Re-inject missing variables
        this.injectMissingVariables(validationResult.missing);
      }

      // 4. Initialize theme system
      this.initializeThemeSystem();

      this.isInitialized = true;
      logger.info('[CSSVariablesManager] CSS variable system initialization completed');
    } catch (error) {
      logger.error('[CSSVariablesManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Immediate injection of critical CSS variables
   * Can be executed even when DOM is not ready
   */
  private injectCriticalVariables(): void {
    if (typeof document === 'undefined') {
      logger.warn('[CSSVariablesManager] document object is not available');
      return;
    }

    const documentElement = document.documentElement;

    Object.entries(CRITICAL_CSS_VARIABLES).forEach(([property, value]) => {
      documentElement.style.setProperty(property, value);
      this.injectedVariables.add(property);
    });

    logger.debug(
      '[CSSVariablesManager] Critical CSS variables injection completed:',
      Object.keys(CRITICAL_CSS_VARIABLES).length
    );
  }

  /**
   * DOM 준비 상태 대기
   */
  private async waitForDOMReady(): Promise<void> {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      } else {
        resolve();
      }
    });
  }

  /**
   * CSS 변수 검증
   */
  private validateCSSVariables(): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];

    Object.keys(CRITICAL_CSS_VARIABLES).forEach(variable => {
      const value = this.getCSSVariable(variable);
      if (!value) {
        missing.push(variable);
      }
    });

    return {
      isValid: missing.length === 0,
      missing,
    };
  }

  /**
   * 누락된 CSS 변수 재주입
   */
  private injectMissingVariables(missingVariables: string[]): void {
    missingVariables.forEach(variable => {
      const value = CRITICAL_CSS_VARIABLES[variable as keyof typeof CRITICAL_CSS_VARIABLES];
      if (value) {
        document.documentElement.style.setProperty(variable, value);
        this.injectedVariables.add(variable);
      }
    });

    logger.info('[CSSVariablesManager] 누락된 변수 재주입 완료:', missingVariables.length);
  }

  /**
   * 테마 시스템 초기화
   */
  private initializeThemeSystem(): void {
    // 시스템 테마 감지
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

    // 테마 변경 리스너
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      logger.debug('[CSSVariablesManager] 테마 변경:', e.matches ? 'dark' : 'light');
    });
  }

  /**
   * CSS 변수 값 가져오기
   */
  public getCSSVariable(variableName: string): string {
    if (typeof document === 'undefined') {
      return CRITICAL_CSS_VARIABLES[variableName as keyof typeof CRITICAL_CSS_VARIABLES] ?? '';
    }

    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  }

  /**
   * CSS 변수 설정
   */
  public setCSSVariable(variableName: string, value: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.style.setProperty(variableName, value);
    this.injectedVariables.add(variableName);
  }

  /**
   * 여러 CSS 변수 일괄 설정
   */
  public setCSSVariables(variables: Record<string, string>): void {
    Object.entries(variables).forEach(([key, value]) => {
      this.setCSSVariable(key, value);
    });
  }

  /**
   * 디버깅 정보 제공
   */
  public getDebugInfo(): {
    isInitialized: boolean;
    injectedCount: number;
    criticalVariables: string[];
    currentTheme: string;
  } {
    return {
      isInitialized: this.isInitialized,
      injectedCount: this.injectedVariables.size,
      criticalVariables: Object.keys(CRITICAL_CSS_VARIABLES),
      currentTheme: document.documentElement.getAttribute('data-theme') || 'unknown',
    };
  }

  /**
   * CSS 변수 시스템 재설정 (테스트용)
   */
  public reset(): void {
    this.injectedVariables.clear();
    this.isInitialized = false;
  }

  /**
   * Get media-specific CSS variables based on type
   * @param mediaType - Type of media (image/video)
   */
  public getMediaVariables(mediaType: MediaType): Record<string, string> {
    const baseVars = {
      '--xeg-media-border-radius': 'var(--xeg-radius-md)',
      '--xeg-media-shadow': 'var(--xeg-shadow-md)',
      '--xeg-media-transition': 'var(--xeg-transition-normal)',
    };

    const typeSpecificVars =
      mediaType === 'video'
        ? {
            '--xeg-media-controls-bg': 'var(--xeg-color-overlay-strong)',
            '--xeg-media-controls-color': 'var(--xeg-color-neutral-50)',
          }
        : {
            '--xeg-media-loading-bg': 'var(--xeg-color-neutral-100)',
            '--xeg-media-placeholder-color': 'var(--xeg-color-neutral-400)',
          };

    return { ...baseVars, ...typeSpecificVars };
  }
}

// 기본 인스턴스 export
export const cssVariablesManager = CSSVariablesManager.getInstance();

/**
 * 편의 함수들
 */
export const initializeCSSVariables = () => cssVariablesManager.initialize();
export const getCSSVariable = (name: string) => cssVariablesManager.getCSSVariable(name);
export const setCSSVariable = (name: string, value: string) =>
  cssVariablesManager.setCSSVariable(name, value);
export const setCSSVariables = (variables: Record<string, string>) =>
  cssVariablesManager.setCSSVariables(variables);

/**
 * Style utility functions integrated with CSS variables manager
 */

/**
 * Conditional class name combination
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Conditional class toggle
 */
export function toggleClass(element: HTMLElement, className: string, condition: boolean): void {
  element.classList.toggle(className, condition);
}

/**
 * Set CSS variable on specific element
 */
export function setElementCSSVariable(element: HTMLElement, variable: string, value: string): void {
  const varName = variable.startsWith('--') ? variable : `--${variable}`;
  element.style.setProperty(varName, value);
}

/**
 * Set multiple CSS variables on specific element
 */
export function setElementCSSVariables(
  element: HTMLElement,
  variables: Record<string, string>
): void {
  Object.entries(variables).forEach(([key, value]) => {
    setElementCSSVariable(element, key, value);
  });
}

/**
 * Component state class management
 */
export function updateComponentState(
  element: HTMLElement,
  baseClass: string,
  states: Record<string, boolean>
): void {
  Object.entries(states).forEach(([state, active]) => {
    const stateClass = `${baseClass}--${state}`;
    toggleClass(element, stateClass, active);
  });
}

/**
 * Unified style utilities object
 */
export const styleUtils = {
  combineClasses,
  toggleClass,
  setCSSVariable: setElementCSSVariable,
  setCSSVariables: setElementCSSVariables,
  updateComponentState,

  // CSS Variables Manager integration
  getGlobalCSSVariable: getCSSVariable,
  setGlobalCSSVariable: setCSSVariable,
  setGlobalCSSVariables: setCSSVariables,
} as const;
