/**
 * @fileoverview Color Contrast Utilities
 * @description WCAG color contrast calculation and validation functions
 */

/**
 * Safe number parsing
 */
export function safeParseInt(value: string | undefined, radix: number): number {
  if (!value) return 0;
  const parsed = parseInt(value, radix);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate relative luminance.
 * WCAG 2.1 standard.
 *
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Relative luminance value (0-1)
 *
 * @example
 * ```typescript
 * const luminance = getRelativeLuminance(255, 255, 255); // 1 (white)
 * const darkLuminance = getRelativeLuminance(0, 0, 0);   // 0 (black)
 * ```
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rNorm, gNorm, bNorm] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * (rNorm ?? 0) + 0.7152 * (gNorm ?? 0) + 0.0722 * (bNorm ?? 0);
}

/**
 * Extract RGB values from CSS color string.
 *
 * @param color - CSS color string (supports rgb, rgba, hex formats)
 * @returns RGB value array [r, g, b] or null (on parse failure)
 *
 * @example
 * ```typescript
 * const rgb1 = parseColor('rgb(255, 0, 0)');        // [255, 0, 0]
 * const rgb2 = parseColor('rgba(0, 255, 0, 0.5)');  // [0, 255, 0]
 * const rgb3 = parseColor('#0000ff');               // [0, 0, 255]
 * ```
 */
export function parseColor(color: string): [number, number, number] | null {
  // RGB/RGBA format
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      safeParseInt(rgbMatch[1], 10),
      safeParseInt(rgbMatch[2], 10),
      safeParseInt(rgbMatch[3], 10),
    ];
  }

  // HEX format
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [
      safeParseInt(hexMatch[1], 16),
      safeParseInt(hexMatch[2], 16),
      safeParseInt(hexMatch[3], 16),
    ];
  }

  // 3-digit HEX format
  const shortHexMatch = color.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return [
      safeParseInt((shortHexMatch[1] ?? '') + (shortHexMatch[1] ?? ''), 16),
      safeParseInt((shortHexMatch[2] ?? '') + (shortHexMatch[2] ?? ''), 16),
      safeParseInt((shortHexMatch[3] ?? '') + (shortHexMatch[3] ?? ''), 16),
    ];
  }

  // Named colors
  const namedColors: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    transparent: [255, 255, 255], // Transparent treated as white
  };

  const lowerColor = color.toLowerCase();
  return namedColors[lowerColor] || null;
}

/**
 * Calculate contrast ratio between two colors.
 * WCAG 2.1 standard.
 *
 * @param foreground - Foreground color (CSS color string)
 * @param background - Background color (CSS color string)
 * @returns Contrast ratio (1:1 ~ 21:1)
 *
 * @example
 * ```typescript
 * const ratio1 = calculateContrastRatio('black', 'white');     // 21
 * const ratio2 = calculateContrastRatio('#000000', '#ffffff'); // 21
 * const ratio3 = calculateContrastRatio('rgb(0,0,0)', 'rgb(255,255,255)'); // 21
 * ```
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  if (!fgRgb || !bgRgb) {
    return 1; // Minimum contrast on parse failure
  }

  const fgLuminance = getRelativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
  const bgLuminance = getRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Luminance calculation
 * WCAG 1.4.3 Luminance Calculation
 */
export function calculateLuminance(rgb: number[]): number {
  return getRelativeLuminance(rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0);
}

/**
 * Check if meets WCAG AA standard (4.5:1).
 *
 * @param foreground - Foreground color
 * @param background - Background color
 * @returns Whether WCAG AA standard is met
 *
 * @example
 * ```typescript
 * const isAccessible = meetsWCAGAA('black', 'white'); // true
 * const isNotAccessible = meetsWCAGAA('#ccc', 'white'); // false
 * ```
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 4.5;
}

/**
 * Check if meets WCAG AAA standard (7:1).
 *
 * @param foreground - Foreground color
 * @param background - Background color
 * @returns Whether WCAG AAA standard is met
 *
 * @example
 * ```typescript
 * const isAAA = meetsWCAGAAA('black', 'white'); // true
 * const isNotAAA = meetsWCAGAAA('#666', 'white'); // false
 * ```
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 7;
}

/**
 * Detect the actual background color of the given element.
 * For transparent backgrounds, checks parent elements.
 *
 * @param element - DOM element to check
 * @returns Actual background color (CSS color string)
 */
export function detectActualBackgroundColor(element: HTMLElement): string {
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const bgColor = style.backgroundColor;

    // codeql[js/hardcoded-color-values] - Transparent color detection
    if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      return bgColor;
    }

    current = current.parentElement;
  }

  // codeql[js/hardcoded-color-values] - Default fallback color for accessibility calculation
  return 'rgb(255, 255, 255)'; // Default: white
}

/**
 * Detect if background is light or dark.
 *
 * @param element - DOM element to check
 * @returns true for light background, false for dark background
 */
export function detectLightBackground(element: HTMLElement): boolean {
  const bgColor = detectActualBackgroundColor(element);
  const rgb = parseColor(bgColor);

  if (!rgb) return true; // Default: light background

  const luminance = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
  return luminance > 0.5; // 0.5 or higher is light background
}

/**
 * Contrast validation
 * WCAG 1.4.3 Contrast (Minimum)
 */
export function validateContrast(foreground: string, background: string): boolean {
  const contrastRatio = calculateContrastRatio(foreground, background);
  return contrastRatio >= 4.5; // WCAG AA standard
}

/**
 * Contrast analysis tool
 * WCAG 1.4.3 Contrast Analysis
 */
export function analyzeContrast(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const foreground = styles.color;
  const background = styles.backgroundColor;

  return calculateContrastRatio(foreground, background);
}

/**
 * Contrast ratio test
 * WCAG 1.4.3 Contrast Ratio Testing
 */
export function testContrastRatio(foreground: string, background: string): boolean {
  return validateContrast(foreground, background);
}

/**
 * WCAG Level validation functions
 */
export function isWCAGAACompliant(ratio: number): boolean {
  return ratio >= 4.5;
}

export function isWCAGAAACompliant(ratio: number): boolean {
  return ratio >= 7;
}

export function isWCAGLargeTextAACompliant(ratio: number): boolean {
  return ratio >= 3;
}

export function isWCAGLargeTextAAACompliant(ratio: number): boolean {
  return ratio >= 4.5;
}

/**
 * Standard WCAG color contrast validation functions
 */
export function validateColorContrast(
  foreground: string,
  background: string
): {
  ratio: number;
  isAACompliant: boolean;
  isAAACompliant: boolean;
  isLargeTextAACompliant: boolean;
  isLargeTextAAACompliant: boolean;
} {
  const ratio = calculateContrastRatio(foreground, background);
  return {
    ratio,
    isAACompliant: isWCAGAACompliant(ratio),
    isAAACompliant: isWCAGAAACompliant(ratio),
    isLargeTextAACompliant: isWCAGLargeTextAACompliant(ratio),
    isLargeTextAAACompliant: isWCAGLargeTextAAACompliant(ratio),
  };
}
