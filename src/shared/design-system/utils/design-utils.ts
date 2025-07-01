/**
 * @fileoverview 디자인 시스템 유틸리티
 * @description 디자인 토큰과 CSS 변수를 활용한 유틸리티 함수들
 * @version 1.0.0
 */

import { DESIGN_TOKENS } from '../tokens/DesignTokens';
import { logger } from '../../../infrastructure/logging/logger';

/**
 * CSS 변수 이름을 생성하는 유틸리티
 */
export function createCSSVariable(name: string): string {
  return `--xeg-${name}`;
}

/**
 * CSS 변수 값을 가져오는 유틸리티
 */
export function getCSSVariable(name: string, fallback?: string): string {
  const varName = name.startsWith('--') ? name : createCSSVariable(name);
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback || '';
}

/**
 * CSS 변수를 설정하는 유틸리티
 */
export function setCSSVariable(name: string, value: string): void {
  const varName = name.startsWith('--') ? name : createCSSVariable(name);
  document.documentElement.style.setProperty(varName, value);
}

/**
 * 디자인 토큰에서 CSS 변수를 생성하는 유틸리티
 */
export function tokenToCSSVariable(tokenPath: string): string {
  return `var(--xeg-${tokenPath.replace(/\./g, '-')})`;
}

/**
 * 색상 토큰을 CSS 변수로 변환
 */
export function getColorToken(path: string): string {
  return tokenToCSSVariable(`color-${path}`);
}

/**
 * 간격 토큰을 CSS 변수로 변환
 */
export function getSpacingToken(size: string): string {
  return tokenToCSSVariable(`spacing-${size}`);
}

/**
 * 타이포그래피 토큰을 CSS 변수로 변환
 */
export function getTypographyToken(property: string, size: string): string {
  return tokenToCSSVariable(`typography-${property}-${size}`);
}

/**
 * 그림자 토큰을 CSS 변수로 변환
 */
export function getShadowToken(size: string): string {
  return tokenToCSSVariable(`shadow-${size}`);
}

/**
 * 테마 특정 색상 토큰을 가져오는 유틸리티
 */
export function getThemeColorToken(colorName: string, theme: 'light' | 'dark' = 'light'): string {
  return tokenToCSSVariable(`theme-${theme}-${colorName}`);
}

/**
 * 디자인 토큰 검증 유틸리티
 */
export function validateDesignTokens(): boolean {
  try {
    // 필수 토큰들이 존재하는지 확인
    const requiredTokens = ['color-primary', 'spacing-md', 'typography-fontSize-base', 'shadow-md'];

    for (const token of requiredTokens) {
      const cssVar = `--xeg-${token}`;
      const value = getCSSVariable(cssVar);
      if (!value) {
        logger.warn(`Missing required design token: ${cssVar}`);
        return false;
      }
    }

    logger.info('All required design tokens are available');
    return true;
  } catch (error) {
    logger.error('Design token validation failed:', error);
    return false;
  }
}

/**
 * 반응형 디자인을 위한 브레이크포인트 유틸리티
 */
export function getBreakpointToken(breakpoint: string): string {
  return DESIGN_TOKENS.breakpoints[breakpoint as keyof typeof DESIGN_TOKENS.breakpoints] || '';
}

/**
 * 미디어 쿼리 생성 유틸리티
 */
export function createMediaQuery(breakpoint: string): string {
  return `@media (min-width: ${getBreakpointToken(breakpoint)})`;
}

/**
 * CSS 속성 객체를 생성하는 유틸리티
 */
export function createCSSProperties(properties: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(properties)) {
    // 토큰 패스인지 확인하고 변환
    if (value.includes('.')) {
      result[key] = tokenToCSSVariable(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * CSS 스타일 문자열 생성 유틸리티
 */
export function createStyleString(properties: Record<string, string>): string {
  return Object.entries(createCSSProperties(properties))
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
}
