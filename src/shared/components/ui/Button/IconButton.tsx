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

export type IconButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';

export interface IconButtonProps {
  readonly children?: ComponentChildren;
  readonly class?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: boolean;
  readonly id?: string;
  readonly title?: string;

  readonly 'aria-label'?: string;
  readonly 'aria-controls'?: string;
  readonly 'aria-expanded'?: boolean | 'true' | 'false';
  readonly 'aria-pressed'?: boolean | 'true' | 'false';
  readonly 'aria-busy'?: boolean | 'true' | 'false';

  readonly tabIndex?: number;
  readonly ref?: (element: HTMLButtonElement) => void;
  readonly onClick?: (event: MouseEvent) => void;
  readonly onMouseDown?: (event: MouseEvent) => void;

  /**
   * Visual sizing hint. Kept as a custom prop for compatibility.
   * Styling is owned by the caller; this prop is not forwarded to the DOM.
   */
  readonly size?: IconButtonSize;
}

export function IconButton(props: IconButtonProps): JSXElement {
  return (
    <button
      ref={props.ref}
      id={props.id}
      type={props.type ?? 'button'}
      class={cx(props.class)}
      title={props.title}
      disabled={props.disabled}
      tabIndex={props.tabIndex}
      aria-label={props['aria-label']}
      aria-controls={props['aria-controls']}
      aria-expanded={props['aria-expanded']}
      aria-pressed={props['aria-pressed']}
      aria-busy={props['aria-busy']}
      onMouseDown={props.onMouseDown}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
