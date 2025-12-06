/**
 * @fileoverview Button Component Type Definitions
 * @description Type definitions for unified Button component
 * @module @shared/components/ui/Button/Button.types
 * @version 4.1.0 - Phase 385: Universal button component
 */

import type { ComponentChildren } from '@shared/external/vendors';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Button visual variant
 * @description Determines button appearance and behavior
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'icon'
  | 'danger'
  | 'ghost'
  | 'toolbar'
  | 'navigation'
  | 'action';

/**
 * Button size
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';

/**
 * Button semantic intent color
 */
export type ButtonIntent = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * Standard HTML button attributes
 * @description Base HTML attributes for button element
 */
export interface ButtonHTMLAttributes {
  readonly id?: string;
  readonly className?: string;
  readonly class?: string;
  readonly disabled?: boolean;
  readonly form?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly autoFocus?: boolean;
  readonly tabIndex?: number;
  readonly title?: string;
  readonly key?: string;
  readonly onClick?: (event: MouseEvent) => void;
  readonly onMouseDown?: (event: MouseEvent) => void;
  readonly onMouseUp?: (event: MouseEvent) => void;
  readonly onFocus?: (event: FocusEvent) => void;
  readonly onBlur?: (event: FocusEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
  readonly onMouseEnter?: (event: MouseEvent) => void;
  readonly onMouseLeave?: (event: MouseEvent) => void;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-pressed'?: boolean | 'true' | 'false';
  readonly 'aria-expanded'?: boolean | 'true' | 'false';
  readonly 'aria-controls'?: string;
  readonly 'aria-haspopup'?: boolean | 'true' | 'false';
  readonly 'aria-busy'?: boolean | 'true' | 'false';
  readonly 'data-testid'?: string;
  readonly 'data-gallery-element'?: string;
  readonly 'data-disabled'?: boolean | string;
  readonly 'data-selected'?: boolean | string;
  readonly 'data-loading'?: boolean | string;
}

/**
 * Button component props
 * @description Configuration options for Button component
 */
export interface ButtonProps extends ButtonHTMLAttributes {
  /** Child elements to render inside button */
  readonly children?: ComponentChildren;
  /** Visual variant style */
  readonly variant?: ButtonVariant;
  /** Button size */
  readonly size?: ButtonSize;
  /** Semantic color intent */
  readonly intent?: ButtonIntent;
  /** Icon-only button (no text) */
  readonly iconOnly?: boolean;
  /** Loading state (shows spinner) */
  readonly loading?: boolean;
  /** Ref callback to button element */
  readonly ref?: (element: HTMLButtonElement | null) => void;
}
