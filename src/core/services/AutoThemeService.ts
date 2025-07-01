/**
 * Core Layer - Simple Theme Manager
 *
 * 투명 기조의 시스템 테마 감지 서비스
 * 복잡한 자동 전환 기능 제거, 시스템 테마 감지만 유지
 */

import { logger } from '../../infrastructure/logging/logger';

/**
 * 단순 테마 타입 (auto 제거)
 */
export type Theme = 'light' | 'dark';

/**
 * 단순화된 시스템 테마 서비스
 * 시스템 테마 감지만 수행, 복잡한 자동 전환 제거
 */
export class SimpleThemeManager {
  private static instance: SimpleThemeManager | null = null;
  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: Theme = 'light';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.initializeSystemThemeDetection();
    }
  }

  public static getInstance(): SimpleThemeManager {
    SimpleThemeManager.instance ??= new SimpleThemeManager();
    return SimpleThemeManager.instance;
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
    SimpleThemeManager.instance = null;
    logger.info('SimpleThemeManager destroyed');
  }
}

/**
 * 전역 테마 서비스 인스턴스
 */
export const themeManager = SimpleThemeManager.getInstance();

// 하위 호환성을 위한 legacy export
export const AutoThemeService = SimpleThemeManager;
export const autoThemeService = themeManager;
