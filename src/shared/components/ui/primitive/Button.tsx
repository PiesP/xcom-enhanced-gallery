/**
 * @fileoverview Button Primitive Component
 * @description 기본 버튼 컴포넌트 - 디자인 토큰 사용
 */

import type { JSX } from 'solid-js';
import { getSolid } from '@shared/external/vendors';
import './Button.css';

const { createMemo, splitProps, mergeProps } = getSolid();

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
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly onClick?: (event: MouseEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
  readonly intent?: 'primary' | 'success' | 'danger' | 'neutral';
  readonly selected?: boolean;
  readonly loading?: boolean;
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

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!local.disabled && !local.loading) {
        local.onClick?.(event as unknown as MouseEvent);
      }
    }
    local.onKeyDown?.(event);
  };

  const handleClick = (event: MouseEvent) => {
    if (!local.disabled && !local.loading) {
      local.onClick?.(event);
    }
  };

  const resolvedRole =
    (local.role as JSX.ButtonHTMLAttributes<HTMLButtonElement>['role']) ?? 'button';
  const resolvedTabIndex = local.tabIndex ?? (local.disabled || local.loading ? -1 : 0);
  const ariaPressed =
    local.selected !== undefined ? (local.selected ? 'true' : 'false') : local['aria-pressed'];
  const ariaBusy = local.loading ? true : local['aria-busy'];

  const buttonProps = mergeProps(
    {
      role: 'button' as const,
      tabIndex: 0,
    },
    others,
    {
      type: (local.type as ButtonProps['type']) ?? 'button',
      class: effectiveClass(),
      disabled: Boolean(local.disabled || local.loading),
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      role: resolvedRole,
      tabIndex: resolvedTabIndex,
      'aria-pressed': ariaPressed,
      'aria-busy': ariaBusy,
    }
  );

  return <button {...buttonProps}>{local.children}</button>;
}
