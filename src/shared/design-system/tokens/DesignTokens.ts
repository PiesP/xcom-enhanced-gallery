/**
 * @fileoverview 통합 디자인 토큰 시스템
 * @description 모든 디자인 토큰을 하나의 시스템으로 통합
 * @version 2.0.0
 */

/**
 * 색상 스케일 정의
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // base
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * 통합 디자인 토큰
 */
export const DESIGN_TOKENS = {
  /**
   * 색상 시스템
   */
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // base
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    } as ColorScale,
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373', // base
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    } as ColorScale,
    semantic: {
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // base
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
        950: '#052e16',
      } as ColorScale,
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b', // base
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        950: '#451a03',
      } as ColorScale,
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444', // base
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a',
      } as ColorScale,
    },
    surface: {
      light: 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(0, 0, 0, 0.95)',
      overlay: {
        light: 'rgba(0, 0, 0, 0.1)',
        medium: 'rgba(0, 0, 0, 0.3)',
        strong: 'rgba(0, 0, 0, 0.8)',
      },
      glass: {
        light: 'rgba(255, 255, 255, 0.85)',
        medium: 'rgba(255, 255, 255, 0.65)',
        dark: 'rgba(0, 0, 0, 0.85)',
      },
    },
  },

  /**
   * 간격 시스템
   */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  /**
   * 타이포그래피
   */
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  /**
   * 레이아웃
   */
  layout: {
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    zIndex: {
      base: 1,
      dropdown: 1000,
      modal: 2000,
      overlay: 3000,
      gallery: 4000,
      toast: 5000,
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    },
  },

  /**
   * 애니메이션
   */
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    blur: {
      light: 'blur(12px)',
      medium: 'blur(16px)',
      strong: 'blur(20px)',
    },
  },

  /**
   * 브레이크포인트
   */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

/**
 * 타입 정의
 */
export type DesignTokens = typeof DESIGN_TOKENS;
export type ColorToken = keyof typeof DESIGN_TOKENS.colors;
export type SpacingToken = keyof typeof DESIGN_TOKENS.spacing;
export type TypographyToken = keyof typeof DESIGN_TOKENS.typography;

/**
 * CSS 변수명 생성 유틸리티
 */
export function createCSSVariable(tokenPath: string): string {
  return `var(--xeg-${tokenPath.replace(/\./g, '-')})`;
}

/**
 * 토큰 값 조회 유틸리티
 */
export function getTokenValue(tokenPath: string): string | number {
  const keys = tokenPath.split('.');
  let value: unknown = DESIGN_TOKENS;

  for (const key of keys) {
    if (typeof value === 'object' && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      console.warn(`Design token not found: ${tokenPath}`);
      return '';
    }
  }

  return typeof value === 'string' || typeof value === 'number' ? value : '';
}

/**
 * 테마별 토큰 값 조회
 */
export function getThemeTokenValue(tokenPath: string, theme: 'light' | 'dark' = 'light'): string {
  const baseValue = getTokenValue(tokenPath);

  // 테마별 오버라이드 로직
  if (theme === 'dark') {
    // 다크 테마 특별 처리
    if (tokenPath.includes('surface.light')) {
      return DESIGN_TOKENS.colors.surface.dark;
    }
    if (tokenPath.includes('neutral.50')) {
      return DESIGN_TOKENS.colors.neutral[950];
    }
    if (tokenPath.includes('neutral.900')) {
      return DESIGN_TOKENS.colors.neutral[50];
    }
  }

  return String(baseValue);
}
