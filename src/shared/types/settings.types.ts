// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Shared settings types
 * @description Core settings interfaces used across layers.
 * These are separated from features-specific types to prevent reverse dependencies.
 */

/** Video player click handling mode */
export type VideoClickMode = 'block-all' | 'block-controls-only' | 'allow-all';

export interface GallerySettings {
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
  /** How clicks on video player elements are handled:
   *  - 'block-all': block all clicks inside the video player context (legacy)
   *  - 'block-controls-only': block only recognizable control UI (volume, seek, etc.),
   *    allow clicks on the video media area to launch the gallery
   *  - 'allow-all': never block clicks inside the video player context */
  videoClickMode: VideoClickMode;
}

export interface ToolbarSettings {
  /** Auto-hide delay in milliseconds (0 disables auto-hide) */
  autoHideDelay: number;
}

export type DownloadSettings = Record<string, never>;

export type AccessibilitySettings = Record<string, never>;

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
