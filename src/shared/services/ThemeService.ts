/**
 * Core Layer - Theme Service
 *
 * 시스템 테마 감지 및 적용 서비스
 */

import { logger } from '@shared/logging/logger';

/**
 * 테마 타입
 */
export type Theme = 'light' | 'dark';

/**
 * 시스템 테마 서비스 - Phase 4 간소화
 */
export class ThemeService {
  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: Theme = 'light';

  constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.initializeSystemThemeDetection();
    }
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

    // data-theme 속성 설정으로 CSS에서 자동 적용
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    logger.debug(`System theme applied: ${this.currentTheme}`);
  }

  /**
   * 현재 테마 반환
   */
  public getCurrentTheme(): Theme {
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
    logger.info('ThemeService destroyed');
  }
}

/**
 * 전역 테마 서비스 인스턴스 - 간단한 인스턴스 export
 */
export const themeService = new ThemeService();
