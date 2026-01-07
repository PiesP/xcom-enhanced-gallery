/**
 * Theme DOM helpers
 *
 * @description Keeps theme-related data attributes in sync across the document root
 * and any XEG-specific theme scopes (e.g., the isolated gallery root)
 * @module shared/dom/theme
 */

import { THEME_DOM_ATTRIBUTE } from '@shared/constants/theme';

/**
 * Supported theme names for the application
 *
 * @remarks
 * Limited to 'light' and 'dark' to match X.com's native theme system
 */
export type ThemeName = 'light' | 'dark';

/**
 * Configuration options for theme attribute synchronization
 *
 * @interface SyncThemeAttributesOptions
 */
export interface SyncThemeAttributesOptions {
  /**
   * Restrict synchronization to the provided theme scope elements.
   *
   * @remarks
   * When omitted, every `.xeg-theme-scope` in the document is updated.
   *
   * @default undefined (queries all `.xeg-theme-scope` elements)
   */
  readonly scopes?: Iterable<Element> | ArrayLike<Element>;

  /**
   * When true, also apply the theme attribute to the document root.
   *
   * @remarks
   * Defaults to false to avoid interfering with twitter.com's own theme handling.
   *
   * @default false
   */
  readonly includeDocumentRoot?: boolean;
}

/**
 * Synchronize the data-theme attribute for gallery theme scopes.
 *
 * @description
 * Updates the theme attribute on XEG theme scope elements and optionally
 * the document root. The document root is optional to minimize interference
 * with host page styles.
 *
 * @param theme - Target theme name ('light' or 'dark')
 * @param options - Optional configuration for scope and root element handling
 *
 * @remarks
 * - Automatically queries all `.xeg-theme-scope` elements if no scopes provided
 * - Filters non-HTMLElement targets for safety
 * - Safe to call in non-browser environments (early return)
 *
 * @example
 * ```typescript
 * // Update all theme scopes to dark mode
 * syncThemeAttributes('dark');
 *
 * // Update specific elements only
 * const galleryRoot = document.querySelector('.xeg-gallery-root');
 * syncThemeAttributes('light', { scopes: [galleryRoot] });
 *
 * // Include document root (use with caution)
 * syncThemeAttributes('dark', { includeDocumentRoot: true });
 * ```
 */
export function syncThemeAttributes(
  theme: ThemeName,
  options: SyncThemeAttributesOptions = {}
): void {
  // Early return for non-browser environments (SSR safety)
  if (typeof document === 'undefined') {
    return;
  }

  const { scopes, includeDocumentRoot = false } = options;

  // Apply theme to document root if requested
  if (includeDocumentRoot && document.documentElement) {
    document.documentElement.setAttribute(THEME_DOM_ATTRIBUTE, theme);
  }

  // Resolve target elements: explicit scopes or all theme scopes
  const targets: Iterable<Element> | ArrayLike<Element> =
    scopes ?? document.querySelectorAll('.xeg-theme-scope');

  // Apply theme attribute to all valid HTMLElement targets
  for (const target of Array.from(targets)) {
    if (target instanceof HTMLElement) {
      target.setAttribute(THEME_DOM_ATTRIBUTE, theme);
    }
  }
}
