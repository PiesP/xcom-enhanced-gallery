/**
 * @fileoverview Component Props and related type definitions
 */

import type { JSX, JSXElement } from 'solid-js';

/** Component child element type */
export type ComponentChildren =
  | JSXElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentChildren[];

/** Top-level base Props for all components */
export interface BaseComponentProps {
  /** Child elements */
  children?: ComponentChildren;
  /** CSS class name */
  className?: string;
  /** Inline style */
  style?: JSX.CSSProperties;
  /** Test identifier */
  'data-testid'?: string | undefined;
  /** Accessibility: element description */
  'aria-label'?: string;
  /** Accessibility: detailed description element ID */
  'aria-describedby'?: string;
  /** Accessibility: expanded/collapsed state */
  'aria-expanded'?: boolean;
  /** Accessibility: hidden state */
  'aria-hidden'?: boolean;
  /** Accessibility: disabled state */
  'aria-disabled'?: boolean | 'true' | 'false';
  /** Accessibility: busy state */
  'aria-busy'?: boolean | 'true' | 'false';
  /** Accessibility: toggle state */
  'aria-pressed'?: boolean | 'true' | 'false';
  /** Accessibility: popup type */
  'aria-haspopup'?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /** HTML role */
  role?: string;
  /** Tab order */
  tabIndex?: number;
  /** Click event handler */
  onClick?: (event: MouseEvent) => void;
  /** Keyboard press event handler */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** Focus acquired event handler */
  onFocus?: (event: FocusEvent) => void;
  /** Focus lost event handler */
  onBlur?: (event: FocusEvent) => void;
  /** Dynamic data attributes */
  [key: `data-${string}`]: string | number | boolean | undefined;
}
