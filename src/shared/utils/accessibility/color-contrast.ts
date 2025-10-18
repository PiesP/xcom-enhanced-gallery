/**
 * @fileoverview Color Contrast Utilities
 * @description WCAG 색상 대비 계산 및 검증 함수들
 */

/**
 * 안전한 숫자 파싱
 */
export function safeParseInt(value: string | undefined, radix: number): number {
  if (!value) return 0;
  const parsed = parseInt(value, radix);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 상대 휘도를 계산합니다.
 * WCAG 2.1 기준을 따릅니다.
 *
 * @param r - 빨간색 값 (0-255)
 * @param g - 녹색 값 (0-255)
 * @param b - 파란색 값 (0-255)
 * @returns 상대 휘도 값 (0-1)
 *
 * @example
 * ```typescript
 * const luminance = getRelativeLuminance(255, 255, 255); // 1 (흰색)
 * const darkLuminance = getRelativeLuminance(0, 0, 0);   // 0 (검정색)
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
 * CSS 색상 문자열에서 RGB 값을 추출합니다.
 *
 * @param color - CSS 색상 문자열 (rgb, rgba, hex 형식 지원)
 * @returns RGB 값 배열 [r, g, b] 또는 null (파싱 실패 시)
 *
 * @example
 * ```typescript
 * const rgb1 = parseColor('rgb(255, 0, 0)');        // [255, 0, 0]
 * const rgb2 = parseColor('rgba(0, 255, 0, 0.5)');  // [0, 255, 0]
 * const rgb3 = parseColor('#0000ff');               // [0, 0, 255]
 * ```
 */
export function parseColor(color: string): [number, number, number] | null {
  // RGB/RGBA 형식
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      safeParseInt(rgbMatch[1], 10),
      safeParseInt(rgbMatch[2], 10),
      safeParseInt(rgbMatch[3], 10),
    ];
  }

  // HEX 형식
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [
      safeParseInt(hexMatch[1], 16),
      safeParseInt(hexMatch[2], 16),
      safeParseInt(hexMatch[3], 16),
    ];
  }

  // 3자리 HEX 형식
  const shortHexMatch = color.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return [
      safeParseInt((shortHexMatch[1] ?? '') + (shortHexMatch[1] ?? ''), 16),
      safeParseInt((shortHexMatch[2] ?? '') + (shortHexMatch[2] ?? ''), 16),
      safeParseInt((shortHexMatch[3] ?? '') + (shortHexMatch[3] ?? ''), 16),
    ];
  }

  // 기본 색상명
  const namedColors: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    transparent: [255, 255, 255], // 투명은 흰색으로 처리
  };

  const lowerColor = color.toLowerCase();
  return namedColors[lowerColor] || null;
}

/**
 * 두 색상 간의 대비 비율을 계산합니다.
 * WCAG 2.1 기준을 따릅니다.
 *
 * @param foreground - 전경색 (CSS 색상 문자열)
 * @param background - 배경색 (CSS 색상 문자열)
 * @returns 대비 비율 (1:1 ~ 21:1)
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
    return 1; // 파싱 실패 시 최소 대비
  }

  const fgLuminance = getRelativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
  const bgLuminance = getRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 휘도 계산
 * WCAG 1.4.3 Luminance Calculation
 */
export function calculateLuminance(rgb: number[]): number {
  return getRelativeLuminance(rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0);
}

/**
 * WCAG AA 기준 (4.5:1)을 만족하는지 확인합니다.
 *
 * @param foreground - 전경색
 * @param background - 배경색
 * @returns WCAG AA 기준 만족 여부
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
 * WCAG AAA 기준 (7:1)을 만족하는지 확인합니다.
 *
 * @param foreground - 전경색
 * @param background - 배경색
 * @returns WCAG AAA 기준 만족 여부
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
 * 주어진 요소의 실제 배경색을 감지합니다.
 * 투명한 배경의 경우 부모 요소까지 검사합니다.
 *
 * @param element - 검사할 DOM 요소
 * @returns 실제 배경색 (CSS 색상 문자열)
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
  return 'rgb(255, 255, 255)'; // 기본값: 흰색
}

/**
 * 밝은 배경인지 어두운 배경인지 감지합니다.
 *
 * @param element - 검사할 DOM 요소
 * @returns true면 밝은 배경, false면 어두운 배경
 */
export function detectLightBackground(element: HTMLElement): boolean {
  const bgColor = detectActualBackgroundColor(element);
  const rgb = parseColor(bgColor);

  if (!rgb) return true; // 기본값: 밝은 배경

  const luminance = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
  return luminance > 0.5; // 0.5 이상이면 밝은 배경
}

/**
 * 대조 검증
 * WCAG 1.4.3 Contrast (Minimum)
 */
export function validateContrast(foreground: string, background: string): boolean {
  const contrastRatio = calculateContrastRatio(foreground, background);
  return contrastRatio >= 4.5; // WCAG AA 기준
}

/**
 * 대조비 분석 도구
 * WCAG 1.4.3 Contrast Analysis
 */
export function analyzeContrast(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const foreground = styles.color;
  const background = styles.backgroundColor;

  return calculateContrastRatio(foreground, background);
}

/**
 * 대조 비율 테스트
 * WCAG 1.4.3 Contrast Ratio Testing
 */
export function testContrastRatio(foreground: string, background: string): boolean {
  return validateContrast(foreground, background);
}

/**
 * WCAG Level 검증 함수들
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
 * WCAG 색상 대비 검증 표준 함수들
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
