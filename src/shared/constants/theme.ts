/**
 * @fileoverview Shared theme constants
 * @description Centralizes theme-related key names for storage and DOM integration.
 * Defines persistent storage keys and DOM attribute names used by ThemeService
 * to maintain theme consistency across application components.
 * @module shared/constants/theme
 *
 * @remarks
 * **Key Naming Convention**:
 * - Storage keys: `xeg-<name>` format (kebab-case with namespace prefix)
 * - DOM attributes: `data-<name>` format (standard HTML5 data attribute)
 *
 * **Usage Pattern**:
 * ```typescript
 * import { THEME_STORAGE_KEY, THEME_DOM_ATTRIBUTE } from '@shared/constants/theme';
 * import { getPersistentStorage } from '@shared/services/persistent-storage';
 *
 * // Read theme from storage
 * const storage = getPersistentStorage();
 * const theme = await storage.get<string>(THEME_STORAGE_KEY);
 *
 * // Apply theme to DOM
 * document.documentElement.setAttribute(THEME_DOM_ATTRIBUTE, 'dark');
 * ```
 *
 * @see {@link ThemeService} for theme management implementation
 * @see {@link syncThemeAttributes} for theme DOM synchronization
 */

/**
 * Persistent storage key for theme preference
 *
 * @remarks
 * Storage key used by ThemeService to persist user theme settings across sessions.
 * Stores theme selection as a string value ('auto', 'light', or 'dark').
 *
 * **Storage Format**: String literal - `'auto' | 'light' | 'dark'`
 *
 * **Access Pattern**:
 * - Read: ThemeService loads on initialization
 * - Write: ThemeService saves on theme change
 * - Scope: Global application preference
 *
 * @example
 * ```typescript
 * import { THEME_STORAGE_KEY } from '@shared/constants/theme';
 * import { getPersistentStorage } from '@shared/services/persistent-storage';
 *
 * const storage = getPersistentStorage();
 *
 * // Read current theme
 * const theme = await storage.get<ThemeSetting>(THEME_STORAGE_KEY);
 *
 * // Save theme preference
 * await storage.set(THEME_STORAGE_KEY, 'dark');
 * ```
 *
 * @see {@link ThemeService.initialize} for startup loading
 * @see {@link ThemeService.setTheme} for theme persistence
 */
export const THEME_STORAGE_KEY = 'xeg-theme' as const;

/**
 * DOM attribute used to apply the resolved theme
 *
 * @remarks
 * Data attribute name used to apply theme classes to DOM elements.
 * ThemeService sets this attribute on document root and gallery containers
 * to enable theme-specific CSS styling.
 *
 * **Attribute Values**: `'light' | 'dark'` (resolved theme, not user setting)
 *
 * **Application Scope**:
 * - `document.documentElement` - Global theme application
 * - Gallery root containers - Isolated theme scopes
 *
 * @example
 * ```typescript
 * import { THEME_DOM_ATTRIBUTE } from '@shared/constants/theme';
 *
 * // Apply theme to document root
 * document.documentElement.setAttribute(THEME_DOM_ATTRIBUTE, 'dark');
 *
 * // Query elements by theme
 * const darkElements = document.querySelectorAll(`[${THEME_DOM_ATTRIBUTE}="dark"]`);
 *
 * // Read current theme from DOM
 * const currentTheme = document.documentElement.getAttribute(THEME_DOM_ATTRIBUTE);
 * ```
 *
 * @see {@link syncThemeAttributes} for theme synchronization
 * @see {@link ThemeService.applyTheme} for DOM application
 */
export const THEME_DOM_ATTRIBUTE = 'data-theme' as const;

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Extract theme storage key type
 *
 * @remarks
 * Provides literal type for type-safe storage operations.
 * Use when you need a typed reference to the storage key string.
 *
 * @example
 * ```typescript
 * type ThemeKey = typeof THEME_STORAGE_KEY;
 * // 'xeg-theme'
 *
 * function loadTheme(key: ThemeKey): Promise<string | null> {
 *   const storage = getPersistentStorage();
 *   return storage.get<string>(key);
 * }
 * ```
 */
export type ThemeStorageKey = typeof THEME_STORAGE_KEY;

/**
 * Type helper: Extract theme DOM attribute name type
 *
 * @remarks
 * Provides literal type for type-safe DOM attribute operations.
 * Use when you need a typed reference to the attribute name.
 *
 * @example
 * ```typescript
 * type ThemeAttr = typeof THEME_DOM_ATTRIBUTE;
 * // 'data-theme'
 *
 * function setThemeAttribute(element: HTMLElement, attr: ThemeAttr, value: string): void {
 *   element.setAttribute(attr, value);
 * }
 * ```
 */
export type ThemeDomAttribute = typeof THEME_DOM_ATTRIBUTE;
