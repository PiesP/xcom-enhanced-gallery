/**
 * @fileoverview UI/theme related type definitions
 * @version 1.0.0 - Phase 196: Split from app.types.ts
 * @description Integration of theme, toast, button style, animation and other UI-related types
 */

/**
 * Theme selection
 *
 * - 'light': Force light mode
 * - 'dark': Force dark mode
 * - 'auto': Auto-apply system settings
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Gallery-specific theme selection (extends Theme)
 *
 * @see {@link Theme} - Base theme type
 */
export type GalleryTheme = 'light' | 'dark' | 'auto' | 'system';

/**
 * Toast notification type
 */
export type ToastType = 'info' | 'warning' | 'error' | 'success';

/**
 * Button variant
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Button size
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Color variant
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Loading state (async operation progress)
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async state object
 *
 * @template T Data type
 *
 * @example
 * ```typescript
 * const [state, setState] = createSignal<AsyncState<User>>({
 *   data: null,
 *   loading: false,
 *   error: null,
 * });
 * ```
 */
export interface AsyncState<T> {
  /** Current data (null if loading, previous data maintained on error if possible) */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error message (null if successful) */
  error: string | null;
}

/**
 * Animation configuration
 *
 * @description CSS animation options
 */
export interface AnimationConfig {
  /** Animation duration (ms) */
  duration?: number;
  /** Easing function (ease, ease-in, ease-out, etc.) */
  easing?: string;
  /** Animation delay (ms) */
  delay?: number;
}

/**
 * Image fit mode
 *
 * @description How to render images within container
 *
 * - 'original': Keep original size
 * - 'fitWidth': Fit to width
 * - 'fitHeight': Fit to height
 * - 'fitContainer': Fill container
 */
export type ImageFitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

/**
 * Image fit options
 *
 * @description Detailed options used with ImageFitMode
 */
export interface ImageFitOptions {
  /** Fit mode */
  mode: ImageFitMode;
  /** Maximum width (px or em) */
  maxWidth?: number;
  /** Maximum height (px or em) */
  maxHeight?: number;
  /** Image quality (0-1) */
  quality?: number;
  /** Callback functions */
  callbacks?: ImageFitCallbacks;
}

/**
 * Image fit callback functions
 */
export interface ImageFitCallbacks {
  /** Called on size change */
  onResize?: (size: { width: number; height: number }) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Filename generation strategy
 *
 * - 'simple': Simple filename (e.g., image_001)
 * - 'detailed': Detailed filename (e.g., @username_description_20250101)
 * - 'timestamp': Include timestamp (e.g., 20250101_120000_media)
 * - 'custom': Custom format
 */
export type FilenameStrategy = 'simple' | 'detailed' | 'timestamp' | 'custom';

/**
 * Media file extension
 */
export type MediaFileExtension = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'mp4' | 'mov';

/**
 * Global configuration
 *
 * @description Application-wide UI/UX settings
 */
export interface GlobalConfig {
  /** Theme setting */
  theme: Theme;
  /** Language setting (ISO 639-1 code) */
  language: string;
  /** Debug mode */
  debug: boolean;
  /** Performance-related settings */
  performance: {
    /** Enable performance metrics tracking */
    enableMetrics: boolean;
    /** Maximum cache size (MB) */
    maxCacheSize: number;
  };
}
