/**
 * @fileoverview Component Props and related type definitions
 */

import type { JSXElement } from '@shared/external/vendors';

/** JSX element type alias */
export type VNode = JSXElement;

/** Component type (functional component) */
export type ComponentType<P = Record<string, unknown>> = (props: P) => JSXElement | null;

/** Component child element type */
export type ComponentChildren =
  | JSXElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentChildren[];

/** CSS properties object */
export interface CSSProperties {
  [key: string]: string | number | undefined;
}

/** Top-level base Props for all components */
export interface BaseComponentProps {
  /** Child elements */
  children?: ComponentChildren;
  /** CSS class name */
  className?: string;
  /** Inline style */
  style?: CSSProperties;
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

/** Interactive component Props - for clickable elements **/
export interface InteractiveComponentProps extends BaseComponentProps {
  /** Disabled state */
  disabled?: boolean;
  /** Mouse enter event */
  onMouseEnter?: (event: MouseEvent) => void;
  /** Mouse leave event */
  onMouseLeave?: (event: MouseEvent) => void;
}

/** Loading-state component Props - for async operation progress **/
export interface LoadingComponentProps extends BaseComponentProps {
  /** Loading state */
  loading?: boolean;
  /** Loading display text */
  loadingText?: string;
}

/**
 * Size-variant component Props
 *
 * @description For components with multiple size options
 *
 * @example Buttons, badges, icons
 */
export interface SizedComponentProps extends BaseComponentProps {
  /** Size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Color-variant component Props
 *
 * @description For components with multiple style variants
 *
 * @example Buttons, badges, alerts
 */
export interface VariantComponentProps extends BaseComponentProps {
  /** Variant style */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'icon';
}

/**
 * Form element component Props
 *
 * @description For input, button and other form elements
 */
export interface FormComponentProps extends InteractiveComponentProps {
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** form element ID connection */
  form?: string;
  /** Auto focus */
  autoFocus?: boolean;
}

/**
 * Container component Props
 *
 * @description For container elements like modal overlays
 */
export interface ContainerComponentProps extends BaseComponentProps {
  /** Close callback */
  onClose?: () => void;
  /** Position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  /** Maximum items */
  maxItems?: number;
}

// ================================
// Event handler types
// ================================

/**
 * General event handler
 *
 * @template T Event type
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * Mouse event handler
 */
export type MouseEventHandler = EventHandler<MouseEvent>;

/**
 * Keyboard event handler
 */
export type KeyboardEventHandler = EventHandler<KeyboardEvent>;

/**
 * Async function type
 *
 * @template T Return type
 */
export type AsyncFunction<T = void> = () => Promise<T>;

/**
 * Async callback function type
 *
 * @template T Input type
 * @template R Return type
 */
export type AsyncCallback<T = void, R = void> = (arg: T) => Promise<R>;

/**
 * Optional callback function type (allows undefined)
 *
 * @template T Input type
 */
export type OptionalCallback<T = void> = ((arg: T) => void) | undefined;

/**
 * Error handler (synchronous)
 */
export type ErrorHandler = (error: Error | ApiError) => void;

/**
 * Error handler (asynchronous)
 */
export type AsyncErrorHandler = (error: Error | ApiError) => Promise<void>;

/**
 * Progress callback (0-1)
 */
export type ProgressCallback = (progress: number) => void;

// ================================
// API-related types
// ================================

/**
 * API response wrapper
 *
 * @template T Data type
 */
export interface ApiResponse<T = Record<string, unknown>> {
  /** Success state */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message */
  error?: string;
  /** Message */
  message?: string;
}

/**
 * API error
 */
export interface ApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Details */
  details?: unknown;
}

/**
 * API request options
 */
export interface RequestOptions {
  /** Timeout (ms) */
  timeout?: number;
  /** Retry count */
  retries?: number;
  /** Request headers */
  headers?: Record<string, string>;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Total items */
  total: number;
  /** Has next page */
  hasNext: boolean;
  /** Has previous page */
  hasPrev: boolean;
}

/**
 * File information
 */
export interface FileInfo {
  /** File name */
  name: string;
  /** File size (bytes) */
  size: number;
  /** MIME type */
  type: string;
  /** Last modified time (timestamp) */
  lastModified: number;
}
