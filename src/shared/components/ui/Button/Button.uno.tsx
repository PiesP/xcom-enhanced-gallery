/**
 * @fileoverview UnoCSS Button Component - Atomic CSS implementation
 * @version 1.0.0 - CSS Modules to UnoCSS Migration
 * @description Modern button component using UnoCSS shortcuts instead of CSS Modules
 * @module @shared/components/ui/Button
 *
 * Features:
 * - Multiple button variants: primary, secondary, icon, danger, ghost, toolbar, navigation, action
 * - Flexible sizing: sm, md, lg, toolbar
 * - Intent system: primary, secondary, success, warning, danger
 * - Accessibility: ARIA attributes, keyboard navigation, disabled state handling
 * - Loading state support with spinner animation
 * - UnoCSS atomic classes for style isolation and bundle optimization
 * - Icon-only button support with accessibility validation
 *
 * @example
 * ```tsx
 * import { Button } from '@shared/components/ui/Button/Button.uno';
 *
 * // Primary button
 * <Button onClick={handleClick}>Download</Button>
 *
 * // Icon button with loading state
 * <Button variant="icon" iconOnly loading aria-label="Save">
 *   <SaveIcon />
 * </Button>
 * ```
 */

import type { ComponentChildren, JSXElement } from '@shared/external/vendors';
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from '@shared/external/vendors/solid-hooks';
import { logger } from '@shared/logging';
import { toAccessor } from '@shared/utils/solid/solid-helpers';
import { createClassName } from '@shared/utils/text/formatting';

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
  | 'outline'
  | 'toolbar'
  | 'navigation'
  | 'action';

/**
 * Button size
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';

/**
 * Button intent - semantic color variants
 */
type ButtonIntent = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';

/**
 * Standard HTML button attributes
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
// UnoCSS Class Mappings
// ============================================================================

/**
 * Size to UnoCSS class mapping
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'xeg-btn-size-sm',
  md: 'xeg-btn-size-md',
  lg: 'xeg-btn-size-lg',
  toolbar: 'xeg-btn-size-toolbar',
};

/**
 * Variant to UnoCSS class mapping
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'xeg-btn-variant-primary',
  secondary: 'xeg-btn-variant-secondary',
  outline: 'xeg-btn-variant-outline',
  ghost: 'xeg-btn-variant-ghost',
  danger: 'xeg-btn-variant-danger',
  icon: 'xeg-btn-variant-icon',
  toolbar: 'xeg-btn-variant-toolbar',
  navigation: 'xeg-btn-variant-navigation',
  action: 'xeg-btn-variant-action',
};

/**
 * Intent to UnoCSS class mapping
 */
const intentClasses: Record<ButtonIntent, string> = {
  primary: 'xeg-btn-intent-primary',
  secondary: '', // No specific intent class for secondary
  success: 'xeg-btn-intent-success',
  warning: '', // Map warning to danger for now
  danger: 'xeg-btn-intent-danger',
  neutral: 'xeg-btn-intent-neutral',
};

/**
 * Icon-only size modifiers
 */
const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: 'xeg-btn-icon-only-sm',
  md: 'xeg-btn-icon-only-md',
  lg: 'xeg-btn-icon-only-lg',
  toolbar: '', // Toolbar size handles its own dimensions
};

// ============================================================================
// Default Props
// ============================================================================

type DefaultKeys = 'variant' | 'size' | 'type' | 'iconOnly' | 'disabled' | 'loading';

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
 * UnoCSS Button Component
 *
 * Modern button implementation using UnoCSS atomic classes for optimal
 * bundle size and consistent styling across the application.
 *
 * @param rawProps - Button configuration props
 * @returns Solid.js JSXElement button
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="icon" iconOnly aria-label="Download"><DownloadIcon /></Button>
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

  // Create reactive accessors for props
  type ReactivePropKey =
    | 'loading'
    | 'disabled'
    | 'aria-busy'
    | 'aria-pressed'
    | 'aria-describedby'
    | 'title'
    | 'aria-label'
    | 'aria-labelledby'
    | 'iconOnly';

  const fallbackProps = local as ButtonProps;
  const resolvePropAccessor =
    <K extends ReactivePropKey>(key: K) =>
    () =>
      (rawProps[key] ?? fallbackProps[key]) as ButtonProps[K];

  const iconOnlyAccessor = toAccessor(resolvePropAccessor('iconOnly'));
  const loadingAccessor = toAccessor(resolvePropAccessor('loading'));
  const disabledAccessor = toAccessor(resolvePropAccessor('disabled'));
  const ariaBusyAccessor = toAccessor(resolvePropAccessor('aria-busy'));
  const ariaPressedAccessor = toAccessor(resolvePropAccessor('aria-pressed'));
  const ariaDescribedbyAccessor = toAccessor(resolvePropAccessor('aria-describedby'));
  const titleAccessor = toAccessor(resolvePropAccessor('title'));
  const ariaLabelAccessor = toAccessor(resolvePropAccessor('aria-label'));
  const ariaLabelledByAccessor = toAccessor(resolvePropAccessor('aria-labelledby'));

  const isLoading = createMemo(() => !!loadingAccessor());
  const isDisabled = createMemo(() => !!disabledAccessor() || isLoading());

  // Validate icon-only buttons have accessibility labels
  createEffect(() => {
    if (!iconOnlyAccessor()) return;
    const derived = ariaLabelAccessor() ?? ariaLabelledByAccessor() ?? titleAccessor();
    if (!derived) {
      logger.warn(
        'Icon-only buttons must have accessible labels (aria-label or aria-labelledby).',
        {
          component: 'Button.uno',
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

  const [elementRef, setElementRef] = createSignal<HTMLButtonElement | null>(null);

  // Event handlers
  const handleClick = (event: MouseEvent) => {
    if (isDisabled() || isLoading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    local.onClick?.(event);
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (isDisabled()) return;
    local.onMouseDown?.(event);
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (isDisabled()) return;
    local.onMouseUp?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isDisabled()) return;
    local.onKeyDown?.(event);
  };

  /**
   * Generate UnoCSS class names
   */
  const buttonClasses = () => {
    const classes: string[] = [
      // Base button styles
      'xeg-btn-base',
      // Size variant
      sizeClasses[local.size],
      // Visual variant
      variantClasses[local.variant],
      // Layout utilities
      'xeg-inline-center',
      'xeg-gap-sm',
    ];

    // Intent modifier (if specified)
    if (local.intent && intentClasses[local.intent]) {
      classes.push(intentClasses[local.intent]);
    }

    // Icon-only mode
    if (iconOnlyAccessor()) {
      classes.push('xeg-btn-icon-only');
      const sizeModifier = iconOnlySizeClasses[local.size];
      if (sizeModifier) {
        classes.push(sizeModifier);
      }
    }

    // State classes
    if (isLoading()) {
      classes.push('xeg-btn-state-loading');
    }
    if (isDisabled()) {
      classes.push('xeg-btn-state-disabled');
    }

    // Focus ring for keyboard navigation
    classes.push('focus-visible:focus-ring');

    // Custom class names
    if (local.className) {
      classes.push(
        typeof local.className === 'function'
          ? (local.className as () => string)()
          : local.className
      );
    }
    if (local.class) {
      classes.push(
        typeof local.class === 'function' ? (local.class as () => string)() : local.class
      );
    }

    return createClassName(...classes);
  };

  // Keep DOM disabled property in sync
  createEffect(() => {
    const el = elementRef();
    const disabledNow = isDisabled();
    if (!el) return;

    el.disabled = disabledNow;
    el.setAttribute('aria-disabled', String(disabledNow));
  });

  return (
    <button
      {...rest}
      ref={element => {
        setElementRef(element ?? null);
        if (typeof local.ref === 'function') {
          local.ref(element ?? null);
        }
      }}
      disabled={isDisabled()}
      type={local.type}
      class={buttonClasses()}
      id={local.id}
      aria-expanded={local['aria-expanded']}
      aria-pressed={ariaPressedAccessor() ?? undefined}
      aria-describedby={ariaDescribedbyAccessor() ?? undefined}
      aria-label={ariaLabelAccessor() ?? undefined}
      aria-controls={local['aria-controls']}
      aria-haspopup={local['aria-haspopup']}
      aria-busy={ariaBusyAccessor() ?? isLoading()}
      aria-disabled={isDisabled()}
      tabIndex={
        isDisabled()
          ? -1
          : typeof local.tabIndex === 'function'
          ? (local.tabIndex as () => number)()
          : local.tabIndex
      }
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
      {isLoading() && <span class="xeg-btn-spinner xeg-spinner" aria-hidden="true" />}
      {local.children}
    </button>
  );
}

export default Button;
