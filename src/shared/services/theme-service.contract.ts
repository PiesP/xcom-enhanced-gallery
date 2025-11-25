/**
 * Theme mode values supported by the application.
 */
export type Theme = 'light' | 'dark';

/**
 * Theme setting values stored in settings (auto + explicit themes).
 */
export type ThemeSetting = 'auto' | Theme;

/**
 * Options for manually setting the theme via ThemeService.
 */
export interface ThemeSetOptions {
  /** Force DOM updates and listener notifications even if the effective theme is unchanged. */
  force?: boolean;
  /** Skip persistence when true (useful for startup reapply). Defaults to true (persist). */
  persist?: boolean;
}

/**
 * Listener signature invoked when the active theme or setting changes.
 */
export type ThemeChangeListener = (theme: Theme, setting: ThemeSetting) => void;

/**
 * Subset of the SettingsService contract needed for ThemeService binding.
 */
export interface SettingsServiceLike {
  get?: (key: string) => unknown;
  set?: (key: string, value: unknown) => Promise<void> | void;
  subscribe?: (
    listener: (event: { key: string; oldValue: unknown; newValue: unknown }) => void,
  ) => () => void;
}

/**
 * Public contract for ThemeService consumers. Matches the BaseService lifecycle API
 * plus the theme-specific helpers that downstream features rely upon.
 */
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
