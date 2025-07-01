/**
 * @fileoverview 디자인 시스템 초기화
 * @description 애플리케이션 시작 시 디자인 시스템을 초기화하는 유틸리티
 * @version 1.0.0
 */

import { getDesignTokens } from '../tokens/DesignTokens';
import { logger } from '../../../infrastructure/logging/logger';
import { validateDesignTokens } from './design-utils';

/**
 * CSS 변수 주입을 위한 타입
 */
interface CSSVariableMap {
  [key: string]: string;
}

/**
 * 디자인 토큰을 CSS 변수로 변환
 */
function createCSSVariablesFromTokens(theme: 'light' | 'dark' = 'light'): CSSVariableMap {
  const tokens = getDesignTokens(theme);
  const cssVariables: CSSVariableMap = {};

  // 색상 토큰
  Object.entries(tokens.colors.primary).forEach(([key, value]) => {
    cssVariables[`--xeg-color-primary-${key}`] = value;
  });

  Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
    cssVariables[`--xeg-color-neutral-${key}`] = value;
  });

  // Surface 색상
  Object.entries(tokens.colors.surface.background).forEach(([key, value]) => {
    cssVariables[`--xeg-color-bg-${key}`] = value;
  });

  Object.entries(tokens.colors.surface.overlay).forEach(([key, value]) => {
    cssVariables[`--xeg-color-overlay-${key}`] = value;
  });

  // Semantic 색상
  Object.entries(tokens.colors.semantic).forEach(([semanticKey, semanticScale]) => {
    Object.entries(semanticScale as Record<string, string>).forEach(([key, value]) => {
      cssVariables[`--xeg-color-${semanticKey}-${key}`] = value;
    });
  });

  // 간격 토큰
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVariables[`--xeg-spacing-${key}`] = value;
  });

  // 타이포그래피 토큰
  Object.entries(tokens.typography.fontFamily).forEach(([key, value]) => {
    cssVariables[`--xeg-font-family-${key}`] = value;
  });

  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVariables[`--xeg-font-size-${key}`] = value;
  });

  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    cssVariables[`--xeg-font-weight-${key}`] = value;
  });

  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    cssVariables[`--xeg-line-height-${key}`] = value;
  });

  // 그림자 토큰
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    cssVariables[`--xeg-shadow-${key}`] = value;
  });

  // 애니메이션 토큰
  Object.entries(tokens.animation.duration).forEach(([key, value]) => {
    cssVariables[`--xeg-duration-${key}`] = value;
  });

  Object.entries(tokens.animation.easing).forEach(([key, value]) => {
    cssVariables[`--xeg-easing-${key}`] = value;
  });

  // 브레이크포인트 토큰
  Object.entries(tokens.breakpoints).forEach(([key, value]) => {
    cssVariables[`--xeg-breakpoint-${key}`] = value;
  });

  return cssVariables;
}

/**
 * CSS 변수를 DOM에 주입
 */
function injectCSSVariables(variables: CSSVariableMap): void {
  const root = document.documentElement;

  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * 테마별 CSS 클래스 추가
 */
function applyThemeClass(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.add(`xeg-theme-${theme}`);
}

/**
 * 시스템 테마 감지
 */
function getSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * 디자인 시스템 초기화
 */
export function initializeDesignSystem(
  options: {
    theme?: 'light' | 'dark' | 'auto';
    validateTokens?: boolean;
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const { theme = 'auto', validateTokens = true } = options;

      // 테마 결정
      const selectedTheme = theme === 'auto' ? getSystemTheme() : theme;

      logger.info(`Initializing design system with ${selectedTheme} theme`);

      // CSS 변수 생성 및 주입
      const cssVariables = createCSSVariablesFromTokens(selectedTheme);
      injectCSSVariables(cssVariables);

      // 테마 클래스 적용
      applyThemeClass(selectedTheme);

      // 토큰 검증 (옵션)
      if (validateTokens) {
        const isValid = validateDesignTokens();
        if (!isValid) {
          logger.warn('Some design tokens are missing or invalid');
        }
      }

      logger.info('Design system initialized successfully');
      resolve();
    } catch (error) {
      logger.error('Failed to initialize design system:', error);
      reject(error);
    }
  });
}

/**
 * 테마 변경
 */
export function changeTheme(theme: 'light' | 'dark'): void {
  try {
    // 새로운 CSS 변수 생성 및 주입
    const cssVariables = createCSSVariablesFromTokens(theme);
    injectCSSVariables(cssVariables);

    // 테마 클래스 업데이트
    document.documentElement.classList.remove('xeg-theme-light', 'xeg-theme-dark');
    applyThemeClass(theme);

    logger.info(`Theme changed to ${theme}`);
  } catch (error) {
    logger.error('Failed to change theme:', error);
  }
}

/**
 * 시스템 테마 변경 감지 및 자동 적용
 */
export function enableAutoTheme(): void {
  if (!window.matchMedia) {
    logger.warn('matchMedia not supported, auto theme disabled');
    return;
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleThemeChange = (e: MediaQueryListEvent) => {
    const newTheme = e.matches ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  // 이벤트 리스너 등록
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleThemeChange);
  } else {
    // IE 호환성
    mediaQuery.addListener(handleThemeChange);
  }

  logger.info('Auto theme enabled');
}
