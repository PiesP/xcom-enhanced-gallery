/**
 * Core Layer - Theme Service
 * System theme detection and application service
 * @version 4.0.0 - Simplified
 */

import { APP_SETTINGS_STORAGE_KEY } from '@constants';
import { syncThemeAttributes } from '@shared/dom/theme';
import { logger } from '@shared/logging';
import { BaseServiceImpl } from '@shared/services/base-service';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import type {
  SettingsServiceLike,
  Theme,
  ThemeChangeListener,
  ThemeServiceContract,
  ThemeSetOptions,
  ThemeSetting,
} from '@shared/services/theme-service.contract';
import { createSingleton } from '@shared/utils/types/singleton';

export class ThemeService extends BaseServiceImpl implements ThemeServiceContract {
  private readonly storage = getPersistentStorage();
  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: Theme = 'light';
  private themeSetting: ThemeSetting = 'auto';
  private readonly listeners: Set<ThemeChangeListener> = new Set();
  private boundSettingsService: SettingsServiceLike | null = null;
  private settingsUnsubscribe: (() => void) | null = null;
  private observer: MutationObserver | null = null;

  private static readonly singleton = createSingleton(() => new ThemeService());

  public static getInstance(): ThemeService {
    return ThemeService.singleton.get();
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    ThemeService.singleton.reset();
  }

  constructor() {
    super('ThemeService');
    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          m.addedNodes.forEach(node => {
            if (node instanceof Element) {
              if (node.classList.contains('xeg-theme-scope')) {
                syncThemeAttributes(this.currentTheme, { scopes: [node] });
              }
              node.querySelectorAll('.xeg-theme-scope').forEach(scope => {
                syncThemeAttributes(this.currentTheme, { scopes: [scope] });
              });
            }
          });
        }
      });

      if (document.documentElement) {
        this.observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      } else {
        logger.warn('[ThemeService] document.documentElement not available for observation');
      }
    }
    // Initial load (sync if possible)
    this.themeSetting = this.loadThemeSync();
    this.applyCurrentTheme(true);

    // Schedule async restore to match legacy behavior
    void Promise.resolve().then(async () => {
      const saved = await this.loadThemeAsync();
      if (saved && saved !== this.themeSetting) {
        this.themeSetting = saved;
        this.applyCurrentTheme(true);
      }
      this.initializeSystemDetection();
    });
  }

  protected async onInitialize(): Promise<void> {
    // Ensure async restore is done if not already
    const saved = await this.loadThemeAsync();
    if (saved && saved !== this.themeSetting) {
      this.themeSetting = saved;
      this.applyCurrentTheme(true);
    }

    this.initializeSystemDetection();

    try {
      const { tryGetSettingsManager } = await import('@shared/container/service-accessors');
      const settingsService = tryGetSettingsManager() as SettingsServiceLike | null;
      if (settingsService) {
        this.bindSettingsService(settingsService);
      }
    } catch (err) {
      logger.debug('[ThemeService] SettingsService not available', err);
    }
  }

  public bindSettingsService(settingsService: SettingsServiceLike): void {
    if (!settingsService || this.boundSettingsService === settingsService) return;

    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
    }

    this.boundSettingsService = settingsService;

    // Sync initial
    const settingsTheme = settingsService.get?.('gallery.theme') as ThemeSetting | undefined;
    if (settingsTheme && ['light', 'dark', 'auto'].includes(settingsTheme)) {
      if (settingsTheme !== this.themeSetting) {
        this.themeSetting = settingsTheme;
        this.applyCurrentTheme(true);
      }
    }

    if (typeof settingsService.subscribe === 'function') {
      this.settingsUnsubscribe = settingsService.subscribe(event => {
        if (event?.key === 'gallery.theme') {
          const newVal = event.newValue as ThemeSetting;
          if (['light', 'dark', 'auto'].includes(newVal) && newVal !== this.themeSetting) {
            this.themeSetting = newVal;
            this.applyCurrentTheme();
          }
        }
      });
    }
  }

  public setTheme(setting: ThemeSetting | string, options?: ThemeSetOptions): void {
    const validSettings: ThemeSetting[] = ['light', 'dark', 'auto'];
    const normalized = validSettings.includes(setting as ThemeSetting)
      ? (setting as ThemeSetting)
      : 'light';
    this.themeSetting = normalized;

    if (options?.persist !== false && this.boundSettingsService?.set) {
      void this.boundSettingsService.set('gallery.theme', this.themeSetting);
    }

    const notified = this.applyCurrentTheme(options?.force);
    if (!notified) {
      this.notifyListeners();
    }
  }

  public getEffectiveTheme(): Theme {
    if (this.themeSetting === 'auto') {
      return this.mediaQueryList?.matches ? 'dark' : 'light';
    }
    return this.themeSetting;
  }

  public getCurrentTheme(): ThemeSetting {
    return this.themeSetting;
  }

  public isDarkMode(): boolean {
    return this.getEffectiveTheme() === 'dark';
  }

  public onThemeChange(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected onDestroy(): void {
    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
    }
    this.listeners.clear();
    this.observer?.disconnect();
    // MediaQueryList listener cleanup if needed, but usually fine to leave as service is singleton
  }

  private initializeSystemDetection(): void {
    if (this.mediaQueryList) {
      this.mediaQueryList.addEventListener('change', () => {
        if (this.themeSetting === 'auto') {
          this.applyCurrentTheme();
        }
      });
    }
  }

  private applyCurrentTheme(force = false): boolean {
    const effective = this.getEffectiveTheme();
    if (force || this.currentTheme !== effective) {
      this.currentTheme = effective;
      syncThemeAttributes(this.currentTheme);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.currentTheme, this.themeSetting));
  }

  private loadThemeSync(): ThemeSetting {
    try {
      const snapshot = this.storage.getSync<{
        gallery?: { theme?: ThemeSetting };
      }>(APP_SETTINGS_STORAGE_KEY);
      return snapshot?.gallery?.theme ?? 'auto';
    } catch {
      return 'auto';
    }
  }

  private async loadThemeAsync(): Promise<ThemeSetting | null> {
    try {
      const snapshot = await this.storage.get<{
        gallery?: { theme?: ThemeSetting };
      }>(APP_SETTINGS_STORAGE_KEY);
      return snapshot?.gallery?.theme ?? null;
    } catch {
      return null;
    }
  }
}

export type {
  SettingsServiceLike,
  Theme,
  ThemeChangeListener,
  ThemeServiceContract,
  ThemeSetOptions,
  ThemeSetting,
} from './theme-service.contract';
