/**
 * @fileoverview Theme DOM helpers
 * @description Keep theme-related data attributes in sync across document root and XEG scopes.
 */

import { THEME_DOM_ATTRIBUTE } from '@shared/constants/theme';

export type ThemeName = 'light' | 'dark';

export interface SyncThemeAttributesOptions {
  readonly scopes?: Iterable<Element> | ArrayLike<Element>;
  readonly includeDocumentRoot?: boolean;
}

/**
 * Synchronize data-theme attribute for gallery theme scopes.
 * Updates XEG theme scope elements and optionally document root.
 * @param theme - Target theme name ('light' or 'dark')
 * @param options - Optional configuration for scope and root element handling
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
