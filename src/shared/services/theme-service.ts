/**
 * Core Layer - Theme Service
 *
 * System theme detection and application service
 * @version 3.3.0 - Phase 420: Complete Tampermonkey migration (localStorage removed)
 */

import { THEME_STORAGE_KEY } from "@shared/constants";
import { APP_SETTINGS_STORAGE_KEY } from "@/constants";
import { logger } from "@shared/logging";
import { getPersistentStorage } from "./persistent-storage";
import { BaseServiceImpl } from "./base-service";
import { syncThemeAttributes } from "@shared/utils/theme-dom";
import type {
  Theme,
  ThemeSetting,
  ThemeSetOptions,
  ThemeChangeListener,
  SettingsServiceLike,
  ThemeServiceContract,
} from "./theme-service.contract";

const getMutationObserverCtor = (): typeof MutationObserver | undefined => {
  if (typeof MutationObserver !== "undefined") {
    return MutationObserver;
  }

  if (
    typeof window !== "undefined" &&
    typeof window.MutationObserver !== "undefined"
  ) {
    return window.MutationObserver;
  }

  return undefined;
};

/**
 * Resolve stored theme preference by coalescing SettingsService and legacy storage values.
 *
 * Priority order:
 * 1. Honor explicit light/dark selections from application settings.
 * 2. Otherwise, fall back to legacy storage when it contains an explicit selection.
 * 3. If no explicit selections exist, return whichever value (including 'auto') is available first.
 */
export function resolveStoredThemePreference(
  settingsTheme?: ThemeSetting | null,
  legacyTheme?: ThemeSetting | null,
): ThemeSetting | null {
  const isExplicit = (value?: ThemeSetting | null): value is Theme =>
    value === "light" || value === "dark";

  if (isExplicit(settingsTheme)) {
    return settingsTheme;
  }

  if (isExplicit(legacyTheme)) {
    return legacyTheme;
  }

  return settingsTheme ?? legacyTheme ?? null;
}

type ThemeSettingsSnapshot = {
  gallery?: {
    theme?: ThemeSetting | string | null;
  } | null;
} | null;

/**
 * System Theme Service - Phase 360: Direct PersistentStorage usage
 *
 * Phase A5.1: Applying BaseServiceImpl pattern (standardizing lifecycle management)
 * - onInitialize(): Restore from storage, set up system detection, apply initial theme
 * - onDestroy(): Clean up MediaQueryList listeners and state
 * - isInitialized(): Query method for state
 */
export class ThemeService
  extends BaseServiceImpl
  implements ThemeServiceContract
{
  private static readonly VALID_SETTINGS: readonly ThemeSetting[] = [
    "auto",
    "light",
    "dark",
  ];

  private readonly storage = getPersistentStorage();
  private mediaQueryList: MediaQueryList | null = null;
  private currentTheme: Theme = "light";
  private themeSetting: ThemeSetting;
  private readonly listeners: Set<ThemeChangeListener> = new Set();
  private settingsUnsubscribe: (() => void) | null = null;
  private boundSettingsService: SettingsServiceLike | null = null;
  private onMediaQueryChange:
    | ((this: MediaQueryList, ev: MediaQueryListEvent) => void)
    | null = null;
  private scopeObserver: MutationObserver | null = null;

  constructor() {
    super("ThemeService");

    if (typeof window !== "undefined") {
      this.mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    }

    this.themeSetting = this.loadPersistedThemeSetting();

    // Apply initial theme immediately (whether loaded from storage or default 'auto')
    // This prevents FOUC by applying the theme before the async initialization phase
    this.applyCurrentTheme(true);
    this.ensureScopeObserverInitialized();

    // Schedule an async restore to re-apply persisted theme if the synchronous read fell back
    // (e.g., GM_getValue returns a Promise in some environments). We intentionally do not await
    // this here to avoid blocking service construction; this will ensure persisted theme is
    // applied as soon as the storage API resolves.
    void Promise.resolve().then(async () => {
      try {
        await this.restoreThemeSetting();
        // Ensure we have system detection initialized and re-apply theme after restore
        this.initializeSystemThemeDetection();
        this.applyCurrentTheme(true);
      } catch (err) {
        logger.debug(
          "[ThemeService] Async restore failed during constructor scheduled task",
          err,
        );
      }
    });
  }

  /**
   * Service initialization (BaseServiceImpl template method implementation)
   * Restore settings from storage and set up system detection
   */
  protected async onInitialize(): Promise<void> {
    this.ensureScopeObserverInitialized();

    // Restore settings from storage
    await this.restoreThemeSetting();

    // Set up system theme detection
    this.initializeSystemThemeDetection();

    // Apply initial theme
    this.applyCurrentTheme(true);

    // Attempt to subscribe to SettingsService changes to keep ThemeService in sync
    try {
      const { tryGetSettingsManager } = await import(
        "@shared/container/service-accessors"
      );
      const settingsService =
        tryGetSettingsManager() as SettingsServiceLike | null;

      if (settingsService) {
        this.bindSettingsService(settingsService);
      }
    } catch (err) {
      // No settings service available or import failed; ignore and continue
      logger.debug(
        "[ThemeService] SettingsService subscription not available",
        err,
      );
    }
  }

  /**
   * Bind to SettingsService for two-way sync
   * Called by GalleryApp when SettingsService is ready
   */
  public bindSettingsService(settingsService: SettingsServiceLike): void {
    if (!settingsService) {
      return;
    }

    const isSameService =
      this.boundSettingsService === settingsService &&
      Boolean(this.settingsUnsubscribe);
    if (isSameService) {
      return;
    }

    if (this.settingsUnsubscribe) {
      logger.debug(
        "[ThemeService] Rebinding to updated SettingsService instance",
      );
      this.detachSettingsBinding();
    }

    this.boundSettingsService = settingsService;

    // Sync initial value
    try {
      const settingsTheme = settingsService.get?.("gallery.theme");
      const normalized = ThemeService.normalizeThemeSetting(settingsTheme);

      if (normalized) {
        // Phase 420 Fix Enhanced: Prioritize explicit themes over 'auto'
        // This prevents the "auto overrides specific mode" issue on first launch
        const currentIsExplicit =
          this.themeSetting === "light" || this.themeSetting === "dark";
        const settingsIsExplicit =
          normalized === "light" || normalized === "dark";
        const settingsHasDefaultAuto = normalized === "auto";

        if (settingsHasDefaultAuto && currentIsExplicit) {
          // SettingsService has default 'auto' but we have explicit theme from legacy storage
          logger.debug(
            `[ThemeService] Preserving legacy theme '${this.themeSetting}' over SettingsService default 'auto'`,
          );
          // Sync our explicit theme back to SettingsService so it persists there too
          if (typeof settingsService.set === "function") {
            void settingsService.set("gallery.theme", this.themeSetting);
          }
        } else if (settingsIsExplicit && !currentIsExplicit) {
          // SettingsService has explicit theme but we have 'auto' (constructor fallback)
          logger.debug(
            `[ThemeService] Adopting explicit SettingsService theme '${normalized}' over current 'auto'`,
          );
          this.themeSetting = normalized;
          this.applyCurrentTheme(true);
        } else if (normalized !== this.themeSetting) {
          // Both are explicit or both are 'auto', but different
          this.themeSetting = normalized;
          this.applyCurrentTheme(true);
          logger.debug(
            `[ThemeService] Synced theme from SettingsService: ${normalized}`,
          );
        }
      } else {
        // No valid theme in SettingsService, persist current theme to it
        if (
          typeof settingsService.set === "function" &&
          this.themeSetting !== "auto"
        ) {
          logger.debug(
            `[ThemeService] Persisting current theme '${this.themeSetting}' to SettingsService`,
          );
          void settingsService.set("gallery.theme", this.themeSetting);
        }
      }
    } catch (err) {
      logger.debug(
        "[ThemeService] Failed to sync theme from SettingsService",
        err,
      );
    }

    const canSubscribe = typeof settingsService.subscribe === "function";
    if (canSubscribe) {
      // Subscribe to changes
      const unsubscribe = settingsService.subscribe?.((event) => {
        try {
          if (event?.key === "gallery.theme") {
            const normalized =
              ThemeService.normalizeThemeSetting(event.newValue) ?? "auto";
            if (normalized !== this.themeSetting) {
              this.themeSetting = normalized;
              void this.saveThemeSetting();
              this.applyCurrentTheme();
            }
          }
        } catch (err) {
          logger.warn(
            "[ThemeService] Error handling SettingsService theme change",
            err,
          );
        }
      });

      this.settingsUnsubscribe = unsubscribe ?? null;
      logger.debug("[ThemeService] Bound to SettingsService");
    } else {
      this.settingsUnsubscribe = null;
      logger.debug(
        "[ThemeService] SettingsService lacks subscribe support; operating in snapshot mode",
      );
    }
  }

  /**
   * Restore theme setting (Phase 420: PersistentStorage only)
   */
  private async restoreThemeSetting(): Promise<void> {
    const saved = await this.loadThemeFromStorage();
    if (saved) {
      const previousSetting = this.themeSetting;
      this.themeSetting = saved;
      logger.debug(`[ThemeService] Restored theme setting: ${saved}`);

      // Phase 420 Fix Enhanced: Apply restored theme immediately if different
      if (previousSetting !== saved) {
        logger.info(
          `[ThemeService] Theme changed during async restore: '${previousSetting}' → '${saved}'`,
        );
        this.applyCurrentTheme(true);
      }

      // Sync restored theme to SettingsService if SettingsService has default 'auto' or missing
      // This handles the case where sync load failed (defaulting to 'auto') but async restore succeeded.
      if (this.boundSettingsService?.get && this.boundSettingsService?.set) {
        const currentSettingsTheme =
          this.boundSettingsService.get("gallery.theme");
        const normalizedSettingsTheme =
          ThemeService.normalizeThemeSetting(currentSettingsTheme);
        const savedIsExplicit = saved === "light" || saved === "dark";
        const settingsIsAutoOrMissing =
          !normalizedSettingsTheme || normalizedSettingsTheme === "auto";

        if (savedIsExplicit && settingsIsAutoOrMissing) {
          logger.info(
            `[ThemeService] Syncing explicit restored theme '${saved}' to SettingsService (was '${normalizedSettingsTheme || "missing"}')`,
          );
          void this.boundSettingsService.set("gallery.theme", saved);
        }
      }
    }
  }

  private async loadThemeFromStorage(): Promise<ThemeSetting | null> {
    const [settingsTheme, legacyTheme] = await Promise.all([
      this.readThemeFromSettingsAsync(),
      this.readLegacyThemeSettingAsync(),
    ]);

    return resolveStoredThemePreference(settingsTheme, legacyTheme);
  }

  private static normalizeThemeSetting(value: unknown): ThemeSetting | null {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (ThemeService.VALID_SETTINGS.includes(trimmed as ThemeSetting)) {
        return trimmed as ThemeSetting;
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (
          typeof parsed === "string" &&
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
   * Set up system theme detection
   */
  private initializeSystemThemeDetection(): void {
    if (!this.mediaQueryList) return;

    // Detect system theme changes
    this.onMediaQueryChange = () => {
      if (this.themeSetting === "auto") {
        this.applyCurrentTheme();
      }
    };

    try {
      this.mediaQueryList.addEventListener("change", this.onMediaQueryChange);
    } catch {
      // Phase 137: Support legacy API (addListener)
      // Use MediaQueryList.addListener on older browsers
      try {
        const legacyHandler = this.onMediaQueryChange as unknown as (
          this: MediaQueryList,
          ev: MediaQueryListEvent,
        ) => void;
        this.mediaQueryList.addListener(legacyHandler);
      } catch {
        // ignore
      }
    }

    logger.info("System theme detection initialized");
  }

  /**
   * Apply theme based on current setting
   */
  private applyCurrentTheme(force = false): boolean {
    const effectiveTheme = this.getEffectiveTheme();

    if (force || this.currentTheme !== effectiveTheme) {
      this.currentTheme = effectiveTheme;

      // Update gallery theme scopes without mutating the host document root
      this.refreshThemeScopes();

      // Notify listeners
      this.notifyListeners();

      logger.debug(
        `Theme applied: ${this.currentTheme} (setting: ${this.themeSetting})`,
      );

      return true;
    }

    return false;
  }

  /**
   * Notify listeners of theme change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentTheme, this.themeSetting);
      } catch (error) {
        logger.warn("Theme change listener error:", error);
      }
    });
  }

  /**
   * Set theme manually
   */
  public setTheme(
    setting: ThemeSetting | string,
    options?: ThemeSetOptions,
  ): void {
    const normalized = ThemeService.normalizeThemeSetting(setting) ?? "light";
    const previousSetting = this.themeSetting;

    this.themeSetting = normalized;

    // Save to storage when persistence is enabled (default behavior)
    if (options?.persist !== false) {
      void this.saveThemeSetting();
    }

    // Apply theme
    const shouldForceApply = options?.force === true;
    const themeChanged = this.applyCurrentTheme(shouldForceApply);

    if (
      !themeChanged &&
      (shouldForceApply || previousSetting !== this.themeSetting)
    ) {
      this.notifyListeners();
    }

    logger.info(`Theme setting changed: ${this.themeSetting}`);
  }

  /**
   * Save theme setting (Phase 420: PersistentStorage only)
   */
  private async saveThemeSetting(): Promise<void> {
    try {
      await this.storage.set(THEME_STORAGE_KEY, this.themeSetting);
      logger.debug(`[ThemeService] Saved theme setting: ${this.themeSetting}`);
    } catch (error) {
      logger.warn("Failed to save theme setting to storage:", error);
    }
  }

  /**
   * Calculate effective theme (returns system theme for auto setting)
   */
  public getEffectiveTheme(): Theme {
    if (this.themeSetting === "auto") {
      return this.getSystemTheme();
    }
    return this.themeSetting;
  }

  /**
   * Detect system theme
   */
  private getSystemTheme(): Theme {
    if (!this.mediaQueryList) return "light";
    return this.mediaQueryList.matches ? "dark" : "light";
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
    return this.getEffectiveTheme() === "dark";
  }

  /**
   * Service cleanup (BaseServiceImpl template method implementation)
   * Remove MediaQueryList listeners and clean up state
   */
  protected onDestroy(): void {
    if (this.mediaQueryList) {
      try {
        if (this.onMediaQueryChange) {
          this.mediaQueryList.removeEventListener(
            "change",
            this.onMediaQueryChange,
          );
          // Phase 137: Remove legacy API (removeListener)
          const legacyHandler = this.onMediaQueryChange as unknown as (
            this: MediaQueryList,
            ev: MediaQueryListEvent,
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
    if (this.scopeObserver) {
      this.scopeObserver.disconnect();
      this.scopeObserver = null;
    }

    // Unsubscribe from settings change events if subscribed
    this.detachSettingsBinding();
  }

  private detachSettingsBinding(): void {
    if (this.settingsUnsubscribe) {
      try {
        this.settingsUnsubscribe();
      } catch (error) {
        logger.debug(
          "[ThemeService] SettingsService unsubscribe failed",
          error,
        );
      }
      this.settingsUnsubscribe = null;
    }

    this.boundSettingsService = null;
  }

  private loadPersistedThemeSetting(): ThemeSetting {
    const settingsTheme = this.readThemeFromSettingsSync();
    const legacyTheme = this.readLegacyThemeSettingSync();
    const resolvedTheme = resolveStoredThemePreference(
      settingsTheme,
      legacyTheme,
    );

    if (resolvedTheme) {
      const source =
        resolvedTheme === settingsTheme
          ? "settings snapshot"
          : "legacy storage";
      logger.debug(
        `[ThemeService] Loaded theme from ${source}: ${resolvedTheme}`,
      );
      return resolvedTheme;
    }

    logger.debug("[ThemeService] No stored theme found, falling back to auto");
    return "auto";
  }

  private readThemeFromSettingsSync(): ThemeSetting | null {
    try {
      const snapshot = this.storage.getSync<ThemeSettingsSnapshot>(
        APP_SETTINGS_STORAGE_KEY,
      );
      return ThemeService.extractThemeFromSettingsSnapshot(snapshot);
    } catch (error) {
      logger.debug(
        "[ThemeService] Failed to read theme from settings synchronously:",
        error,
      );
      return null;
    }
  }

  private async readThemeFromSettingsAsync(): Promise<ThemeSetting | null> {
    try {
      const snapshot = await this.storage.get<ThemeSettingsSnapshot>(
        APP_SETTINGS_STORAGE_KEY,
      );
      return ThemeService.extractThemeFromSettingsSnapshot(snapshot);
    } catch (error) {
      logger.debug("[ThemeService] Failed to read theme from settings:", error);
      return null;
    }
  }

  private readLegacyThemeSettingSync(): ThemeSetting | null {
    try {
      const savedSetting = this.storage.getSync<string>(THEME_STORAGE_KEY);
      return ThemeService.normalizeThemeSetting(savedSetting);
    } catch (error) {
      logger.debug(
        "[ThemeService] Failed to load legacy theme synchronously:",
        error,
      );
      return null;
    }
  }

  private async readLegacyThemeSettingAsync(): Promise<ThemeSetting | null> {
    try {
      const savedSetting = await this.storage.get<string>(THEME_STORAGE_KEY);
      return ThemeService.normalizeThemeSetting(savedSetting);
    } catch (error) {
      logger.warn(
        "Failed to restore theme setting from legacy storage:",
        error,
      );
      return null;
    }
  }

  private static extractThemeFromSettingsSnapshot(
    snapshot?: ThemeSettingsSnapshot,
  ): ThemeSetting | null {
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }

    const candidate = snapshot.gallery?.theme;
    if (candidate === undefined || candidate === null) {
      return null;
    }

    return ThemeService.normalizeThemeSetting(candidate);
  }

  private refreshThemeScopes(
    scopes?: Iterable<Element> | ArrayLike<Element>,
  ): void {
    if (typeof scopes === "undefined") {
      syncThemeAttributes(this.currentTheme);
      return;
    }

    syncThemeAttributes(this.currentTheme, {
      scopes,
    });
  }

  private ensureScopeObserverInitialized(): void {
    if (typeof document === "undefined") {
      return;
    }

    const MutationObserverCtor = getMutationObserverCtor();
    if (!MutationObserverCtor) {
      logger.debug(
        "[ThemeService] MutationObserver unavailable; running full scope refresh",
      );
      this.refreshThemeScopes();
      return;
    }

    if (this.scopeObserver) {
      return;
    }

    const observerTarget = document.documentElement;
    if (!observerTarget) {
      return;
    }

    this.scopeObserver = new MutationObserverCtor((mutations) => {
      const pendingScopes = new Set<Element>();

      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          this.collectThemeScopesFromNode(node, pendingScopes);
        });
      }

      if (pendingScopes.size > 0) {
        this.refreshThemeScopes(pendingScopes);
      }
    });

    this.scopeObserver.observe(observerTarget, {
      childList: true,
      subtree: true,
    });
  }

  private collectThemeScopesFromNode(node: Node, bucket: Set<Element>): void {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    if (node.classList.contains("xeg-theme-scope")) {
      bucket.add(node);
    }

    const descendants = node.querySelectorAll(".xeg-theme-scope");
    descendants.forEach((scope) => bucket.add(scope));
  }
}

/**
 * Global singleton instance
 * Phase 230: Export added for BaseService initialization
 */
export const themeService = new ThemeService();

export type {
  Theme,
  ThemeSetting,
  ThemeSetOptions,
  ThemeChangeListener,
  SettingsServiceLike,
  ThemeServiceContract,
} from "./theme-service.contract";
