/**
 * 간단한 토큰 관리자
 *
 * 복잡한 디자인 시스템 검증기를 대체하는
 * 유저스크립트에 적합한 간단한 CSS 토큰 관리자입니다.
 */

import { createScopedLogger } from '@shared/logging/logger';

const logger = createScopedLogger('SimpleTokenManager');

// CSS 토큰 스토리지
const tokens = new Map<string, string>();
const themes = new Map<string, Record<string, string>>();

/**
 * CSS 토큰 설정
 */
export function setToken(name: string, value: string): void {
  tokens.set(name, value);

  // CSS 변수로 즉시 적용
  document.documentElement.style.setProperty(`--${name}`, value);

  logger.debug(`Token set: --${name} = ${value}`);
}

/**
 * CSS 토큰 조회
 */
export function getToken(name: string): string | undefined {
  return tokens.get(name);
}

/**
 * 테마 설정
 */
export function setTheme(themeName: string, themeTokens: Record<string, string>): void {
  themes.set(themeName, themeTokens);

  // 현재 테마로 적용
  Object.entries(themeTokens).forEach(([name, value]) => {
    setToken(name, value);
  });

  logger.info(`Theme applied: ${themeName}`);
}

/**
 * 현재 테마 조회
 */
export function getTheme(themeName: string): Record<string, string> | undefined {
  return themes.get(themeName);
}

/**
 * 모든 토큰 조회
 */
export function getAllTokens(): Record<string, string> {
  return Object.fromEntries(tokens);
}

/**
 * 토큰 제거
 */
export function removeToken(name: string): void {
  tokens.delete(name);
  document.documentElement.style.removeProperty(`--${name}`);
  logger.debug(`Token removed: --${name}`);
}

/**
 * 모든 토큰 정리
 */
export function clearAllTokens(): void {
  for (const name of tokens.keys()) {
    document.documentElement.style.removeProperty(`--${name}`);
  }
  tokens.clear();
  themes.clear();
  logger.info('All tokens cleared');
}

/**
 * CSS 변수 직접 읽기
 */
export function getCSSVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/**
 * 기본 토큰들 초기화
 */
export function initializeDefaultTokens(): void {
  const defaultTokens = {
    // 색상 토큰
    'primary-color': '#1DA1F2',
    'secondary-color': '#14171A',
    'background-color': '#000000',
    'text-color': '#FFFFFF',

    // 간격 토큰
    'spacing-xs': '4px',
    'spacing-sm': '8px',
    'spacing-md': '16px',
    'spacing-lg': '24px',
    'spacing-xl': '32px',

    // 폰트 토큰
    'font-size-xs': '12px',
    'font-size-sm': '14px',
    'font-size-md': '16px',
    'font-size-lg': '18px',
    'font-size-xl': '24px',

    // 반응형 토큰
    'border-radius': '8px',
    'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.1)',
    'transition-duration': '0.2s',

    // Glassmorphism 토큰
    'glass-bg': 'rgba(255, 255, 255, 0.1)',
    'glass-border': 'rgba(255, 255, 255, 0.2)',
    'glass-backdrop': 'blur(10px)',
  };

  Object.entries(defaultTokens).forEach(([name, value]) => {
    setToken(name, value);
  });

  logger.info('Default tokens initialized');
}

// 자동 초기화 (유저스크립트 환경에서)
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  initializeDefaultTokens();
} else if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeDefaultTokens);
}
