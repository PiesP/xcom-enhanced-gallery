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
const { mergeProps, splitProps, createEffect, onCleanup, createMemo } = solid;
import { toAccessor } from '@shared/utils/solid-helpers';

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

/**
 * Button size
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';

/**
 * Button intent

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
  // Props like aria-*, disabled, loading may be either values or accessors.
  // Use toAccessor + createMemo to ensure reactive tracking and consistency.
  // Prefer rawProps accessors when available to preserve reactivity
  // (mergeProps may snapshot/resolve functions into primitive values)
  const loadingAccessor = toAccessor((rawProps as ButtonProps).loading ?? local.loading);
  const disabledAccessor = toAccessor((rawProps as ButtonProps).disabled ?? local.disabled);
  const ariaBusyAccessor = toAccessor((rawProps as ButtonProps)['aria-busy'] ?? local['aria-busy']);
  const titleAccessor = toAccessor((rawProps as ButtonProps).title ?? local.title);
  const ariaLabelAccessor = toAccessor(
    (rawProps as ButtonProps)['aria-label'] ?? local['aria-label']
  );
  const ariaLabelledByAccessor = toAccessor(
    (rawProps as ButtonProps)['aria-labelledby'] ?? local['aria-labelledby']
  );

  const isLoading = createMemo(() => !!loadingAccessor());
  const isDisabled = createMemo(() => !!disabledAccessor() || isLoading());

  // Debugging instrumentation: log state transitions for isDisabled and disabledAccessor
  createEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log(
        '[UnifiedButton] isDisabled:',
        isDisabled(),
        'disabledAccessor:',
        disabledAccessor()
      );
      if (__DEV__) {
        // Additional debug: inspect accessor identity and raw prop
        try {
          // eslint-disable-next-line no-console
          console.log(
            '[UnifiedButton:DEBUG] raw-disabled-identity-equals-accessor:',
            (rawProps as Record<string, unknown>).disabled === disabledAccessor
          );
          // eslint-disable-next-line no-console
          console.log(
            '[UnifiedButton:DEBUG] raw-disabled-type:',
            typeof (rawProps as Record<string, unknown>).disabled
          );
          // eslint-disable-next-line no-console
          console.log(
            '[UnifiedButton:DEBUG] disabledAccessor-return-type:',
            typeof disabledAccessor()
          );
        } catch {
          // ignore any ancillary errors during debug logs
        }
      }
    } catch {
      // ignore logging failures
    }
  });

  createEffect(() => {
    if (!toAccessor((rawProps as ButtonProps).iconOnly ?? local.iconOnly)()) return;
    const derived = ariaLabelAccessor() ?? ariaLabelledByAccessor() ?? titleAccessor();
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
  // Use resolved accessors to support signal/function props
  // isDisabled is defined above (resolves accessors safely)

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
      toAccessor(local.iconOnly)() ? styles.iconOnly : undefined,
      isLoading() ? styles.loading : undefined,
      isDisabled() ? styles.disabled : undefined,
      'xeg-inline-center',
      'xeg-gap-sm',
      typeof local.className === 'function' ? (local.className as Function)() : local.className,
      typeof local.class === 'function' ? (local.class as Function)() : local.class
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
      autofocus={
        typeof local.autoFocus === 'function' ? (local.autoFocus as Function)() : local.autoFocus
      }
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
      aria-busy={ariaBusyAccessor() ?? isLoading()}
      aria-disabled={isDisabled()}
      tabIndex={
        isDisabled()
          ? -1
          : typeof local.tabIndex === 'function'
            ? (local.tabIndex as Function)()
            : local.tabIndex
      }
      data-testid={local['data-testid']}
      data-gallery-element={local['data-gallery-element']}
      data-disabled={local['data-disabled']}
      data-selected={local['data-selected']}
      data-loading={local['data-loading']}
      {...(__DEV__
        ? {
            // Debug helper: reflect computed disabled state in dataset (temporary for test diagnostics)
            'data-debug-isdisabled': String(isDisabled()),
            // Debug helper: reveal the type of the local.disabled prop and accessor
            'data-debug-local-disabled-type': typeof local.disabled,
            'data-debug-disabled-accessor-type': typeof disabledAccessor,
            'data-debug-disabled-accessor-value': String(disabledAccessor()),
            // Debug: inspect rawProps to ensure original accessor passed through
            'data-debug-raw-disabled-type': typeof (rawProps as ButtonProps).disabled,
            'data-debug-raw-disabled-value': String(
              typeof (rawProps as ButtonProps).disabled === 'function'
                ? ((rawProps as Record<string, () => unknown>).disabled as () => unknown)()
                : (rawProps as ButtonProps).disabled
            ),
            'data-debug-raw-disabled-equals-accessor':
              typeof (rawProps as ButtonProps).disabled === 'function'
                ? String((rawProps as Record<string, unknown>).disabled === disabledAccessor)
                : 'false',
          }
        : {})}
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
      {isLoading() && (
        <span class={createClassName('xeg-spinner', styles.spinner)} aria-hidden='true' />
      )}
      {local.children}
    </button>
  );
}
