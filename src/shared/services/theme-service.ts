/**
 * Core Layer - Theme Service
 * System theme detection and application service
 */

import { APP_SETTINGS_STORAGE_KEY } from '@constants/storage';
import { syncThemeAttributes } from '@shared/dom/theme';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { tryGetSettings } from '@shared/services/service-registry';

// Theme types (inlined from theme-service.contract.ts)
export type Theme = 'light' | 'dark';
export type ThemeSetting = 'auto' | Theme;
export interface ThemeSetOptions {
  readonly force?: boolean;
  readonly persist?: boolean;
}
export type ThemeChangeListener = (theme: Theme, setting: ThemeSetting) => void;
export interface SettingsServiceLike {
  get?: (key: string) => unknown;
  set?: (key: string, value: unknown) => Promise<void> | void;
}
export interface ThemeServiceContract {
  initialize(): Promise<void>;
  destroy(): void;
  isInitialized(): boolean;
  getCurrentTheme(): ThemeSetting;
  getEffectiveTheme(): Theme;
  setTheme(setting: ThemeSetting | string, options?: ThemeSetOptions): void;
  isDarkMode(): boolean;
  onThemeChange(listener: ThemeChangeListener): () => void;
  bindSettingsService(settingsService: SettingsServiceLike): void;
}

const VALID_THEME_SETTINGS: readonly ThemeSetting[] = ['light', 'dark', 'auto'];

function isThemeSetting(value: unknown): value is ThemeSetting {
  return typeof value === 'string' && VALID_THEME_SETTINGS.includes(value as ThemeSetting);
}

let _themeInstance: ThemeService | null = null;

export class ThemeService implements ThemeServiceContract {
  private _initialized = false;
  private readonly storage = getPersistentStorage();
  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;
  private domEventsController: AbortController | null = null;
  private currentTheme: Theme = 'light';
  private themeSetting: ThemeSetting = 'auto';
  private readonly listeners: Set<ThemeChangeListener> = new Set();
  private boundSettingsService: SettingsServiceLike | null = null;
  private observer: MutationObserver | null = null;
  private observedThemeScopes: WeakSet<Element> = new WeakSet();

  public static getInstance(): ThemeService {
    if (!_themeInstance) _themeInstance = new ThemeService();
    return _themeInstance;
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    _themeInstance?.destroy();
    _themeInstance = null;
  }

  constructor() {
    this.mediaQueryList = this.createMediaQueryList();
  }

  /** Initialize service (idempotent) */
  public async initialize(): Promise<void> {
    if (this._initialized) return;
    if (!this.boundSettingsService) {
      const settingsService = tryGetSettings();
      if (settingsService) {
        this.bindSettingsService(settingsService);
      } else {
        await this.restoreThemeSettingFromStorage();
      }
    }
    this.initializeThemeScopeObservation();
    this.initializeSystemDetection();
    this.applyCurrentTheme(true);
    this._initialized = true;
  }

  /** Destroy service (idempotent) */
  public destroy(): void {
    this.cleanup();
    this._initialized = false;
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this._initialized;
  }

  public bindSettingsService(settingsService: SettingsServiceLike): void {
    if (!settingsService || this.boundSettingsService === settingsService) {
      return;
    }

    this.boundSettingsService = settingsService;

    const settingsTheme = settingsService.get?.('gallery.theme');
    if (isThemeSetting(settingsTheme) && settingsTheme !== this.themeSetting) {
      this.themeSetting = settingsTheme;
      this.applyCurrentTheme(true);
    }
  }

  public setTheme(setting: ThemeSetting | string, options?: ThemeSetOptions): void {
    const normalized = isThemeSetting(setting) ? setting : 'light';
    this.themeSetting = normalized;

    if (options?.persist !== false && this.boundSettingsService?.set) {
      const result = this.boundSettingsService.set('gallery.theme', this.themeSetting);
      if (result instanceof Promise) {
        result.catch((error: unknown) => {
          if (__DEV__) {
            logger.warn('[ThemeService] Failed to persist theme setting', error);
          }
        });
      }
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

  private applyThemeToScopes(scopes: Element[]): void {
    const newScopes: Element[] = [];
    for (const scope of scopes) {
      if (!this.observedThemeScopes.has(scope)) {
        this.observedThemeScopes.add(scope);
        newScopes.push(scope);
      }
    }

    if (newScopes.length > 0) {
      syncThemeAttributes(this.currentTheme, { scopes: newScopes });
    }
  }

  private createMediaQueryList(): MediaQueryList | null {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
  }

  private async restoreThemeSettingFromStorage(): Promise<void> {
    const saved = await this.loadThemeAsync();
    if (saved && saved !== this.themeSetting) {
      this.themeSetting = saved;
      this.applyCurrentTheme(true);
    }
  }

  private initializeThemeScopeObservation(): void {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
      return;
    }

    this.applyThemeToScopes(Array.from(document.querySelectorAll('.xeg-theme-scope')));

    this.observer?.disconnect();
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }

          const scopes: Element[] = [];
          if (node.classList.contains('xeg-theme-scope')) {
            scopes.push(node);
          }
          node.querySelectorAll('.xeg-theme-scope').forEach((scope) => {
            scopes.push(scope);
          });

          if (scopes.length > 0) {
            this.applyThemeToScopes(scopes);
          }
        });
      }
    });

    if (document.body) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      return;
    }

    if (__DEV__) {
      logger.warn('[ThemeService] document.body not available for observation');
    }
  }

  private cleanup(): void {
    this.boundSettingsService = null;
    this.listeners.clear();
    this.observedThemeScopes = new WeakSet();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.domEventsController) {
      this.domEventsController.abort();
      this.domEventsController = null;
    }

    this.mediaQueryListener = null;
    this.mediaQueryList = null;
  }

  private initializeSystemDetection(): void {
    if (!this.mediaQueryList) {
      this.mediaQueryList = this.createMediaQueryList();
    }
    if (!this.mediaQueryList || this.mediaQueryListener) {
      return;
    }

    if (!this.domEventsController || this.domEventsController.signal.aborted) {
      this.domEventsController = new AbortController();
    }

    this.mediaQueryListener = () => {
      if (this.themeSetting === 'auto') {
        this.applyCurrentTheme();
      }
    };

    const listener = this.mediaQueryListener;
    const eventListener: EventListener = (event) => {
      listener(event as MediaQueryListEvent);
    };

    EventManager.getInstance().addEventListener(this.mediaQueryList, 'change', eventListener, {
      signal: this.domEventsController.signal,
      context: 'theme-service',
    });
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
    this.listeners.forEach((listener) => listener(this.currentTheme, this.themeSetting));
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
