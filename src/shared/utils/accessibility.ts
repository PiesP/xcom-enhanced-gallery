/**
 * @fileoverview 접근성 관련 유틸리티 함수들
 * @description WCAG 대비 계산, 색상 파싱, 배경색 감지 등 접근성 기능
 * @version 1.0.0 - Phase 1 Consolidation
 */

import { safeParseInt } from './type-safety-helpers';

/**
 * 접근성 유틸리티 함수들
 */

// Re-export from accessibility-utils to avoid duplication
export { getRelativeLuminance } from './accessibility/accessibility-utils';

// Import for internal use
import { getRelativeLuminance } from './accessibility/accessibility-utils';

/**
 * CSS 색상 문자열을 RGB 배열로 파싱합니다.
 */
export function parseColor(color: string): [number, number, number] | null {
  if (!color || typeof color !== 'string') {
    return null;
  }

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
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 4.5;
}

/**
 * WCAG AAA 기준 (7:1)을 만족하는지 확인합니다.
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 7;
}

/**
 * 주어진 요소의 실제 배경색을 감지합니다.
 * 투명한 배경의 경우 부모 요소까지 검사합니다.
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
