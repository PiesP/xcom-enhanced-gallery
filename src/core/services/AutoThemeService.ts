/**
 * Core Layer - Simplified Theme Service
 *
 * 투명 기조의 단순한 테마 서비스
 * 복잡한 테마 변경 기능은 제거하고 기본적인 시스템 테마 감지만 유지
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 단순화된 테마 설정
 */
export interface SimpleThemeSettings {
  /** 시스템 테마 자동 감지 여부 */
  autoDetectSystemTheme: boolean;
  /** 디버그 모드 */
  debug: boolean;
}

/**
 * 단순 테마 타입
 */
export type SimpleTheme = 'light' | 'dark' | 'auto';

/**
 * 단순화된 자동 테마 서비스
 * 복잡한 테마 변경 기능을 제거하고 시스템 테마 감지만 유지
 */
export class AutoThemeService {
  private static instance: AutoThemeService | null = null;
  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: SimpleTheme = 'auto';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.initializeSystemThemeDetection();
    }
  }

  public static getInstance(): AutoThemeService {
    AutoThemeService.instance ??= new AutoThemeService();
    return AutoThemeService.instance;
  }

  /**
   * 시스템 테마 감지 초기화
   */
  private initializeSystemThemeDetection(): void {
    if (!this.mediaQueryList) return;

    // 초기 테마 적용
    this.applySystemTheme();

    // 시스템 테마 변경 감지
    this.mediaQueryList.addEventListener('change', () => {
      this.applySystemTheme();
    });

    logger.info('System theme detection initialized');
  }

  /**
   * 시스템 테마 적용
   */
  private applySystemTheme(): void {
    if (!this.mediaQueryList) return;

    const isDark = this.mediaQueryList.matches;
    this.currentTheme = isDark ? 'dark' : 'light';

    // CSS 변수는 이미 media query로 자동 적용되므로 추가 작업 불필요
    logger.debug(`System theme applied: ${this.currentTheme}`);
  }

  /**
   * 현재 테마 반환
   */
  public getCurrentTheme(): SimpleTheme {
    return this.currentTheme;
  }

  /**
   * 다크 모드 여부 확인
   */
  public isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  /**
   * 서비스 종료
   */
  public destroy(): void {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.applySystemTheme);
      this.mediaQueryList = null;
    }
    AutoThemeService.instance = null;
    logger.info('AutoThemeService destroyed');
  }
}

/**
 * 전역 테마 서비스 인스턴스
 */
export const autoThemeService = AutoThemeService.getInstance();
