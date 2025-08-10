/**
 * Core Layer - Theme Service
 *
 * 시스템 테마 감지 및 적용 서비스
 */

import { logger } from '@shared/logging';

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
  // 변경 감지 핸들러를 인스턴스 필드로 유지하여 removeEventListener에서 동일 참조 사용
  private readonly onSystemThemeChange = () => this.applySystemTheme();

  constructor() {
    try {
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        this.initializeSystemThemeDetection();
      }
    } catch {
      // 환경이 지원되지 않으면 조용히 무시
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
    try {
      this.mediaQueryList.addEventListener('change', this.onSystemThemeChange);
    } catch {
      // 일부 브라우저는 addListener를 사용 (레거시). 테스트 환경에서는 무시
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.mediaQueryList as any).addListener?.(this.onSystemThemeChange);
    }

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
    try {
      if (typeof document !== 'undefined' && document.documentElement?.setAttribute) {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
      }
    } catch {
      // 문서가 없거나 setAttribute가 없는 환경은 무시
    }

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
      try {
        this.mediaQueryList.removeEventListener('change', this.onSystemThemeChange);
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.mediaQueryList as any).removeListener?.(this.onSystemThemeChange);
      }
      this.mediaQueryList = null;
    }
    logger.info('ThemeService destroyed');
  }
}

// ================================
// Phase 4: 표준화된 인스턴스 export
// ================================

/**
 * 표준화된 ThemeService 인스턴스
 */
export const themeService = new ThemeService();

/**
 * Default export (표준 패턴)
 */
export default themeService;
