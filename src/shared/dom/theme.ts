/**
 * Theme DOM helpers
 * @description Keeps theme-related data attributes in sync across the document root
 * and any XEG-specific theme scopes (e.g., the isolated gallery root)
 */

import { THEME_DOM_ATTRIBUTE } from '@shared/constants/theme';

type ThemeName = 'light' | 'dark';

interface SyncThemeAttributesOptions {
  /**
   * Restrict synchronization to the provided theme scope elements.
   * When omitted, every `.xeg-theme-scope` in the document is updated.
   */
  scopes?: Iterable<Element> | ArrayLike<Element>;
  /**
   * When true, also apply the theme attribute to the document root. Defaults to false
   * to avoid interfering with twitter.com‘s own theme handling.
   */
  includeDocumentRoot?: boolean;
}

/**
 * Synchronize the data-theme attribute for gallery theme scopes. The document root is
 * optional to minimize interference with host page styles.
 */
export function syncThemeAttributes(
  theme: ThemeName,
  options: SyncThemeAttributesOptions = {}
): void {
  if (typeof document === 'undefined') {
    return;
  }

  const { scopes, includeDocumentRoot = false } = options;

  if (includeDocumentRoot) {
    document.documentElement?.setAttribute(THEME_DOM_ATTRIBUTE, theme);
  }

  const targets: Iterable<Element> | ArrayLike<Element> =
    scopes ?? document.querySelectorAll('.xeg-theme-scope');

  for (const target of Array.from(targets)) {
    if (target instanceof HTMLElement) {
      target.setAttribute(THEME_DOM_ATTRIBUTE, theme);
    }
  }
}
