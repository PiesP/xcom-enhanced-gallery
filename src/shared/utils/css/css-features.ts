/**
 * @fileoverview CSS Feature Detection Utilities
 * @description Runtime detection of CSS feature support with caching
 */

/**
 * Cached CSS feature detection results
 */
interface CSSFeatureCache {
  hasSelector: boolean | null;
  colorMix: boolean | null;
  oklch: boolean | null;
  containerQueries: boolean | null;
  hasHasSelector: boolean | null;
}

const featureCache: CSSFeatureCache = {
  hasSelector: null,
  colorMix: null,
  oklch: null,
  containerQueries: null,
  hasHasSelector: null,
};

/**
 * Test if CSS.supports is available
 */
function hasCSSSupports(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function';
}

/**
 * Check if browser supports CSS :has() selector
 * Safari 15.4+, Chrome 105+, Firefox 121+
 */
export function supportsHasSelector(): boolean {
  if (featureCache.hasHasSelector !== null) {
    return featureCache.hasHasSelector;
  }

  if (!hasCSSSupports()) {
    featureCache.hasHasSelector = false;
    return false;
  }

  try {
    featureCache.hasHasSelector = CSS.supports('selector(:has(*))');
  } catch {
    featureCache.hasHasSelector = false;
  }

  return featureCache.hasHasSelector;
}

/**
 * Check if browser supports CSS color-mix()
 * Chrome 111+, Firefox 113+, Safari 16.2+
 */
export function supportsColorMix(): boolean {
  if (featureCache.colorMix !== null) {
    return featureCache.colorMix;
  }

  if (!hasCSSSupports()) {
    featureCache.colorMix = false;
    return false;
  }

  try {
    featureCache.colorMix = CSS.supports('color', 'color-mix(in oklch, red 50%, blue)');
  } catch {
    featureCache.colorMix = false;
  }

  return featureCache.colorMix;
}

/**
 * Check if browser supports CSS oklch() color space
 * Chrome 111+, Firefox 113+, Safari 15.4+
 */
export function supportsOklch(): boolean {
  if (featureCache.oklch !== null) {
    return featureCache.oklch;
  }

  if (!hasCSSSupports()) {
    featureCache.oklch = false;
    return false;
  }

  try {
    featureCache.oklch = CSS.supports('color', 'oklch(70% 0.15 220deg)');
  } catch {
    featureCache.oklch = false;
  }

  return featureCache.oklch;
}

/**
 * Check if browser supports CSS Container Queries
 * Chrome 105+, Firefox 110+, Safari 16+
 */
export function supportsContainerQueries(): boolean {
  if (featureCache.containerQueries !== null) {
    return featureCache.containerQueries;
  }

  if (!hasCSSSupports()) {
    featureCache.containerQueries = false;
    return false;
  }

  try {
    featureCache.containerQueries = CSS.supports('container-type', 'size');
  } catch {
    featureCache.containerQueries = false;
  }

  return featureCache.containerQueries;
}

/**
 * Combined CSS feature detection result
 */
export interface CSSFeatures {
  hasSelector: boolean;
  colorMix: boolean;
  oklch: boolean;
  containerQueries: boolean;
  /** Whether all modern CSS features are supported */
  allModern: boolean;
}

/**
 * Detect all CSS features at once
 * Results are cached for performance
 */
export function detectCSSFeatures(): CSSFeatures {
  const hasSelector = supportsHasSelector();
  const colorMix = supportsColorMix();
  const oklch = supportsOklch();
  const containerQueries = supportsContainerQueries();

  return {
    hasSelector,
    colorMix,
    oklch,
    containerQueries,
    allModern: hasSelector && colorMix && oklch && containerQueries,
  };
}

/**
 * Apply CSS feature classes to document root
 * Used to enable feature-specific styles via CSS selectors
 *
 * @example
 * // CSS can then use:
 * // :root.xeg-has-selector .my-class { ... }
 * // :root:not(.xeg-has-selector) .my-class { ... }
 */
export function applyCSSFeatureClasses(root: HTMLElement = document.documentElement): void {
  const features = detectCSSFeatures();

  const classMap: Record<string, boolean> = {
    'xeg-has-selector': features.hasSelector,
    'xeg-color-mix': features.colorMix,
    'xeg-oklch': features.oklch,
    'xeg-container-queries': features.containerQueries,
    'xeg-modern-css': features.allModern,
  };

  for (const [className, isSupported] of Object.entries(classMap)) {
    if (isSupported) {
      root.classList.add(className);
    } else {
      root.classList.remove(className);
    }
  }
}

/**
 * Clear the feature cache
 * Useful for testing or after browser updates
 */
export function clearCSSFeatureCache(): void {
  featureCache.hasSelector = null;
  featureCache.colorMix = null;
  featureCache.oklch = null;
  featureCache.containerQueries = null;
  featureCache.hasHasSelector = null;
}
