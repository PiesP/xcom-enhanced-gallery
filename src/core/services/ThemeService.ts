/**
 * Core Layer - Theme Manager
 *
 * 투명 기조의 시스템 테마 감지 서비스
 * 복잡한 자동 전환 기능 제거, 시스템 테마 감지만 유지
 */

import { logger } from '../../infrastructure/logging/logger';

/**
 * 테마 타입 (auto 제거)
 */
export type Theme = 'light' | 'dark';

/**
 * 시스템 테마 서비스
 * 시스템 테마 감지만 수행, 복잡한 자동 전환 제거
 */
export class ThemeManager {
  private static instance: ThemeManager | null = null;
  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: Theme = 'light';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.initializeSystemThemeDetection();
    }
  }

  public static getInstance(): ThemeManager {
    ThemeManager.instance ??= new ThemeManager();
    return ThemeManager.instance;
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
    ThemeManager.instance = null;
    logger.info('ThemeManager destroyed');
  }
}

/**
 * 전역 테마 서비스 인스턴스
 */
export const themeManager = ThemeManager.getInstance();
