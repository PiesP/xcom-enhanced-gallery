/**
 * @fileoverview Component Props and related type definitions
 * @version 1.0.0 - Phase 196: Split from app.types.ts
 * @description Definition of base Props and extended Props for all components
 *
 * Design Pattern:
 * - BaseComponentProps: Top-level base props for all components
 * - SpecificComponentProps: Role-specific props extending BaseComponentProps
 */

import type { JSXElement } from '../external/vendors';

// ================================
// Basic type definitions
// ================================

/**
 * JSX element type alias
 */
export type VNode = JSXElement;

/**
 * Component type (functional component)
 *
 * @template P Component props type
 */
export type ComponentType<P = Record<string, unknown>> = (props: P) => JSXElement | null;

/**
 * Component child element type
 *
 * @description All types usable as JSX children
 */
export type ComponentChildren =
  | JSXElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentChildren[];

/**
 * CSS properties object
 */
export interface CSSProperties {
  [key: string]: string | number | undefined;
}

// ================================
// Base component Props
// ================================

/**
 * Top-level base Props for all components
 *
 * @description Phase 2-3A: Integrated (migrated from previous base/BaseComponentProps.ts)
 *
 * Inclusions:
 * - Basic HTML attributes (className, style, etc.)
 * - Accessibility attributes (aria-*, role)
 * - Data attributes (data-*)
 * - Event handlers (onClick, onKeyDown, etc.)
 *
 * @example
 * ```typescript
 * interface MyComponentProps extends BaseComponentProps {
 *   variant?: 'primary' | 'secondary';
 * }
 *
 * const MyComponent = (props: MyComponentProps) => (
 *   <button
 *     className={props.className}
 *     aria-label={props['aria-label']}
 *     data-testid={props['data-testid']}
 *   >
 *     {props.children}
 *   </button>
 * );
 * ```
 */
export interface BaseComponentProps {
  /** Child elements */
  children?: ComponentChildren;
  /** CSS class name */
  className?: string;
  /** Inline style */
  style?: CSSProperties;
  /** Test identifier */
  'data-testid'?: string;
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

// ================================
// Role-specific component Props (extends BaseComponentProps)
// ================================

/**
 * Interactive component Props
 *
 * @description For components that handle click/mouse events
 *
 * @example Buttons, links, clickable items
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  /** Disabled state */
  disabled?: boolean;
  /** Mouse enter event */
  onMouseEnter?: (event: MouseEvent) => void;
  /** Mouse leave event */
  onMouseLeave?: (event: MouseEvent) => void;
}

/**
 * Loading-state component Props
 *
 * @description For components that display async operation progress
 *
 * @example Loading buttons, progress indicators
 */
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
 * @description For container elements like toast, modal
 */
export interface ContainerComponentProps extends BaseComponentProps {
  /** Close callback */
  onClose?: () => void;
  /** Position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  /** Maximum items */
  maxItems?: number;
}

/**
 * Gallery-specific component Props
 *
 * @description For all gallery-related components with data attributes
 */
export interface GalleryComponentProps extends InteractiveComponentProps {
  /** Gallery component type */
  galleryType?: 'container' | 'item' | 'control' | 'overlay' | 'viewer';
  /** Gallery mark (data attribute) */
  'data-xeg-gallery'?: string;
  /** Gallery type (data attribute) */
  'data-xeg-gallery-type'?: string;
  /** Gallery version (data attribute) */
  'data-xeg-gallery-version'?: string;
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
