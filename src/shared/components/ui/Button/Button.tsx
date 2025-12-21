/**
 * @fileoverview Unified Button Component - Solid.js implementation
 * @version 4.1.0 - Phase 385: Universal button component
 * @description All-purpose button component supporting multiple variants, sizes, and intents
 * @module @shared/components/ui/Button
 */

import type { JSXElement } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { toAccessor } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js';
import styles from './Button.module.css';
import type { ButtonProps } from './Button.types';

// Re-export types for external consumers
export type { ButtonIntent, ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

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

  createEffect(() => {
    if (!__DEV__) {
      return;
    }
    if (!iconOnlyAccessor()) return;
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
  // Store element ref to ensure direct DOM property updates for attributes like disabled
  const [elementRef, setElementRef] = createSignal<HTMLButtonElement | null>(null);
  // Compute button state accessors
  // Use resolved accessors to support signal/function props
  // isDisabled is defined above (resolves accessors safely)

  const handleClick = (event: MouseEvent) => {
    if (isDisabled() || isLoading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    local.onClick?.(event);
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (isDisabled()) {
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
    cx(
      styles.unifiedButton,
      styles[`variant-${local.variant}`],
      styles[`size-${local.size}`],
      local.intent ? styles[`intent-${local.intent}`] : undefined,
      iconOnlyAccessor() ? styles.iconOnly : undefined,
      isLoading() ? styles.loading : undefined,
      isDisabled() ? styles.disabled : undefined,
      'xeg-inline-center',
      'xeg-gap-sm',
      typeof local.className === 'function' ? (local.className as () => string)() : local.className,
      typeof local.class === 'function' ? (local.class as () => string)() : local.class
    );

  // Keep the DOM disabled property in sync with the isDisabled() accessor
  const loadingClassName = styles.loading;
  createEffect(() => {
    const el = elementRef();
    const disabledNow = isDisabled();
    const loadingNow = isLoading();
    if (!el) return;

    el.disabled = disabledNow;
    el.setAttribute('aria-disabled', String(disabledNow));

    // Debug data attributes (dev only)
    if (__DEV__) {
      el.dataset.debugIsdisabled = String(disabledNow);
      el.dataset.debugPropertyDisabled = String(el.disabled);
      el.dataset.debugAttrDisabled = String(el.hasAttribute('disabled'));
    }

    // Sync loading class
    if (loadingClassName) {
      el.classList.toggle(loadingClassName, loadingNow);
    }
  });

  return (
    <button
      {...rest}
      ref={(element) => {
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
      data-testid={__DEV__ ? local['data-testid'] : undefined}
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
      {isLoading() && <span class={cx('xeg-spinner', styles.spinner)} aria-hidden="true" />}
      {local.children}
    </button>
  );
}
