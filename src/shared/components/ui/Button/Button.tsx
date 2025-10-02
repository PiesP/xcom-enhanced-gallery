/**
 * @fileoverview Button - Unified Solid button component
 * @description FRAME-ALT-001 Stage D - Shared UI Solid implementation
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import primitiveStyles from '@shared/styles/primitives.module.css';
import styles from './Button.module.css';

function classnames(...classes: Array<string | null | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'icon'
  | 'danger'
  | 'ghost'
  | 'toolbar'
  | 'navigation'
  | 'action';

type ButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';
type ButtonIntent = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

export interface ButtonProps {
  readonly id?: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly form?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly autoFocus?: boolean;
  readonly tabIndex?: number;
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
  readonly key?: string;
  readonly title?: string;
  readonly onClick?: (event: MouseEvent) => void;
  readonly onFocus?: (event: FocusEvent) => void;
  readonly onBlur?: (event: FocusEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
  readonly onMouseEnter?: (event: MouseEvent) => void;
  readonly onMouseLeave?: (event: MouseEvent) => void;
  readonly children?: JSX.Element | JSX.Element[] | string | number | boolean | null;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly intent?: ButtonIntent;
  readonly iconOnly?: boolean;
  readonly loading?: boolean;
  readonly ref?: (element: HTMLButtonElement | null) => void;
  readonly iconVariant?: ButtonIntent; // Legacy: fallback for intent
  readonly role?: JSX.AriaRole;
  readonly [key: string]: unknown;
}

export const Button = (props: ButtonProps): JSX.Element => {
  const { createMemo, createEffect, onCleanup } = getSolidCore();

  const variant = () => props.variant ?? 'primary';
  const size = () => props.size ?? 'md';
  const resolvedIntent = createMemo(() => props.intent ?? props.iconVariant);

  createEffect(() => {
    if (props.iconOnly && !props['aria-label'] && !props['aria-labelledby']) {
      logger.warn('Icon-only buttons must have accessible labels', {
        component: 'UnifiedButton',
        variant: variant(),
        iconOnly: true,
      });
    }
  });

  const buttonClass = createMemo(() =>
    classnames(
      primitiveStyles.controlSurface,
      styles.unifiedButton,
      styles[`variant-${variant()}`],
      styles[`size-${size()}`],
      resolvedIntent() ? styles[`intent-${resolvedIntent()}`] : '',
      props.iconOnly ? styles.iconOnly : '',
      variant() === 'icon' ? styles.icon : '',
      resolvedIntent() ? styles[resolvedIntent() as ButtonIntent] : '',
      styles[size() as ButtonSize] ?? '',
      props.loading ? styles.loading : '',
      props.disabled ? styles.disabled : '',
      props.className ?? ''
    )
  );

  const resolvedTabIndex = createMemo(() => {
    if (props.disabled || props.loading) {
      return -1;
    }
    return typeof props.tabIndex === 'number' ? props.tabIndex : undefined;
  });

  const ariaBusy = createMemo(() => props['aria-busy'] ?? (props.loading ? 'true' : undefined));

  const ariaDisabled = createMemo(() => (props.disabled || props.loading ? 'true' : 'false'));

  const dataDisabled = createMemo(
    () => props['data-disabled'] ?? (props.disabled || props.loading ? 'true' : undefined)
  );

  const dataLoading = createMemo(
    () => props['data-loading'] ?? (props.loading ? 'true' : undefined)
  );

  const restProps = createMemo(() => {
    const keysToExclude = new Set([
      'id',
      'className',
      'disabled',
      'form',
      'type',
      'autoFocus',
      'tabIndex',
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
      'title',
      'onClick',
      'onFocus',
      'onBlur',
      'onKeyDown',
      'onMouseEnter',
      'onMouseLeave',
      'children',
      'variant',
      'size',
      'intent',
      'iconVariant',
      'iconOnly',
      'loading',
      'ref',
      'role',
      'key',
    ]);

    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!keysToExclude.has(key)) {
        copy[key] = value;
      }
    }
    return copy;
  });

  const spinnerNode = () =>
    props.loading ? <span class={styles.spinner} aria-hidden='true' /> : null;

  const setButtonRef = (element: HTMLButtonElement | null) => {
    if (typeof props.ref === 'function') {
      props.ref(element);
    }
  };

  onCleanup(() => {
    if (typeof props.ref === 'function') {
      props.ref(null);
    }
  });

  type SolidButtonMouseEvent = MouseEvent & {
    readonly currentTarget: HTMLButtonElement;
    readonly target: EventTarget & Element;
  };

  const handleClick = (event: SolidButtonMouseEvent) => {
    if (props.disabled || props.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    props.onClick?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (props.disabled || props.loading) {
      return;
    }
    props.onKeyDown?.(event);
  };

  return (
    <button
      {...(restProps() as Record<string, unknown>)}
      ref={setButtonRef}
      id={props.id}
      type={props.type ?? 'button'}
      form={props.form}
      autofocus={props.autoFocus}
      disabled={props.disabled || props.loading}
      class={buttonClass()}
      title={props.title}
      role={props.role ?? 'button'}
      tabIndex={resolvedTabIndex()}
      aria-label={props['aria-label'] as string | undefined}
      aria-labelledby={props['aria-labelledby'] as string | undefined}
      aria-describedby={props['aria-describedby'] as string | undefined}
      aria-pressed={props['aria-pressed'] as boolean | 'true' | 'false' | undefined}
      aria-expanded={props['aria-expanded'] as boolean | 'true' | 'false' | undefined}
      aria-controls={props['aria-controls'] as string | undefined}
      aria-haspopup={props['aria-haspopup'] as boolean | 'true' | 'false' | undefined}
      aria-busy={ariaBusy()}
      aria-disabled={ariaDisabled()}
      data-testid={props['data-testid'] as string | undefined}
      data-gallery-element={props['data-gallery-element'] as string | undefined}
      data-disabled={dataDisabled()}
      data-selected={props['data-selected'] as boolean | string | undefined}
      data-loading={dataLoading()}
      onClick={handleClick}
      onFocus={props.onFocus as JSX.EventHandlerUnion<HTMLButtonElement, FocusEvent>}
      onBlur={props.onBlur as JSX.EventHandlerUnion<HTMLButtonElement, FocusEvent>}
      onKeyDown={handleKeyDown}
      onMouseEnter={props.onMouseEnter as JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>}
      onMouseLeave={props.onMouseLeave as JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>}
    >
      {spinnerNode()}
      {props.children}
    </button>
  );
};

export default Button;
