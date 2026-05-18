/**
 * @fileoverview Shared settings types
 * @description Core settings interfaces used across layers.
 * These are separated from features-specific types to prevent reverse dependencies.
 */

export interface GallerySettings {
  /** Auto-scroll speed (1-10) */
  autoScrollSpeed: number;
  /** Enable infinite scroll */
  infiniteScroll: boolean;
  /** Number of images to preload */
  preloadCount: number;
  /** Image fit mode */
  imageFitMode: 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';
  /** Theme mode */
  theme: 'auto' | 'light' | 'dark';
  /** Enable animations */
  animations: boolean;
  /** Enable keyboard navigation */
  enableKeyboardNav: boolean;
  /** Video volume level (0.0-1.0) */
  videoVolume: number;
  /** Video muted state */
  videoMuted: boolean;
}

export interface ToolbarSettings {
  /** Auto-hide delay in milliseconds (0 disables auto-hide) */
  autoHideDelay: number;
}

export interface DownloadSettings {
  /** Filename pattern */
  filenamePattern: 'original' | 'tweet-id' | 'timestamp' | 'custom';
  /** Image quality */
  imageQuality: 'original' | 'large' | 'medium' | 'small';
  /** Maximum concurrent downloads */
  maxConcurrentDownloads: number;
  /** Auto-compress to ZIP */
  autoZip: boolean;
  /** Download folder structure */
  folderStructure: 'flat';
}

export interface AccessibilitySettings {
  /** Reduce animations and transitions */
  reduceMotion: boolean;
  /** Enable screen reader support */
  screenReaderSupport: boolean;
  /** Show prominent focus indicators for keyboard navigation */
  focusIndicators: boolean;
}

export interface FeatureFlags {
  /** Enable gallery feature */
  gallery: boolean;
  /** Enable settings UI */
  settings: boolean;
  /** Enable download feature */
  download: boolean;
  /** Enable media extraction */
  mediaExtraction: boolean;
  /** Enable accessibility features */
  accessibility: boolean;
}

export interface AppSettings {
  gallery: GallerySettings;
  toolbar: ToolbarSettings;
  download: DownloadSettings;
  accessibility: AccessibilitySettings;
  features: FeatureFlags;
  version: string;
  lastModified: number;
}

/** Image fit mode — extracted from GallerySettings for direct use */
export type ImageFitMode = GallerySettings['imageFitMode'];

export type SettingKey = keyof AppSettings;

export type NestedSettingKey =
  | `gallery.${keyof GallerySettings}`
  | `toolbar.${keyof ToolbarSettings}`
  | `download.${keyof DownloadSettings}`
  | `accessibility.${keyof AccessibilitySettings}`
  | `features.${keyof FeatureFlags}`
  | SettingKey;

export interface SettingChangeEvent<T = unknown> {
  readonly key: NestedSettingKey;
  readonly oldValue: T;
  readonly newValue: T;
  readonly timestamp: number;
  readonly status?: 'success' | 'error';
}
