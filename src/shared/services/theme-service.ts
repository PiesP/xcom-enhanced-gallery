/**
 * Core Layer - Theme Service
 *
 * 시스템 테마 감지 및 적용 서비스
 * @version 3.1.0
 */

import { logger } from '@shared/logging';
import type { StorageAdapter } from './storage/storage-adapter.interface';
import { UserscriptStorageAdapter } from './storage/userscript-storage-adapter';
import { BaseServiceImpl } from './base-service';

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
 *
 * Phase A5.1: BaseServiceImpl 패턴 적용 (생명주기 관리 표준화)
 * - onInitialize(): storage 복원, 시스템 감지 설정, 초기 테마 적용
 * - onDestroy(): MediaQueryList 리스너, 상태 정리
 * - isInitialized(): 상태 쿼리 메서드
 */
export class ThemeService extends BaseServiceImpl {
  private static readonly STORAGE_KEY = 'xeg-theme';
  private static readonly VALID_SETTINGS: readonly ThemeSetting[] = ['auto', 'light', 'dark'];

  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: Theme = 'light';
  private themeSetting: ThemeSetting = 'auto';
  private readonly listeners: Set<ThemeChangeListener> = new Set();
  private onMediaQueryChange: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null =
    null;

  /**
   * @param storage 저장소 어댑터 (기본값: UserscriptStorageAdapter)
   */
  constructor(private readonly storage: StorageAdapter = new UserscriptStorageAdapter()) {
    super('ThemeService');

    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    }
  }

  /**
   * 서비스 초기화 (BaseServiceImpl 템플릿 메서드 구현)
   * storage에서 설정 복원 및 시스템 감지 설정
   */
  protected async onInitialize(): Promise<void> {
    // storage에서 설정 복원
    await this.restoreThemeSetting();

    // 시스템 테마 감지 설정
    this.initializeSystemThemeDetection();

    // 초기 테마 적용
    this.applyCurrentTheme();
  }

  /**
   * 테마 설정 복원
   */
  private async restoreThemeSetting(): Promise<void> {
    try {
      const savedSetting = await this.storage.getItem(ThemeService.STORAGE_KEY);
      const normalized = ThemeService.normalizeThemeSetting(savedSetting);
      if (normalized) {
        this.themeSetting = normalized;
      }
    } catch (error) {
      logger.warn('Failed to restore theme setting from storage:', error);
    }
  }

  private static normalizeThemeSetting(value: unknown): ThemeSetting | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (ThemeService.VALID_SETTINGS.includes(trimmed as ThemeSetting)) {
        return trimmed as ThemeSetting;
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (
          typeof parsed === 'string' &&
          ThemeService.VALID_SETTINGS.includes(parsed as ThemeSetting)
        ) {
          return parsed as ThemeSetting;
        }
      } catch {
        // ignore – value was not JSON encoded
      }

      return null;
    }

    if (ThemeService.VALID_SETTINGS.includes(value as ThemeSetting)) {
      return value as ThemeSetting;
    }

    return null;
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
      // Phase 137: 레거시 API (addListener) 지원
      // 구 브라우저에서 MediaQueryList.addListener 사용
      try {
        const legacyHandler = this.onMediaQueryChange as unknown as (
          this: MediaQueryList,
          ev: MediaQueryListEvent
        ) => void;
        this.mediaQueryList.addListener(legacyHandler);
      } catch {
        // ignore
      }
    }

    logger.info('System theme detection initialized');
  }

  /**
   * 현재 설정에 따른 테마 적용
   */
  private applyCurrentTheme(): boolean {
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

      return true;
    }

    return false;
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
  public setTheme(setting: ThemeSetting | string): void {
    const normalized = ThemeService.normalizeThemeSetting(setting) ?? 'light';
    const previousSetting = this.themeSetting;

    this.themeSetting = normalized;

    // storage에 저장
    void this.saveThemeSetting();

    // 테마 적용
    const themeChanged = this.applyCurrentTheme();

    if (!themeChanged && previousSetting !== this.themeSetting) {
      this.notifyListeners();
    }

    logger.info(`Theme setting changed: ${this.themeSetting}`);
  }

  /**
   * 테마 설정 저장
   */
  private async saveThemeSetting(): Promise<void> {
    try {
      await this.storage.setItem(ThemeService.STORAGE_KEY, this.themeSetting);
    } catch (error) {
      logger.warn('Failed to save theme setting to storage:', error);
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
   * 서비스 종료 (BaseServiceImpl 템플릿 메서드 구현)
   * MediaQueryList 리스너 제거 및 상태 정리
   */
  protected onDestroy(): void {
    if (this.mediaQueryList) {
      try {
        if (this.onMediaQueryChange) {
          this.mediaQueryList.removeEventListener('change', this.onMediaQueryChange);
          // Phase 137: 레거시 API (removeListener) 제거
          const legacyHandler = this.onMediaQueryChange as unknown as (
            this: MediaQueryList,
            ev: MediaQueryListEvent
          ) => void;
          this.mediaQueryList.removeListener?.(legacyHandler);
        }
      } catch {
        // ignore
      }
      this.mediaQueryList = null;
    }

    this.listeners.clear();
    this.onMediaQueryChange = null;
  }
}

/**
 * 전역 싱글톤 인스턴스
 * Phase 230: BaseService 초기화를 위해 export 추가
 */
export const themeService = new ThemeService();
