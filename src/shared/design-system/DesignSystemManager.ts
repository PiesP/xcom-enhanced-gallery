/**
 * @fileoverview 디자인 시스템 매니저
 * @description 디자인 시스템의 중앙 집중식 관리 및 활용
 * @version 1.0.0
 */

import {
  initializeDesignSystem,
  changeTheme,
  enableAutoTheme,
} from './utils/design-system-initializer';
import { CSSVariablesManager } from '../utils/styles/css-variables-manager';
import { validateDesignTokens, getCSSVariable, setCSSVariable } from './utils/design-utils';
import { DESIGN_TOKENS, getDesignTokens } from './tokens/DesignTokens';
import { logger } from '../../infrastructure/logging/logger';
import type { Cleanupable } from '../../infrastructure/types/lifecycle.types';

/**
 * 디자인 시스템 매니저 클래스
 * 애플리케이션의 모든 디자인 관련 기능을 통합 관리
 */
export class DesignSystemManager implements Cleanupable {
  private static instance: DesignSystemManager | null = null;
  private readonly cssManager: CSSVariablesManager;
  private isInitialized = false;
  private currentTheme: 'light' | 'dark' = 'light';

  private constructor() {
    this.cssManager = CSSVariablesManager.getInstance();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): DesignSystemManager {
    if (!DesignSystemManager.instance) {
      DesignSystemManager.instance = new DesignSystemManager();
    }
    return DesignSystemManager.instance;
  }

  /**
   * 디자인 시스템 초기화
   */
  public async initialize(
    options: {
      theme?: 'light' | 'dark' | 'auto';
      validateTokens?: boolean;
    } = {}
  ): Promise<void> {
    if (this.isInitialized) {
      logger.debug('Design system already initialized');
      return;
    }

    try {
      logger.info('Initializing unified design system...');

      // 1. CSS 변수 매니저 초기화
      await this.cssManager.initialize();

      // 2. 디자인 토큰 시스템 초기화
      await initializeDesignSystem(options);

      // 3. 자동 테마 활성화 (옵션)
      if (options.theme === 'auto') {
        enableAutoTheme();
      }

      // 4. 토큰 검증
      if (options.validateTokens !== false) {
        const isValid = validateDesignTokens();
        if (!isValid) {
          logger.warn('Some design tokens validation failed');
        }
      }

      this.currentTheme = this.determineCurrentTheme(options.theme);
      this.isInitialized = true;

      logger.info(`Design system initialized successfully (theme: ${this.currentTheme})`);
    } catch (error) {
      logger.error('Failed to initialize design system:', error);
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
  public async changeTheme(theme: 'light' | 'dark'): Promise<void> {
    try {
      changeTheme(theme);
      this.currentTheme = theme;
      logger.info(`Theme changed to ${theme}`);
    } catch (error) {
      logger.error('Failed to change theme:', error);
      throw error;
    }
  }

  /**
   * 디자인 토큰 값 반환
   */
  public getToken(path: string): string | undefined {
    return getCSSVariable(path);
  }

  /**
   * 디자인 토큰 값 설정
   */
  public setToken(path: string, value: string): void {
    setCSSVariable(path, value);
  }

  /**
   * 현재 테마의 토큰 객체 반환
   */
  public getTokens(): typeof DESIGN_TOKENS {
    return getDesignTokens(this.currentTheme);
  }

  /**
   * 디자인 시스템 상태 진단
   */
  public diagnose(): {
    isInitialized: boolean;
    currentTheme: string;
    tokensValid: boolean;
    cssManagerReady: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      currentTheme: this.currentTheme,
      tokensValid: validateDesignTokens(),
      cssManagerReady: this.cssManager ? true : false,
    };
  }

  /**
   * 초기화 상태 확인
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 정리 (메모리 해제)
   */
  public cleanup(): void {
    // 필요한 정리 작업 수행
    this.isInitialized = false;
    logger.debug('Design system cleaned up');
  }

  /**
   * 현재 테마 결정
   */
  private determineCurrentTheme(themeOption?: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
    if (themeOption === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return themeOption || 'light';
  }
}

/**
 * 전역 디자인 시스템 매니저 인스턴스
 */
export const designSystemManager = DesignSystemManager.getInstance();

/**
 * 편의 함수들
 */
export const initDesignSystem = (options?: Parameters<typeof designSystemManager.initialize>[0]) =>
  designSystemManager.initialize(options);

export const getDesignToken = (path: string) => designSystemManager.getToken(path);

export const setDesignToken = (path: string, value: string) =>
  designSystemManager.setToken(path, value);

export const switchTheme = (theme: 'light' | 'dark') => designSystemManager.changeTheme(theme);

export const getTheme = () => designSystemManager.getCurrentTheme();

export const isDesignSystemReady = () => designSystemManager.isReady();
