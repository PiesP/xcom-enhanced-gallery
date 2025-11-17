/**
 * Theme DOM helpers
 * @description Keeps theme-related data attributes in sync across the document root
 * and any XEG-specific theme scopes (e.g., the isolated gallery root)
 */

import { THEME_DOM_ATTRIBUTE } from '@shared/constants';

export type ThemeName = 'light' | 'dark';

/**
 * Synchronize the data-theme attribute between the document root and every
 * element that participates in the gallery theme scope.
 */
export function syncThemeAttributes(theme: ThemeName): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (root) {
    root.setAttribute(THEME_DOM_ATTRIBUTE, theme);
  }

  const scopes = document.querySelectorAll<HTMLElement>('.xeg-theme-scope');
  scopes.forEach(scope => {
    scope.setAttribute(THEME_DOM_ATTRIBUTE, theme);
  });
}
