/**
 * @fileoverview 통합 디자인 토큰 시스템
 * @description 모든 CSS 변수와 디자인 상수를 중앙 집중식으로 관리
 * @version 2.0.0 - 완전 통합 및 중복 제거
 */

/**
 * 색상 스케일 인터페이스
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
 * 의미적 색상 인터페이스
 */
export interface SemanticColors {
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

/**
 * 표면 색상 인터페이스
 */
export interface SurfaceColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  overlay: {
    light: string;
    medium: string;
    strong: string;
  };
}

/**
 * 색상 토큰 인터페이스
 */
export interface ColorTokens {
  primary: ColorScale;
  neutral: ColorScale;
  semantic: SemanticColors;
  surface: SurfaceColors;
}

/**
 * 간격 토큰 인터페이스
 */
export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
}

/**
 * 타이포그래피 토큰 인터페이스
 */
export interface TypographyTokens {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    xxxl: string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

/**
 * 그림자 토큰 인터페이스
 */
export interface ShadowTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/**
 * 애니메이션 토큰 인터페이스
 */
export interface AnimationTokens {
  duration: {
    fast: string;
    normal: string;
    slow: string;
    slower: string;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

/**
 * 브레이크포인트 토큰 인터페이스
 */
export interface BreakpointTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/**
 * 통합 디자인 토큰 인터페이스
 */
export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  animation: AnimationTokens;
  breakpoints: BreakpointTokens;
}

/**
 * 라이트 테마 토큰
 */
export const lightThemeTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // base - X.com 브랜드 컬러와 조화
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
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
    },
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
      },
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
      },
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
      },
      info: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9', // base
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
        950: '#082f49',
      },
    },
    surface: {
      background: {
        primary: '#ffffff',
        secondary: '#f9fafb',
        tertiary: '#f3f4f6',
      },
      overlay: {
        light: 'rgba(255, 255, 255, 0.8)',
        medium: 'rgba(255, 255, 255, 0.9)',
        strong: 'rgba(255, 255, 255, 0.95)',
      },
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      xxxl: '30px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '800ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
};

/**
 * 다크 테마 토큰
 */
export const darkThemeTokens: DesignTokens = {
  ...lightThemeTokens, // 기본값은 라이트 테마와 동일
  colors: {
    ...lightThemeTokens.colors,
    neutral: {
      // 다크 테마에서는 neutral 색상 스케일을 뒤집음
      50: '#0a0a0a',
      100: '#171717',
      200: '#262626',
      300: '#404040',
      400: '#525252',
      500: '#737373', // base (동일)
      600: '#a3a3a3',
      700: '#d4d4d4',
      800: '#e5e5e5',
      900: '#f5f5f5',
      950: '#fafafa',
    },
    surface: {
      background: {
        primary: '#0a0a0a',
        secondary: '#171717',
        tertiary: '#262626',
      },
      overlay: {
        light: 'rgba(0, 0, 0, 0.8)',
        medium: 'rgba(0, 0, 0, 0.9)',
        strong: 'rgba(0, 0, 0, 0.95)',
      },
    },
  },
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.24)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.24)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.16)',
    xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
};

/**
 * 기본 디자인 토큰 (라이트 테마)
 */
export const DESIGN_TOKENS = lightThemeTokens;

/**
 * 테마별 디자인 토큰 액세스
 */
export const getDesignTokens = (theme: 'light' | 'dark' = 'light'): DesignTokens => {
  return theme === 'dark' ? darkThemeTokens : lightThemeTokens;
};
