/**
 * @fileoverview Button 전용 Semantic Token Layer
 * @description Button 컴포넌트에서 사용하는 의미론적 토큰들
 * @version 1.0.0
 */

export const BUTTON_TOKENS = {
  // Button Variants
  PRIMARY: 'var(--xeg-color-primary)',
  PRIMARY_HOVER: 'var(--xeg-color-primary-hover)',
  PRIMARY_ACTIVE: 'var(--xeg-color-primary-active)',

  SECONDARY: 'var(--xeg-color-bg-secondary)',
  SECONDARY_HOVER: 'var(--xeg-color-bg-hover)',

  DANGER: 'var(--xeg-color-error)',
  DANGER_HOVER: 'var(--xeg-color-error-hover)',

  // Button Sizes
  SIZE_SM: {
    height: 'var(--space-lg)',
    padding: 'var(--space-xs) var(--space-sm)',
    fontSize: '0.875rem',
    borderRadius: 'var(--xeg-radius-md)',
  },

  SIZE_MD: {
    height: 'var(--space-xl)',
    padding: 'var(--space-sm) var(--space-md)',
    fontSize: '1rem',
    borderRadius: 'var(--xeg-radius-lg)',
  },

  SIZE_LG: {
    height: 'var(--space-2xl)',
    padding: 'var(--space-md) var(--space-lg)',
    fontSize: '1.125rem',
    borderRadius: 'var(--xeg-radius-xl)',
  },

  // Button States
  DISABLED_OPACITY: 'var(--xeg-opacity-disabled)',
  HOVER_TRANSFORM: 'var(--xeg-button-lift)',
  ACTIVE_TRANSFORM: 'translateY(0)',

  // Focus Ring
  FOCUS_RING: 'var(--xeg-focus-ring)',
  FOCUS_RING_OFFSET: 'var(--xeg-focus-ring-offset)',

  // Transitions
  TRANSITION: 'var(--xeg-transition-fast)',
} as const;

export type ButtonTokenKey = keyof typeof BUTTON_TOKENS;
