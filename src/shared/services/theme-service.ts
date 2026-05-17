/**
 * @fileoverview Theme service: system theme detection and application
 */

import { tryGetSettings } from '@shared/container/settings-registry';
import { syncThemeAttributes } from '@shared/dom/theme';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';

export type Theme = 'light' | 'dark';
export type ThemeSetting = 'auto' | Theme;
export type ThemeChangeListener = (theme: Theme, setting: ThemeSetting) => void;

const VALID_THEME_SETTINGS: readonly string[] = ['light', 'dark', 'auto'];

function isThemeSetting(value: unknown): value is ThemeSetting {
  return typeof value === 'string' && VALID_THEME_SETTINGS.includes(value);
}

interface SettingsBinding {
  get(key: string): unknown;
  set(key: string, value: unknown): Promise<void> | void;
}

let _themeInstance: ThemeService | null = null;

export class ThemeService {
  private _initialized = false;
  private currentTheme: Theme = 'light';
  private themeSetting: ThemeSetting = 'auto';
  private readonly listeners: Set<ThemeChangeListener> = new Set();
  private settings: SettingsBinding | null = null;
  private observedThemeScopes: WeakSet<Element> = new WeakSet();
  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;
  private domEventsController: AbortController | null = null;
  private observer: MutationObserver | null = null;

  static getInstance(): ThemeService {
    if (!_themeInstance) _themeInstance = new ThemeService();
    return _themeInstance;
  }

  static resetForTests(): void {
    _themeInstance?.destroy();
    _themeInstance = null;
  }

  constructor() {
    this.mediaQueryList =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
  }

  async initialize(): Promise<void> {
    if (this._initialized) return;

    const svc = tryGetSettings();
    if (svc) {
      this.settings = {
        get: (key: string) => svc.get(key),
        set: (key: string, value: unknown) => svc.set(key, value),
      };
    }

    this.initializeThemeScopeObservation();
    this.initializeSystemDetection();
    this.applyCurrentTheme(true);
    this._initialized = true;
  }

  destroy(): void {
    this.cleanup();
    this._initialized = false;
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  bindSettingsService(svc: SettingsBinding): void {
    if (!svc || this.settings === svc) return;
    this.settings = svc;

    const settingsTheme = svc.get('gallery.theme');
    if (isThemeSetting(settingsTheme) && settingsTheme !== this.themeSetting) {
      this.themeSetting = settingsTheme;
      this.applyCurrentTheme(true);
    }
  }

  setTheme(setting: ThemeSetting | string, options?: { force?: boolean; persist?: boolean }): void {
    const normalized = isThemeSetting(setting) ? setting : 'light';
    this.themeSetting = normalized;

    if (options?.persist !== false && this.settings) {
      const result = this.settings.set('gallery.theme', this.themeSetting);
      if (result instanceof Promise) {
        result.catch((error: unknown) => {
          __DEV__ && logger.warn('[ThemeService] Failed to persist theme', error);
        });
      }
    }

    this.applyCurrentTheme(options?.force);
    this.notifyListeners();
  }

  getEffectiveTheme(): Theme {
    if (this.themeSetting === 'auto') {
      return this.mediaQueryList?.matches ? 'dark' : 'light';
    }
    return this.themeSetting;
  }

  getCurrentTheme(): ThemeSetting {
    return this.themeSetting;
  }

  isDarkMode(): boolean {
    return this.getEffectiveTheme() === 'dark';
  }

  onThemeChange(listener: ThemeChangeListener): () => void {
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

  private initializeThemeScopeObservation(): void {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

    this.applyThemeToScopes(Array.from(document.querySelectorAll('.xeg-theme-scope')));

    this.observer?.disconnect();
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          const scopes: Element[] = [];
          if (node.classList.contains('xeg-theme-scope')) scopes.push(node);
          node.querySelectorAll('.xeg-theme-scope').forEach((scope) => scopes.push(scope));
          if (scopes.length > 0) this.applyThemeToScopes(scopes);
        });
      }
    });

    if (document.body) {
      this.observer.observe(document.body, { childList: true, subtree: true });
    } else {
      __DEV__ && logger.warn('[ThemeService] document.body not available');
    }
  }

  private cleanup(): void {
    this.settings = null;
    this.listeners.clear();
    this.observedThemeScopes = new WeakSet();
    this.observer?.disconnect();
    this.observer = null;
    this.domEventsController?.abort();
    this.domEventsController = null;
    this.mediaQueryListener = null;
    this.mediaQueryList = null;
  }

  private initializeSystemDetection(): void {
    if (!this.mediaQueryList || this.mediaQueryListener) return;

    if (!this.domEventsController || this.domEventsController.signal.aborted) {
      this.domEventsController = new AbortController();
    }

    this.mediaQueryListener = () => {
      if (this.themeSetting === 'auto') this.applyCurrentTheme(true);
    };

    EventManager.getInstance().addEventListener(
      this.mediaQueryList,
      'change',
      (event) => this.mediaQueryListener!(event as MediaQueryListEvent),
      { signal: this.domEventsController.signal, context: 'theme-service' }
    );
  }

  private applyCurrentTheme(force = false): void {
    const effective = this.getEffectiveTheme();
    if (force || this.currentTheme !== effective) {
      this.currentTheme = effective;
      syncThemeAttributes(this.currentTheme);
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentTheme, this.themeSetting);
      } catch (error) {
        __DEV__ && logger.warn('[ThemeService] Listener error', error);
      }
    }
  }
}
