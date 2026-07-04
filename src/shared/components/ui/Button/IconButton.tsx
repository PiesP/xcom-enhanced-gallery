// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { Tooltip } from '@shared/components/ui/Tooltip/Tooltip';
import type { ComponentChildren } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import type { JSXElement } from 'solid-js';

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
  const buttonElement = (
    <button
      ref={props.ref}
      id={props.id}
      type={props.type ?? 'button'}
      class={cx(props.class)}
      title={props.tooltip ? undefined : props.title}
      disabled={props.disabled}
      tabIndex={props.tabIndex}
      data-size={props.size}
      data-testid={props['data-testid']}
      aria-label={props['aria-label']}
      aria-controls={props['aria-controls']}
      aria-expanded={props['aria-expanded']}
      aria-pressed={props['aria-pressed']}
      aria-busy={props['aria-busy']}
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
    >
      {props.children}
    </button>
  );

  // Use custom tooltip when provided, otherwise render button directly
  if (props.tooltip) {
    return <Tooltip content={props.tooltip}>{buttonElement}</Tooltip>;
  }

  return buttonElement;
}
