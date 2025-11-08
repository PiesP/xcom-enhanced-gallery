/**
 * @fileoverview Design Tokens - Spacing & Border Radius
 *
 * ⚠️ **Note**: CSS variables (design-tokens.*.css 3-level system) are SSOT (Single Source of Truth).
 * This file is maintained for JS-based type safety and IDE autocomplete.
 * When adding new tokens, define CSS variables first, then update this file.
 *
 * Spacing and border-radius token definitions for consistent design system
 * Uses 8px-based grid system + 4px auxiliary unit
 */

/**
 * Spacing Scale (8px-based)
 * - Uses minimum 4px unit for accessibility
 * - Considers touch target size (minimum 44px)
 * - Based on CSS variable `--xeg-spacing-*`
 */
export const SPACING_TOKENS = {
  /** 2px - Very small spacing (inside icons etc) */
  xs: '2px',

  /** 4px - Small spacing (button interior, icon margin) */
  sm: '4px',

  /** 8px - Base spacing (general padding/margin) */
  md: '8px',

  /** 12px - Medium spacing (between sections) */
  lg: '12px',

  /** 16px - Large spacing (card interior, important sections) */
  xl: '16px',

  /** 24px - Very large spacing (modal, container) */
  xxl: '24px',

  /** 32px - Maximum spacing (page-level margin) */
  xxxl: '32px',
} as const;

/**
 * Border Radius Scale (4px-based)
 * - Consistent corner style
 * - Appropriate roundness considering accessibility
 * - Based on CSS variable `--xeg-radius-*`
 */
export const RADIUS_TOKENS = {
  /** 0 - No corner */
  none: '0',

  /** 2px - Very small roundness (input field) */
  xs: '2px',

  /** 4px - Small roundness (button, tag) */
  sm: '4px',

  /** 8px - Medium roundness (card, modal) */
  md: '8px',

  /** 12px - Large roundness (container) */
  lg: '12px',

  /** 50% - Perfect circle (icon, avatar) */
  full: '50%',
} as const;

/**
 * Token type definition
 */
export type SpacingToken = keyof typeof SPACING_TOKENS;
export type RadiusToken = keyof typeof RADIUS_TOKENS;

/**
 * 토큰 값 반환 헬퍼 함수
 * @example
 * ```ts
 * const spacingValue = getSpacing('md'); // '8px'
 * const radiusValue = getRadius('lg');   // '12px'
 * ```
 */
export function getSpacing(token: SpacingToken): string {
  return SPACING_TOKENS[token];
}

export function getRadius(token: RadiusToken): string {
  return RADIUS_TOKENS[token];
}

/**
 * CSS 변수명 반환 헬퍼 함수
 * @example
 * ```ts
 * const spacingVar = getSpacingVar('md');   // 'var(--spacing-md)'
 * const radiusVar = getRadiusVar('lg');     // 'var(--radius-lg)'
 * ```
 */
export function getSpacingVar(token: SpacingToken): string {
  return `var(--spacing-${token})`;
}

export function getRadiusVar(token: RadiusToken): string {
  return `var(--radius-${token})`;
}
