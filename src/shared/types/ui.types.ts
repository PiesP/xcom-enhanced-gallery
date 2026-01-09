/**
 * @fileoverview UI/theme related type definitions
 */

/** Theme selection */
export type Theme = 'light' | 'dark' | 'auto';

/** Gallery-specific theme selection */
export type GalleryTheme = 'light' | 'dark' | 'auto' | 'system';

/** Base button variant */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** Base button size */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Color variant */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/** Loading state (async operation progress) */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Async state object */
export interface AsyncState<T> {
  /** Current data (null if loading, previous data maintained on error if possible) */
  readonly data: T | null;
  /** Loading state */
  readonly loading: boolean;
  /** Error message (null if successful) */
  readonly error: string | null;
}

/** Animation configuration */
export interface AnimationConfig {
  /** Animation duration (ms) */
  readonly duration?: number;
  /** Easing function */
  readonly easing?: string;
  /** Animation delay (ms) */
  readonly delay?: number;
}

/** Image fit mode */
export type ImageFitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

/** Image fit options */
export interface ImageFitOptions {
  /** Fit mode */
  readonly mode: ImageFitMode;
  /** Maximum width (px or em) */
  readonly maxWidth?: number;
  /** Maximum height (px or em) */
  readonly maxHeight?: number;
  /** Image quality (0-1) */
  readonly quality?: number;
  /** Callback functions */
  readonly callbacks?: ImageFitCallbacks;
}

/** Image fit callback functions */
export interface ImageFitCallbacks {
  /** Called on size change */
  readonly onResize?: (size: { readonly width: number; readonly height: number }) => void;
  /** Called on error */
  readonly onError?: (error: Error) => void;
}

/** Filename generation strategy */
export type FilenameStrategy = 'simple' | 'detailed' | 'timestamp' | 'custom';

/** Media file extension */
export type MediaFileExtension = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'mp4' | 'mov';

/** Global configuration */
export interface GlobalConfig {
  /** Theme setting */
  readonly theme: Theme;
  /** Language setting (ISO 639-1 code) */
  readonly language: string;
  /** Debug mode */
  readonly debug: boolean;
}
