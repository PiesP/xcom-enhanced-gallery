/**
 * @fileoverview Unified Button Component - Solid.js implementation
 * @version 4.1.0 - Phase 385: Universal button component
 * @description All-purpose button component supporting multiple variants, sizes, and intents
 * @module @shared/components/ui/Button
 *
 * Features:
 * - Multiple button variants: primary, secondary, icon, danger, ghost, toolbar, navigation, action
 * - Flexible sizing: sm, md, lg, toolbar
 * - Intent system: primary, secondary, success, warning, danger
 * - Accessibility: ARIA attributes, keyboard navigation, disabled state handling
 * - Loading state support with spinner animation
 * - CSS Modules for style isolation
 * - Icon-only button support with accessibility validation
 *
 * @example
 * ```tsx
 * import { Button } from '@shared/components/ui/Button';
 *
 * // Primary button
 * <Button onClick={handleClick}>Download</Button>
 *
 * // Icon button with loading state
 * <Button variant="icon" iconOnly loading aria-label="Save">
 *   <SaveIcon />
 * </Button>
 *
 * // Danger button
 * <Button variant="danger" intent="danger">Delete</Button>
 * ```
 */

import { getSolid, type ComponentChildren, type JSXElement } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { createClassName } from '@shared/utils/component-utils';
import styles from './Button.module.css';

const solid = getSolid();
const { mergeProps, splitProps, createEffect, onCleanup } = solid;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Button visual variant
 * @description Determines button appearance and behavior
 */
type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'icon'
  | 'danger'
  | 'ghost'
  | 'toolbar'
  | 'navigation'
  | 'action';

/** Button size options */
type ButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';

/** Button semantic intent color */
type ButtonIntent = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * Standard HTML button attributes
 * @description Base HTML attributes for button element
 */
interface ButtonHTMLAttributes {
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

// ============================================================================
// Default Props
// ============================================================================

type DefaultKeys = 'variant' | 'size' | 'type' | 'iconOnly' | 'disabled' | 'loading';

/**
 * Default property values
 * @description Fallback values when props not provided
 */
const defaultProps: Required<Pick<ButtonProps, DefaultKeys>> = {
  variant: 'primary',
  size: 'md',
  type: 'button',
  iconOnly: false,
  disabled: false,
  loading: false,
};

// ============================================================================
// Button Component
// ============================================================================

/**
 * Unified Button Component
 * @description Main button component supporting all button use cases
 *
 * @param rawProps - Button configuration props
 * @returns Solid.js JSXElement button
 *
 * @note Icon-only buttons require aria-label or aria-labelledby for accessibility
 * @note Loading state disables interaction and shows spinner
 *
 * @example
 * ```tsx
 * const Button1 = () => <Button>Click me</Button>;
 * const Button2 = () => <Button variant="icon" iconOnly aria-label="Download"><DownloadIcon /></Button>;
 * const Button3 = () => <Button loading>Processing...</Button>;
 * ```
 */
export function Button(rawProps: ButtonProps): JSXElement {
  const props = mergeProps(defaultProps, rawProps);
  const [local, rest] = splitProps(props, [
    'children',
    'variant',
    'size',
    'intent',
    'iconOnly',
    'loading',
    'ref',
    'className',
    'class',
    'id',
    'type',
    'form',
    'autoFocus',
    'disabled',
    'tabIndex',
    'title',
    'onClick',
    'onMouseDown',
    'onMouseUp',
    'onFocus',
    'onBlur',
    'onKeyDown',
    'onMouseEnter',
    'onMouseLeave',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-pressed',
    'aria-expanded',
    'aria-controls',
    'aria-haspopup',
    'aria-busy',
    'data-testid',
    'data-gallery-element',
    'data-disabled',
    'data-selected',
    'data-loading',
  ]);

  // Validate icon-only buttons have accessibility labels
  createEffect(() => {
    if (!local.iconOnly) {
      return;
    }

    const derived = local['aria-label'] ?? local['aria-labelledby'] ?? local.title;
    if (!derived) {
      logger.warn(
        'Icon-only buttons must have accessible labels (aria-label or aria-labelledby).',
        {
          component: 'UnifiedButton',
          variant: local.variant,
          iconOnly: true,
        }
      );
    }
  });

  // Cleanup ref on unmount
  onCleanup(() => {
    local.ref?.(null);
  });
  // Compute button state accessors
  const isDisabled = () => local.disabled || local.loading;

  const handleClick = (event: MouseEvent) => {
    if (isDisabled()) {
      event.preventDefault();
      return;
    }
    local.onClick?.(event);
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (isDisabled()) {
      event.preventDefault();
      return;
    }
    local.onMouseDown?.(event);
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (isDisabled()) {
      return;
    }
    local.onMouseUp?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isDisabled()) {
      return;
    }
    local.onKeyDown?.(event);
  };

  /**
   * Generate combined class names
   * @description Merges variant, size, intent, and state classes from CSS Module
   */
  const buttonClasses = () =>
    createClassName(
      styles.unifiedButton,
      styles[`variant-${local.variant}`],
      styles[`size-${local.size}`],
      local.intent ? styles[`intent-${local.intent}`] : undefined,
      local.iconOnly ? styles.iconOnly : undefined,
      local.loading ? styles.loading : undefined,
      local.disabled ? styles.disabled : undefined,
      local.className,
      local.class
    );

  return (
    <button
      {...rest}
      ref={element => {
        if (typeof local.ref === 'function') {
          local.ref(element ?? null);
        }
      }}
      type={local.type}
      form={local.form}
      autofocus={local.autoFocus}
      disabled={isDisabled()}
      class={buttonClasses()}
      id={local.id}
      aria-label={local['aria-label']}
      aria-labelledby={local['aria-labelledby']}
      aria-describedby={local['aria-describedby']}
      aria-pressed={local['aria-pressed']}
      aria-expanded={local['aria-expanded']}
      aria-controls={local['aria-controls']}
      aria-haspopup={local['aria-haspopup']}
      aria-busy={local['aria-busy'] ?? local.loading}
      aria-disabled={isDisabled()}
      tabIndex={isDisabled() ? -1 : local.tabIndex}
      data-testid={local['data-testid']}
      data-gallery-element={local['data-gallery-element']}
      data-disabled={local['data-disabled']}
      data-selected={local['data-selected']}
      data-loading={local['data-loading']}
      title={local.title}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={local.onFocus}
      onBlur={local.onBlur}
      onKeyDown={handleKeyDown}
      onMouseEnter={local.onMouseEnter}
      onMouseLeave={local.onMouseLeave}
    >
      {local.loading && <span class={styles.spinner} aria-hidden='true' />}
      {local.children}
    </button>
  );
}
