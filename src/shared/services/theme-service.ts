/**
 * Core Layer - Theme Service
 *
 * System theme detection and application service
 * @version 3.2.0 - Phase 360: Direct PersistentStorage usage
 */

import { THEME_STORAGE_KEY } from '@shared/constants';
import { logger } from '@shared/logging';
import { getPersistentStorage } from './persistent-storage';
import { BaseServiceImpl } from './base-service';
import { syncThemeAttributes } from '@shared/utils/theme-dom';

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * Theme setting type (includes automatic detection)
 */
export type ThemeSetting = 'auto' | Theme;

/**
 * Theme change event listener
 */
export type ThemeChangeListener = (theme: Theme, setting: ThemeSetting) => void;

/**
 * System Theme Service - Phase 360: Direct PersistentStorage usage
 *
 * Phase A5.1: Applying BaseServiceImpl pattern (standardizing lifecycle management)
 * - onInitialize(): Restore from storage, set up system detection, apply initial theme
 * - onDestroy(): Clean up MediaQueryList listeners and state
 * - isInitialized(): Query method for state
 */
export class ThemeService extends BaseServiceImpl {
  private static readonly VALID_SETTINGS: readonly ThemeSetting[] = ['auto', 'light', 'dark'];

  private readonly storage = getPersistentStorage();
  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: Theme = 'light';
  private themeSetting: ThemeSetting = 'auto';
  private readonly listeners: Set<ThemeChangeListener> = new Set();
  private onMediaQueryChange: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null =
    null;

  constructor() {
    super('ThemeService');

    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    }
  }

  /**
   * Service initialization (BaseServiceImpl template method implementation)
   * Restore settings from storage and set up system detection
   */
  protected async onInitialize(): Promise<void> {
    // Restore settings from storage
    await this.restoreThemeSetting();

    // Set up system theme detection
    this.initializeSystemThemeDetection();

    // Apply initial theme
    this.applyCurrentTheme(true);
  }

  /**
   * Restore theme setting
   */
  private async restoreThemeSetting(): Promise<void> {
    let persistentSetting: ThemeSetting | null = null;

    try {
      const savedSetting = await this.storage.get<string>(THEME_STORAGE_KEY);
      persistentSetting = ThemeService.normalizeThemeSetting(savedSetting);
    } catch (error) {
      logger.warn('Failed to restore theme setting from storage:', error);
    }

    const localSetting = ThemeService.readLocalThemeSetting();
    const resolvedSetting = ThemeService.resolveStoredThemeSetting(persistentSetting, localSetting);

    if (!resolvedSetting) {
      return;
    }

    if (
      import.meta.env.DEV &&
      persistentSetting &&
      localSetting &&
      persistentSetting !== localSetting
    ) {
      logger.debug('[ThemeService] Divergent stored theme values detected', {
        persistent: persistentSetting,
        local: localSetting,
        resolved: resolvedSetting,
      });
    }

    this.themeSetting = resolvedSetting;

    if (localSetting !== resolvedSetting) {
      ThemeService.persistLocalThemeSetting(resolvedSetting);
    }

    if (persistentSetting !== resolvedSetting) {
      try {
        await this.storage.set(THEME_STORAGE_KEY, resolvedSetting);
      } catch (error) {
        logger.debug('[ThemeService] Failed to synchronize persistent theme setting:', error);
      }
    }
  }

  private static resolveStoredThemeSetting(
    persistent: ThemeSetting | null,
    local: ThemeSetting | null
  ): ThemeSetting | null {
    if (persistent && local) {
      if (persistent === local) {
        return persistent;
      }

      if (persistent === 'auto' && local !== 'auto') {
        return local;
      }

      if (local === 'auto' && persistent !== 'auto') {
        return persistent;
      }

      return persistent;
    }

    return persistent ?? local;
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

  private static getSafeLocalStorage(): Storage | null {
    try {
      if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
        return null;
      }

      const storage = globalThis.localStorage;
      void storage.length;
      return storage;
    } catch (error) {
      logger.debug('[ThemeService] Local storage access unavailable:', error);
      return null;
    }
  }

  private static readLocalThemeSetting(): ThemeSetting | null {
    const storage = ThemeService.getSafeLocalStorage();
    if (!storage) {
      return null;
    }

    try {
      const rawValue = storage.getItem(THEME_STORAGE_KEY);
      return ThemeService.normalizeThemeSetting(rawValue);
    } catch (error) {
      logger.debug('[ThemeService] Failed to read theme from local storage:', error);
      return null;
    }
  }

  private static persistLocalThemeSetting(setting: ThemeSetting): void {
    const storage = ThemeService.getSafeLocalStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(THEME_STORAGE_KEY, setting);
      logger.debug(`[ThemeService] Persisted to local storage: ${setting}`);
    } catch (error) {
      logger.debug('[ThemeService] Failed to write theme to local storage:', error);
    }
  }

  /**
   * Set up system theme detection
   */
  private initializeSystemThemeDetection(): void {
    if (!this.mediaQueryList) return;

    // Detect system theme changes
    this.onMediaQueryChange = () => {
      if (this.themeSetting === 'auto') {
        this.applyCurrentTheme();
      }
    };

    try {
      this.mediaQueryList.addEventListener('change', this.onMediaQueryChange);
    } catch {
      // Phase 137: Support legacy API (addListener)
      // Use MediaQueryList.addListener on older browsers
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
   * Apply theme based on current setting
   */
  private applyCurrentTheme(force = false): boolean {
    const effectiveTheme = this.getEffectiveTheme();

    if (force || this.currentTheme !== effectiveTheme) {
      this.currentTheme = effectiveTheme;

      // Set data-theme attribute for automatic CSS application
      syncThemeAttributes(this.currentTheme);

      // Notify listeners
      this.notifyListeners();

      logger.debug(`Theme applied: ${this.currentTheme} (setting: ${this.themeSetting})`);

      return true;
    }

    return false;
  }

  /**
   * Notify listeners of theme change
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
   * Set theme manually
   */
  public setTheme(setting: ThemeSetting | string): void {
    const normalized = ThemeService.normalizeThemeSetting(setting) ?? 'light';
    const previousSetting = this.themeSetting;

    this.themeSetting = normalized;

    // Save to storage
    void this.saveThemeSetting();

    // Apply theme
    const themeChanged = this.applyCurrentTheme();

    if (!themeChanged && previousSetting !== this.themeSetting) {
      this.notifyListeners();
    }

    logger.info(`Theme setting changed: ${this.themeSetting}`);
  }

  /**
   * Save theme setting
   */
  private async saveThemeSetting(): Promise<void> {
    ThemeService.persistLocalThemeSetting(this.themeSetting);

    try {
      await this.storage.set(THEME_STORAGE_KEY, this.themeSetting);
    } catch (error) {
      logger.warn('Failed to save theme setting to storage:', error);
    }
  }

  /**
   * Calculate effective theme (returns system theme for auto setting)
   */
  public getEffectiveTheme(): Theme {
    if (this.themeSetting === 'auto') {
      return this.getSystemTheme();
    }
    return this.themeSetting;
  }

  /**
   * Detect system theme
   */
  private getSystemTheme(): Theme {
    if (!this.mediaQueryList) return 'light';
    return this.mediaQueryList.matches ? 'dark' : 'light';
  }

  /**
   * Subscribe to theme change events
   */
  public onThemeChange(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current theme
   */
  public getCurrentTheme(): ThemeSetting {
    return this.themeSetting;
  }

  /**
   * Check if dark mode is active
   */
  public isDarkMode(): boolean {
    return this.getEffectiveTheme() === 'dark';
  }

  /**
   * Service cleanup (BaseServiceImpl template method implementation)
   * Remove MediaQueryList listeners and clean up state
   */
  protected onDestroy(): void {
    if (this.mediaQueryList) {
      try {
        if (this.onMediaQueryChange) {
          this.mediaQueryList.removeEventListener('change', this.onMediaQueryChange);
          // Phase 137: Remove legacy API (removeListener)
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
 * Global singleton instance
 * Phase 230: Export added for BaseService initialization
 */
export const themeService = new ThemeService();
