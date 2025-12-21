/**
 * Core Layer - Theme Service
 * System theme detection and application service
 * @version 5.0.0 - Composition-based lifecycle
 */

import { SERVICE_KEYS } from '@constants/service-keys';
import { APP_SETTINGS_STORAGE_KEY } from '@constants/storage';
import { syncThemeAttributes } from '@shared/dom/theme';
import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';
import type { Lifecycle } from '@shared/services/lifecycle';
import { createLifecycle } from '@shared/services/lifecycle';
import { getPersistentStorage } from '@shared/services/persistent-storage';
import { CoreService } from '@shared/services/service-manager';
import type {
  SettingsServiceLike,
  Theme,
  ThemeChangeListener,
  ThemeServiceContract,
  ThemeSetOptions,
  ThemeSetting,
} from '@shared/services/theme-service.contract';
import { createSingleton } from '@shared/utils/types/singleton';

export class ThemeService implements ThemeServiceContract {
  private readonly lifecycle: Lifecycle;
  private readonly storage = getPersistentStorage();
  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;
  private domEventsController: AbortController | null = null;
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

  /** Track whether the early restore encountered an error. */
  private earlyRestoreFailed = false;

  /** Hold the early restore promise to avoid untracked async work. */
  private earlyRestorePromise: Promise<void> | null = null;

  /** Ensure cleanup runs at most once per instance. */
  private didCleanup = false;

  constructor() {
    this.lifecycle = createLifecycle('ThemeService', {
      onInitialize: () => this.onInitialize(),
      onDestroy: () => this.onDestroy(),
    });

    if (typeof window !== 'undefined') {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              if (node.classList.contains('xeg-theme-scope')) {
                syncThemeAttributes(this.currentTheme, { scopes: [node] });
              }
              node.querySelectorAll('.xeg-theme-scope').forEach((scope) => {
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
    // Initial load (sync if possible) - immediate, non-blocking
    this.themeSetting = this.loadThemeSync();
    this.applyCurrentTheme(true);

    // Schedule early async restore (before initialize() is called)
    // This ensures theme is applied ASAP even before full initialization
    this.scheduleEarlyAsyncRestore();
  }

  /**
   * Schedule early async theme restore.
   * Separated from constructor for better testability and clarity.
   * @internal
   */
  private scheduleEarlyAsyncRestore(): void {
    if (this.earlyRestorePromise) {
      return;
    }

    this.earlyRestorePromise = (async () => {
      try {
        const saved = await this.loadThemeAsync();
        if (saved && saved !== this.themeSetting) {
          this.themeSetting = saved;
          this.applyCurrentTheme(true);
        }
      } catch (error) {
        this.earlyRestoreFailed = true;
        logger.warn('[ThemeService] Early async theme restore failed', error);
      } finally {
        // Always enable system theme detection, even if the early async restore
        // fails midway. Initialization will be skipped once this flag is set.
        try {
          this.initializeSystemDetection();
        } catch (error) {
          logger.debug('[ThemeService] System theme detection initialization failed', error);
        }
      }
    })();
  }

  /** Initialize service (idempotent, fail-fast on error) */
  public async initialize(): Promise<void> {
    return this.lifecycle.initialize();
  }

  /** Destroy service (idempotent, graceful on error) */
  public destroy(): void {
    // Ensure we clean up constructor-time side effects even if initialize() was never called.
    this.cleanupOnce();
    this.lifecycle.destroy();
  }

  /** Check if service is initialized */
  public isInitialized(): boolean {
    return this.lifecycle.isInitialized();
  }

  private async onInitialize(): Promise<void> {
    // Ensure the constructor-scheduled early restore has completed.
    await (this.earlyRestorePromise ?? Promise.resolve());

    // If early restore failed, attempt a best-effort restore again during initialization.
    if (this.earlyRestoreFailed) {
      const saved = await this.loadThemeAsync();
      if (saved && saved !== this.themeSetting) {
        this.themeSetting = saved;
        this.applyCurrentTheme(true);
      }
    }

    try {
      const settingsService = CoreService.getInstance().tryGet<SettingsServiceLike>(
        SERVICE_KEYS.SETTINGS
      );
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
      this.settingsUnsubscribe = settingsService.subscribe((event) => {
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
      const result = this.boundSettingsService.set('gallery.theme', this.themeSetting);
      if (result instanceof Promise) {
        result.catch((error: unknown) => {
          logger.warn('[ThemeService] Failed to persist theme setting', error);
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

  private onDestroy(): void {
    this.cleanupOnce();
  }

  private cleanupOnce(): void {
    if (this.didCleanup) {
      return;
    }
    this.didCleanup = true;

    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
      this.settingsUnsubscribe = null;
    }
    this.listeners.clear();

    // MutationObserver cleanup
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Abort-managed DOM listeners cleanup
    if (this.domEventsController) {
      this.domEventsController.abort();
      this.domEventsController = null;
    }

    // MediaQueryList listener cleanup
    this.mediaQueryListener = null;
    this.mediaQueryList = null;
  }

  private initializeSystemDetection(): void {
    if (this.mediaQueryList && !this.mediaQueryListener) {
      if (!this.domEventsController || this.domEventsController.signal.aborted) {
        this.domEventsController = new AbortController();
      }

      this.mediaQueryListener = () => {
        if (this.themeSetting === 'auto') {
          this.applyCurrentTheme();
        }
      };

      const listener = this.mediaQueryListener;
      if (!listener) {
        // Defensive: should never happen because we just assigned it above.
        return;
      }

      const eventListener: EventListener = (evt) => {
        listener(evt as MediaQueryListEvent);
      };

      EventManager.getInstance().addEventListener(this.mediaQueryList, 'change', eventListener, {
        signal: this.domEventsController.signal,
        context: 'theme-service',
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
    this.listeners.forEach((l) => l(this.currentTheme, this.themeSetting));
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
