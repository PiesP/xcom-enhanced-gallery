/**
 * Core Layer - Theme Service
 *
 * 시스템 테마 감지 및 적용 서비스
 */

import { logger } from '../logging/logger';

/**
 * 테마 타입
 */
export type Theme = 'light' | 'dark';

/**
 * 테마 설정 타입 (자동 감지 포함)
 */
export type ThemeSetting = 'auto' | Theme;

/**
 * 테마 변경 이벤트 리스너
 */
export type ThemeChangeListener = (theme: Theme, setting: ThemeSetting) => void;

/**
 * 시스템 테마 서비스 - Phase 4 간소화 + 수동 설정 지원
 */
export class ThemeService {
  private static readonly STORAGE_KEY = 'xeg-theme';

  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: Theme = 'light';
  private themeSetting: ThemeSetting = 'auto';
  private readonly listeners: Set<ThemeChangeListener> = new Set();
  private isInitialized = false;
  private onMediaQueryChange: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null =
    null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.initialize();
    }
  }

  /**
   * 서비스 초기화 (localStorage에서 설정 복원 및 시스템 감지 설정)
   */
  public initialize(): void {
    if (this.isInitialized) return;

    // localStorage에서 설정 복원
    this.restoreThemeSetting();

    // 시스템 테마 감지 설정
    this.initializeSystemThemeDetection();

    // 초기 테마 적용
    this.applyCurrentTheme();

    this.isInitialized = true;
    logger.info('ThemeService initialized');
  }

  /**
   * 테마 설정 복원
   */
  private restoreThemeSetting(): void {
    try {
      const savedSetting = localStorage?.getItem(ThemeService.STORAGE_KEY) as ThemeSetting;
      if (savedSetting && ['auto', 'light', 'dark'].includes(savedSetting)) {
        this.themeSetting = savedSetting;
      }
    } catch (error) {
      logger.warn('Failed to restore theme setting from localStorage:', error);
    }
  }

  /**
   * 시스템 테마 감지 초기화
   */
  private initializeSystemThemeDetection(): void {
    if (!this.mediaQueryList) return;

    // 시스템 테마 변경 감지
    this.onMediaQueryChange = () => {
      if (this.themeSetting === 'auto') {
        this.applyCurrentTheme();
      }
    };

    try {
      this.mediaQueryList.addEventListener('change', this.onMediaQueryChange);
    } catch {
      // older APIs fallback
      try {
        this.mediaQueryList.addListener(
          this.onMediaQueryChange as unknown as (
            this: MediaQueryList,
            ev: MediaQueryListEvent
          ) => void
        );
      } catch {
        // ignore
      }
    }

    logger.info('System theme detection initialized');
  }

  /**
   * 현재 설정에 따른 테마 적용
   */
  private applyCurrentTheme(): void {
    const effectiveTheme = this.getEffectiveTheme();

    if (this.currentTheme !== effectiveTheme) {
      this.currentTheme = effectiveTheme;

      // data-theme 속성 설정으로 CSS에서 자동 적용
      if (typeof document !== 'undefined') {
        document.documentElement?.setAttribute('data-theme', this.currentTheme);
      }

      // 리스너 호출
      this.notifyListeners();

      logger.debug(`Theme applied: ${this.currentTheme} (setting: ${this.themeSetting})`);
    }
  }

  /**
   * 리스너들에게 테마 변경 알림
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTheme, this.themeSetting);
      } catch (error) {
        logger.warn('Theme change listener error:', error);
      }
    });
  }

  /**
   * 테마 설정 (수동)
   */
  public setTheme(setting: ThemeSetting): void {
    // 유효하지 않은 값은 기본값으로 fallback
    if (!['auto', 'light', 'dark'].includes(setting)) {
      setting = 'light';
    }

    this.themeSetting = setting;

    // localStorage에 저장
    this.saveThemeSetting();

    // 테마 적용
    this.applyCurrentTheme();

    logger.info(`Theme setting changed: ${setting}`);
  }

  /**
   * 테마 설정 저장
   */
  private saveThemeSetting(): void {
    try {
      localStorage?.setItem(ThemeService.STORAGE_KEY, this.themeSetting);
    } catch (error) {
      logger.warn('Failed to save theme setting to localStorage:', error);
    }
  }

  /**
   * 효과적인 테마 계산 (auto 설정 시 시스템 테마 반환)
   */
  public getEffectiveTheme(): Theme {
    if (this.themeSetting === 'auto') {
      return this.getSystemTheme();
    }
    return this.themeSetting;
  }

  /**
   * 시스템 테마 감지
   */
  private getSystemTheme(): Theme {
    if (!this.mediaQueryList) return 'light';
    return this.mediaQueryList.matches ? 'dark' : 'light';
  }

  /**
   * 테마 변경 이벤트 구독
   */
  public onThemeChange(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener);

    // 구독 해제 함수 반환
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 현재 테마 반환
   */
  public getCurrentTheme(): ThemeSetting {
    return this.themeSetting;
  }

  /**
   * 다크 모드 여부 확인
   */
  public isDarkMode(): boolean {
    return this.getEffectiveTheme() === 'dark';
  }

  /**
   * 서비스 종료
   */
  public destroy(): void {
    if (this.mediaQueryList) {
      try {
        if (this.onMediaQueryChange) {
          this.mediaQueryList.removeEventListener('change', this.onMediaQueryChange);
          this.mediaQueryList.removeListener?.(
            this.onMediaQueryChange as unknown as (
              this: MediaQueryList,
              ev: MediaQueryListEvent
            ) => void
          );
        }
      } catch {
        // ignore
      }
      this.mediaQueryList = null;
    }

    this.listeners.clear();
    this.isInitialized = false;
    this.onMediaQueryChange = null;

    logger.info('ThemeService destroyed');
  }

  /**
   * 서비스 정리 (cleanup과 destroy 호환성)
   */
  public async cleanup(): Promise<void> {
    this.destroy();
  }
}

// Note: 전역 싱글턴 인스턴스 생성은 import 시점 부작용을 유발하여
// 테스트/런타임에서 이벤트 리스너가 남을 수 있습니다. R4 누수 방지를 위해
// 이 파일에서는 인스턴스를 생성/export하지 않습니다. 필요한 곳에서
// 서비스 매니저를 통해 생성/주입하세요.
