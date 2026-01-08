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

/**
 * Visual sizing hint for the IconButton component.
 * Note: This prop is not forwarded to the DOM; styling is managed by the caller.
 */
type IconButtonSize = 'sm' | 'md' | 'lg' | 'toolbar';

/**
 * Props for IconButton component
 *
 * @property children - Icon or other content to display within the button (optional)
 * @property class - Additional CSS class names for styling (optional)
 * @property type - HTML button type attribute (default: 'button')
 * @property disabled - Whether the button is disabled (optional)
 * @property id - HTML id attribute (optional)
 * @property title - Tooltip text for the button (optional)
 * @property data-testid - Testing identifier for e2e/component tests (optional)
 * @property aria-label - Accessible label for screen readers (optional)
 * @property aria-controls - ID of element controlled by this button (optional)
 * @property aria-expanded - Indicates expanded state for expandable elements (optional)
 * @property aria-pressed - Indicates pressed state for toggle buttons (optional)
 * @property aria-busy - Indicates whether the button is in a busy state (optional)
 * @property tabIndex - Tab order index for keyboard navigation (optional)
 * @property ref - Callback ref to access the underlying button element (optional)
 * @property onClick - Click event handler (optional)
 * @property onMouseDown - Mouse down event handler (optional)
 * @property size - Visual sizing hint; not forwarded to DOM (optional)
 */
interface IconButtonProps {
  readonly children?: ComponentChildren;
  readonly class?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: boolean;
  readonly id?: string;
  readonly title?: string;

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

  /**
   * Visual sizing hint. Kept as a custom prop for compatibility.
   * Styling is owned by the caller; this prop is not forwarded to the DOM.
   */
  readonly size?: IconButtonSize;
}

/**
 * IconButton - Minimal icon-only button component
 *
 * @description
 * Lightweight button component primarily used by the toolbar.
 * Styling is owned by the caller (e.g., Toolbar.module.css).
 * The component is intentionally kept minimal to reduce bundle size.
 *
 * @param props - IconButton properties
 * @returns A native button element wrapped with accessibility and event handling
 *
 * @example
 * ```tsx
 * <IconButton
 *   aria-label="Close"
 *   title="Close dialog"
 *   onClick={handleClose}
 * >
 *   <CloseIcon />
 * </IconButton>
 * ```
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
