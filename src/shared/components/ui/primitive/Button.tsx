/**
 * Token-aware button primitive with Solid friendly props and basic a11y guards.
 */

import type { JSX } from 'solid-js';
import { getSolid } from '@shared/external/vendors';
import './Button.css';

const { createMemo, mergeProps, splitProps } = getSolid();

export interface ButtonProps
  extends Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'class' | 'onClick' | 'onKeyDown'
  > {
  readonly children?: JSX.Element;
  readonly className?: string;
  readonly class?: string;
  readonly variant?: 'primary' | 'secondary' | 'outline';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly intent?: 'primary' | 'success' | 'danger' | 'neutral';
  readonly selected?: boolean;
  readonly loading?: boolean;
  readonly onClick?: (event: MouseEvent | KeyboardEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
}

export function Button(props: ButtonProps): JSX.Element {
  const [local, others] = splitProps(props, [
    'children',
    'class',
    'className',
    'variant',
    'size',
    'disabled',
    'type',
    'onClick',
    'onKeyDown',
    'intent',
    'selected',
    'loading',
    'role',
    'tabIndex',
    'aria-pressed',
    'aria-busy',
  ]);

  const effectiveClass = createMemo(() =>
    [
      'xeg-button',
      `xeg-button--${local.variant ?? 'primary'}`,
      `xeg-button--${local.size ?? 'md'}`,
      local.intent && `xeg-button--${local.intent}`,
      local.selected && 'xeg-button--selected',
      local.loading && 'xeg-button--loading',
      local.class,
      local.className,
    ]
      .filter(Boolean)
      .join(' ')
  );

  const isInteractionDisabled = () => Boolean(local.disabled || local.loading);

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isInteractionDisabled()) {
        local.onClick?.(event);
      }
    }
    local.onKeyDown?.(event);
  };

  const handleClick = (event: MouseEvent): void => {
    if (!isInteractionDisabled()) {
      local.onClick?.(event);
    }
  };

  const resolvedRole =
    (local.role as JSX.ButtonHTMLAttributes<HTMLButtonElement>['role']) ?? 'button';
  const resolvedTabIndex = local.tabIndex ?? (isInteractionDisabled() ? -1 : 0);
  const ariaPressed =
    local.selected !== undefined ? (local.selected ? 'true' : 'false') : local['aria-pressed'];
  const ariaBusy = local.loading ? true : local['aria-busy'];

  const buttonProps = mergeProps({ role: 'button' as const, tabIndex: 0 }, others, {
    type: (local.type as ButtonProps['type']) ?? 'button',
    class: effectiveClass(),
    disabled: isInteractionDisabled(),
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    role: resolvedRole,
    tabIndex: resolvedTabIndex,
    'aria-pressed': ariaPressed,
    'aria-busy': ariaBusy,
  });

  return <button {...buttonProps}>{local.children}</button>;
}
