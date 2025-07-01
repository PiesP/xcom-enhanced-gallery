/**
 * @fileoverview Unified Design System
 * @description Centralized design token system for clear separation of CSS and JavaScript responsibilities
 * @version 1.0.0
 */

/**
 * Design Tokens - CSS Variable Based
 */
export class DesignSystem {
  /**
   * 스페이싱 토큰
   */
  static readonly spacing = {
    xs: 'var(--xeg-spacing-xs, 4px)',
    sm: 'var(--xeg-spacing-sm, 8px)',
    md: 'var(--xeg-spacing-md, 16px)',
    lg: 'var(--xeg-spacing-lg, 24px)',
    xl: 'var(--xeg-spacing-xl, 32px)',
    xxl: 'var(--xeg-spacing-xxl, 48px)',
  } as const;

  /**
   * 색상 토큰
   */
  static readonly colors = {
    // Primary colors
    primary: 'var(--xeg-color-primary, #1d9bf0)',
    primaryHover: 'var(--xeg-color-primary-hover, #1a8cd8)',
    primaryActive: 'var(--xeg-color-primary-active, #1570b3)',
    primaryLight: 'var(--xeg-color-primary-light, rgba(29, 155, 240, 0.1))',

    // Semantic colors
    success: 'var(--xeg-color-success, #10b981)',
    warning: 'var(--xeg-color-warning, #f59e0b)',
    error: 'var(--xeg-color-error, #dc2626)',
    info: 'var(--xeg-color-info, #3b82f6)',

    // Neutral colors
    white: 'var(--xeg-color-white, #ffffff)',
    black: 'var(--xeg-color-black, #000000)',
    gray50: 'var(--xeg-color-gray-50, #f9fafb)',
    gray100: 'var(--xeg-color-gray-100, #f3f4f6)',
    gray200: 'var(--xeg-color-gray-200, #e5e7eb)',
    gray300: 'var(--xeg-color-gray-300, #d1d5db)',
    gray400: 'var(--xeg-color-gray-400, #9ca3af)',
    gray500: 'var(--xeg-color-gray-500, #6b7280)',
    gray600: 'var(--xeg-color-gray-600, #4b5563)',
    gray700: 'var(--xeg-color-gray-700, #374151)',
    gray800: 'var(--xeg-color-gray-800, #1f2937)',
    gray900: 'var(--xeg-color-gray-900, #111827)',

    // Text colors
    textPrimary: 'var(--xeg-color-text-primary, #0f1419)',
    textSecondary: 'var(--xeg-color-text-secondary, #536471)',
    textTertiary: 'var(--xeg-color-text-tertiary, #8b98a5)',
    textInverse: 'var(--xeg-color-text-inverse, #ffffff)',

    // Surface colors
    surface: 'var(--xeg-color-surface, #ffffff)',
    surfaceElevated: 'var(--xeg-color-surface-elevated, #ffffff)',
    overlay: 'var(--xeg-color-overlay, rgba(0, 0, 0, 0.8))',
  } as const;

  /**
   * 타이포그래피 토큰
   */
  static readonly typography = {
    fontSize: {
      xs: 'var(--xeg-font-size-xs, 12px)',
      sm: 'var(--xeg-font-size-sm, 14px)',
      md: 'var(--xeg-font-size-md, 16px)',
      lg: 'var(--xeg-font-size-lg, 18px)',
      xl: 'var(--xeg-font-size-xl, 20px)',
      xxl: 'var(--xeg-font-size-xxl, 24px)',
    },
    fontWeight: {
      normal: 'var(--xeg-font-weight-normal, 400)',
      medium: 'var(--xeg-font-weight-medium, 500)',
      semibold: 'var(--xeg-font-weight-semibold, 600)',
      bold: 'var(--xeg-font-weight-bold, 700)',
    },
    lineHeight: {
      tight: 'var(--xeg-line-height-tight, 1.25)',
      normal: 'var(--xeg-line-height-normal, 1.5)',
      relaxed: 'var(--xeg-line-height-relaxed, 1.75)',
    },
  } as const;

  /**
   * 모션 토큰
   */
  static readonly motion = {
    duration: {
      fast: 'var(--xeg-duration-fast, 150ms)',
      normal: 'var(--xeg-duration-normal, 300ms)',
      slow: 'var(--xeg-duration-slow, 500ms)',
    },
    easing: {
      easeOut: 'var(--xeg-ease-out, cubic-bezier(0.0, 0.0, 0.2, 1))',
      easeIn: 'var(--xeg-ease-in, cubic-bezier(0.4, 0.0, 1, 1))',
      easeInOut: 'var(--xeg-ease-in-out, cubic-bezier(0.4, 0.0, 0.2, 1))',
    },
  } as const;

  /**
   * 레이아웃 토큰
   */
  static readonly layout = {
    borderRadius: {
      none: 'var(--xeg-radius-none, 0)',
      sm: 'var(--xeg-radius-sm, 4px)',
      md: 'var(--xeg-radius-md, 8px)',
      lg: 'var(--xeg-radius-lg, 12px)',
      xl: 'var(--xeg-radius-xl, 16px)',
      full: 'var(--xeg-radius-full, 9999px)',
    },
    zIndex: {
      gallery: 'var(--xeg-z-gallery, 10000)',
      modal: 'var(--xeg-z-modal, 9999)',
      overlay: 'var(--xeg-z-overlay, 9998)',
      dropdown: 'var(--xeg-z-dropdown, 1000)',
      toast: 'var(--xeg-z-toast, 10001)',
    },
    shadow: {
      sm: 'var(--xeg-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
      md: 'var(--xeg-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
      lg: 'var(--xeg-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
      xl: 'var(--xeg-shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
    },
  } as const;

  /**
   * 컴포넌트별 스타일 스키마
   */
  static readonly components = {
    button: {
      base: 'xeg-button',
      variants: {
        primary: 'xeg-button--primary',
        secondary: 'xeg-button--secondary',
        ghost: 'xeg-button--ghost',
        danger: 'xeg-button--danger',
      },
      sizes: {
        sm: 'xeg-button--sm',
        md: 'xeg-button--md',
        lg: 'xeg-button--lg',
      },
      states: {
        loading: 'xeg-button--loading',
        disabled: 'xeg-button--disabled',
        active: 'xeg-button--active',
      },
    },
    gallery: {
      base: 'xeg-gallery',
      states: {
        open: 'xeg-gallery--open',
        loading: 'xeg-gallery--loading',
        error: 'xeg-gallery--error',
        closing: 'xeg-gallery--closing',
      },
      elements: {
        overlay: 'xeg-gallery__overlay',
        container: 'xeg-gallery__container',
        content: 'xeg-gallery__content',
        toolbar: 'xeg-gallery__toolbar',
        media: 'xeg-gallery__media',
      },
    },
    toast: {
      base: 'xeg-toast',
      variants: {
        info: 'xeg-toast--info',
        success: 'xeg-toast--success',
        warning: 'xeg-toast--warning',
        error: 'xeg-toast--error',
      },
      states: {
        entering: 'xeg-toast--entering',
        exiting: 'xeg-toast--exiting',
      },
    },
    toolbar: {
      base: 'xeg-toolbar',
      states: {
        visible: 'xeg-toolbar--visible',
        hidden: 'xeg-toolbar--hidden',
      },
      sections: {
        left: 'xeg-toolbar__left',
        center: 'xeg-toolbar__center',
        right: 'xeg-toolbar__right',
      },
    },
  } as const;

  /**
   * 유틸리티 클래스
   */
  static readonly utilities = {
    // Layout
    flex: 'xeg-flex',
    flexCenter: 'xeg-flex-center',
    flexBetween: 'xeg-flex-between',
    flexCol: 'xeg-flex-col',
    grid: 'xeg-grid',
    hidden: 'xeg-hidden',
    srOnly: 'xeg-sr-only',

    // Positioning
    relative: 'xeg-relative',
    absolute: 'xeg-absolute',
    fixed: 'xeg-fixed',
    sticky: 'xeg-sticky',
    fullSize: 'xeg-full-size',

    // Spacing
    p: {
      xs: 'xeg-p-xs',
      sm: 'xeg-p-sm',
      md: 'xeg-p-md',
      lg: 'xeg-p-lg',
      xl: 'xeg-p-xl',
    },
    m: {
      xs: 'xeg-m-xs',
      sm: 'xeg-m-sm',
      md: 'xeg-m-md',
      lg: 'xeg-m-lg',
      xl: 'xeg-m-xl',
    },

    // Effects
    blur: 'xeg-blur',
    shadow: {
      sm: 'xeg-shadow-sm',
      md: 'xeg-shadow-md',
      lg: 'xeg-shadow-lg',
    },
    rounded: {
      none: 'xeg-rounded-none',
      sm: 'xeg-rounded-sm',
      md: 'xeg-rounded-md',
      lg: 'xeg-rounded-lg',
      full: 'xeg-rounded-full',
    },

    // Animation
    transition: 'xeg-transition',
    fadeIn: 'xeg-fade-in',
    fadeOut: 'xeg-fade-out',
    scaleIn: 'xeg-scale-in',

    // Interactive
    hoverLift: 'xeg-hover-lift',
    focusRing: 'xeg-focus-ring',
  } as const;

  /**
   * CSS 클래스 생성 헬퍼
   */
  static createClassName(
    base: string,
    variants: Record<string, boolean | string | undefined> = {},
    utilities: string[] = []
  ): string {
    const classes = [base];

    // Add variant classes
    Object.entries(variants).forEach(([key, value]) => {
      if (value === true) {
        classes.push(`${base}--${key}`);
      } else if (typeof value === 'string' && value) {
        classes.push(`${base}--${key}-${value}`);
      }
    });

    // Add utility classes
    classes.push(...utilities);

    return classes.filter(Boolean).join(' ');
  }

  /**
   * CSS 변수 값 가져오기
   */
  static getCSSVariable(variableName: string): string {
    if (typeof window === 'undefined') return '';

    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  }

  /**
   * CSS 변수 설정
   */
  static setCSSVariable(variableName: string, value: string): void {
    if (typeof window === 'undefined') return;

    document.documentElement.style.setProperty(variableName, value);
  }

  /**
   * 테마 설정
   */
  static setTheme(theme: 'light' | 'dark' | 'auto'): void {
    if (typeof window === 'undefined') return;

    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * 현재 테마 가져오기
   */
  static getCurrentTheme(): 'light' | 'dark' | 'auto' {
    if (typeof window === 'undefined') return 'auto';

    return (
      (document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | 'auto') || 'auto'
    );
  }
}

/**
 * 타입 안전성을 위한 토큰 타입들
 */
export type SpacingToken = keyof typeof DesignSystem.spacing;
export type ColorToken = keyof typeof DesignSystem.colors;
export type FontSizeToken = keyof typeof DesignSystem.typography.fontSize;
export type FontWeightToken = keyof typeof DesignSystem.typography.fontWeight;
export type DurationToken = keyof typeof DesignSystem.motion.duration;
export type EasingToken = keyof typeof DesignSystem.motion.easing;
export type RadiusToken = keyof typeof DesignSystem.layout.borderRadius;
export type ZIndexToken = keyof typeof DesignSystem.layout.zIndex;
export type ShadowToken = keyof typeof DesignSystem.layout.shadow;

/**
 * 컴포넌트 관련 타입들
 */
export type ButtonVariant = keyof typeof DesignSystem.components.button.variants;
export type ButtonSize = keyof typeof DesignSystem.components.button.sizes;
export type ButtonState = keyof typeof DesignSystem.components.button.states;

export type GalleryState = keyof typeof DesignSystem.components.gallery.states;
export type GalleryElement = keyof typeof DesignSystem.components.gallery.elements;

export type ToastVariant = keyof typeof DesignSystem.components.toast.variants;
export type ToastState = keyof typeof DesignSystem.components.toast.states;

export type ToolbarState = keyof typeof DesignSystem.components.toolbar.states;
export type ToolbarSection = keyof typeof DesignSystem.components.toolbar.sections;
