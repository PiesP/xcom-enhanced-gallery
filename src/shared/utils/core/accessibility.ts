/**
 * @fileoverview 접근성 관련 유틸리티 함수들
 * @version 1.0.0
 *
 * WCAG 2.1 기준에 따른 색상 대비, 시인성 관련 계산 함수들을 제공합니다.
 */

/**
 * RGB 색상을 상대 휘도(relative luminance)로 변환합니다.
 * WCAG 2.1 기준에 따라 계산됩니다.
 *
 * @param r - 빨강 채널 값 (0-255)
 * @param g - 초록 채널 값 (0-255)
 * @param b - 파랑 채널 값 (0-255)
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

  return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
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
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }

  // HEX 형식
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16)];
  }

  // 3자리 HEX 형식
  const shortHexMatch = color.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return [
      parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
      parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
      parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
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
 *
 * @example
 * ```typescript
 * const bgColor = detectActualBackgroundColor(document.querySelector('.toolbar'));
 * const ratio = calculateContrastRatio('white', bgColor);
 * ```
 */
export function detectActualBackgroundColor(element: Element): string {
  let currentElement: Element | null = element;

  while (currentElement) {
    const computedStyle = window.getComputedStyle(currentElement);
    const backgroundColor = computedStyle.backgroundColor;

    // 투명하지 않은 배경색을 찾으면 반환
    if (
      backgroundColor &&
      backgroundColor !== 'transparent' &&
      backgroundColor !== 'rgba(0, 0, 0, 0)'
    ) {
      return backgroundColor;
    }

    currentElement = currentElement.parentElement;
  }

  // 모든 부모가 투명하면 기본 배경색 반환
  return 'white';
}

/**
 * 요소 뒤의 배경이 밝은지 어두운지 감지합니다.
 * 툴바나 오버레이의 동적 대비 조정에 사용됩니다.
 *
 * @param element - 검사할 DOM 요소
 * @returns 배경이 밝으면 true, 어두우면 false
 *
 * @example
 * ```typescript
 * const toolbar = document.querySelector('.toolbar');
 * const needsHighContrast = detectLightBackground(toolbar);
 * toolbar.classList.toggle('high-contrast', needsHighContrast);
 * ```
 */
export function detectLightBackground(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 요소 뒤의 요소들 확인
  const elementsBelow = document.elementsFromPoint(centerX, centerY);

  for (const el of elementsBelow) {
    if (el === element) {
      continue; // 자기 자신은 건너뛰기
    }

    const bgColor = detectActualBackgroundColor(el);
    const rgb = parseColor(bgColor);

    if (rgb) {
      const luminance = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
      // 휘도가 0.5 이상이면 밝은 배경으로 판단
      if (luminance > 0.5) {
        return true;
      }
    }
  }

  return false;
}
