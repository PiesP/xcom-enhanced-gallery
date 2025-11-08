/**
 * @fileoverview Theme-related utility functions
 * @description Theme and CSS variable helper functions for X.com Enhanced Gallery
 * @version 2.0.0 (TypeScript strict mode reinforced)
 */

/**
 * Check if browser environment
 * @internal
 */
function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

/**
 * Helper function to get CSS variable value
 * @param variableName - CSS variable name (without --xeg- prefix)
 * @returns CSS variable value (empty string if not found)
 * @example
 * ```ts
 * const primaryColor = getXEGVariable('color-primary-500');
 * const spacing = getXEGVariable('spacing-md');
 * ```
 */
export function getXEGVariable(variableName: string): string {
  if (!isBrowser()) return '';

  try {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--xeg-${variableName}`)
      .trim();
  } catch {
    return '';
  }
}

/**
 * Gallery theme setting utility
 * @param theme - Theme type to set
 * @description Sets `data-theme` attribute on gallery root element.
 * @example
 * ```ts
 * setGalleryTheme('dark');    // Enable dark mode
 * setGalleryTheme('auto');    // Follow system settings
 * ```
 */
export function setGalleryTheme(theme: Theme): void {
  if (!isBrowser()) return;

  const galleryRoot = document.querySelector('.xeg-root') as HTMLElement | null;
  if (galleryRoot) {
    galleryRoot.setAttribute('data-theme', theme);
  }
}

/**
 * Gallery isolation check utility
 * @param element - DOM element to check
 * @returns true if element is inside gallery, false if outside
 * @example
 * ```ts
 * if (isInsideGallery(element)) {
 *   // Element inside gallery
 *   applyGalleryStyles(element);
 * }
 * ```
 */
export function isInsideGallery(element: Element | null): boolean {
  if (!element) return false;
  return element.closest('.xeg-root') !== null;
}

// 스타일 시스템 상수
export const STYLE_CONSTANTS = {
  NAMESPACE: 'xeg',
  ROOT_CLASS: 'xeg-root',
  GALLERY_CLASS: 'xeg-gallery-container',
  OVERLAY_CLASS: 'xeg-gallery-overlay',
  THEMES: ['light', 'dark', 'auto'] as const,
} as const;

export type Theme = (typeof STYLE_CONSTANTS.THEMES)[number];
