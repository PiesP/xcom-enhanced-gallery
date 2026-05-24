import type { ComponentChildren } from '@shared/types/component.types';
import { cx } from '@shared/utils/text/formatting';
import type { JSXElement } from 'solid-js';

interface IconButtonProps {
  readonly children?: ComponentChildren;
  readonly class?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: boolean;
  readonly id?: string;
  readonly title?: string;
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
 * Accessible icon button with optional loading and disabled states.
 *
 * Renders a `<button>` element with an icon, tooltip, and ARIA attributes.
 *
 * @param props - Button configuration (icon, label, click handler, etc.)
 * @returns Button JSX element
 */
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
}
