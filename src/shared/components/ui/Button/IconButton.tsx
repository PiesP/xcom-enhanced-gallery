/**
 * @fileoverview IconButton - lightweight icon-only button
 * @description Minimal button component used primarily by the toolbar.
 *
 * Design notes:
 * - Styling is owned by the caller (e.g., Toolbar.module.css).
 * - Keep this component tiny to reduce shipped JS/CSS.
 */

import type { ComponentChildren, JSXElement } from '@shared/external/vendors';
import { cx } from '@shared/utils/text/formatting';
import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';

export type IconButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';

export interface IconButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children?: ComponentChildren;
  /**
   * Visual sizing hint. Kept as a custom prop for compatibility.
   * Styling is owned by the caller; this prop is not forwarded to the DOM.
   */
  readonly size?: IconButtonSize;
}

export function IconButton(props: IconButtonProps): JSXElement {
  const [local, rest] = splitProps(props, ['children', 'class', 'type', 'size']);

  return (
    <button {...rest} type={local.type ?? 'button'} class={cx(local.class)}>
      {local.children}
    </button>
  );
}
