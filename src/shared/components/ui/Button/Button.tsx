/**
 * @fileoverview Button - 통합 버튼 컴포넌트 (Solid.js)
 * @description 모든 버튼 요구사항을 만족하는 통합 컴포넌트
 */

import type { ComponentChildren, JSXElement } from '../../../external/vendors';
import { getSolid } from '../../../external/vendors';
import { logger } from '../../../logging';
import styles from './Button.module.css';

const solid = getSolid();
const { mergeProps, splitProps, createEffect, onCleanup } = solid;

// 간단한 clsx 대체 함수
function classnames(...classes: (string | undefined | null | false)[]): string {
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

export interface ButtonProps extends ButtonHTMLAttributes {
  readonly children?: ComponentChildren;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly intent?: ButtonIntent;
  readonly iconOnly?: boolean;
  readonly loading?: boolean;
  readonly ref?: (element: HTMLButtonElement | null) => void;
}

type DefaultKeys = 'variant' | 'size' | 'type' | 'iconOnly' | 'disabled' | 'loading';

const defaultProps: Required<Pick<ButtonProps, DefaultKeys>> = {
  variant: 'primary',
  size: 'md',
  type: 'button',
  iconOnly: false,
  disabled: false,
  loading: false,
};

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

  onCleanup(() => {
    local.ref?.(null);
  });

  const resolvedIntent = () => local.intent;
  const isDisabled = () => local.disabled || local.loading;

  const buttonClasses = () =>
    classnames(
      styles.unifiedButton,
      styles[`variant-${local.variant}`],
      styles[`size-${local.size}`],
      resolvedIntent() && styles[`intent-${resolvedIntent()}`],
      local.iconOnly && styles.iconOnly,
      local.variant === 'icon' && styles.icon,
      resolvedIntent() && styles[resolvedIntent() as keyof typeof styles],
      styles[local.size as keyof typeof styles],
      local.loading && styles.loading,
      local.disabled && styles.disabled,
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
      role='button'
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
      onClick={event => {
        if (isDisabled()) {
          event.preventDefault();
          return;
        }
        local.onClick?.(event);
      }}
      onMouseDown={event => {
        if (isDisabled()) {
          event.preventDefault();
          return;
        }
        local.onMouseDown?.(event);
      }}
      onMouseUp={event => {
        if (isDisabled()) {
          return;
        }
        local.onMouseUp?.(event);
      }}
      onFocus={local.onFocus}
      onBlur={local.onBlur}
      onKeyDown={event => {
        if (isDisabled()) {
          return;
        }
        local.onKeyDown?.(event);
      }}
      onMouseEnter={local.onMouseEnter}
      onMouseLeave={local.onMouseLeave}
    >
      {local.loading && <span class={styles.spinner} aria-hidden='true' />}
      {local.children}
    </button>
  );
}

export default Button;
