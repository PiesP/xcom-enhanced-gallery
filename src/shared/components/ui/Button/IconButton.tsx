// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { Tooltip } from '@shared/components/ui/Tooltip/Tooltip';
import type { ComponentChildren } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import { splitProps, type JSXElement } from 'solid-js';

interface IconButtonProps {
  readonly children?: ComponentChildren;
  readonly class?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: boolean;
  readonly id?: string;
  /** Native HTML title attribute (fallback when tooltip is not set) */
  readonly title?: string;
  /** Custom tooltip content (renders a positioned Portal tooltip instead of native title) */
  readonly tooltip?: string;
  readonly size?: string;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-controls'?: string;
  readonly 'aria-expanded'?: boolean | 'true' | 'false';
  readonly 'aria-pressed'?: boolean | 'true' | 'false';
  readonly 'aria-busy'?: boolean | 'true' | 'false';
  readonly tabIndex?: number;
  readonly ref?: (element: HTMLButtonElement) => void;
  readonly onClick?: (event: MouseEvent) => void;
  readonly onMouseDown?: (event: MouseEvent) => void;
}

/**
 * Accessible icon button with optional tooltip.
 *
 * Renders a `<button>` element with an icon.
 * When `tooltip` is provided, a Portal-based custom tooltip is shown on hover/focus
 * instead of the native `title` attribute. Falls back to `title` for backward compatibility.
 *
 * @param props - Button configuration (icon, label, click handler, tooltip, etc.)
 * @returns Button JSX element (optionally wrapped in Tooltip)
 */
export function IconButton(props: IconButtonProps): JSXElement {
  const [local] = splitProps(props, [
    'ref', 'id', 'type', 'class', 'title', 'tooltip', 'size', 'disabled', 'tabIndex',
    'data-testid', 'aria-label', 'aria-controls', 'aria-expanded', 'aria-pressed', 'aria-busy',
    'onClick', 'onMouseDown', 'children',
  ]);
  const buttonElement = (
    <button
      ref={local.ref}
      id={local.id}
      type={local.type ?? 'button'}
      class={cx(local.class)}
      title={local.tooltip ? undefined : local.title}
      disabled={local.disabled}
      tabIndex={local.tabIndex}
      data-size={local.size}
      data-testid={local['data-testid']}
      aria-label={local['aria-label']}
      aria-controls={local['aria-controls']}
      aria-expanded={local['aria-expanded']}
      aria-pressed={local['aria-pressed']}
      aria-busy={local['aria-busy']}
      onClick={local.onClick}
      onMouseDown={local.onMouseDown}
    >
      {local.children}
    </button>
  );

  // Use custom tooltip when provided, otherwise render button directly
  if (local.tooltip) {
    return <Tooltip content={local.tooltip}>{buttonElement}</Tooltip>;
  }

  return buttonElement;
}
