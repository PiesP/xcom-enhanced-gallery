/** Settings module types and interfaces */

import type {
  AccessibilitySettings,
  AppSettings,
  DownloadSettings,
  FeatureFlags,
  GallerySettings,
  ToolbarSettings,
} from '@shared/types/settings.types';

export type {
  AccessibilitySettings,
  AppSettings,
  DownloadSettings,
  FeatureFlags,
  GallerySettings,
  ToolbarSettings,
};

export type SettingKey = keyof AppSettings;

export type NestedSettingKey =
  | `gallery.${keyof GallerySettings}`
  | `toolbar.${keyof ToolbarSettings}`
  | `download.${keyof DownloadSettings}`
  | `accessibility.${keyof AccessibilitySettings}`
  | `features.${keyof FeatureFlags}`
  | SettingKey;

export interface SettingChangeEvent<T = unknown> {
  /** The setting key using dot notation */
  key: NestedSettingKey;
  /** Previous setting value */
  oldValue: T;
  /** New setting value */
  newValue: T;
  /** Event timestamp (UNIX milliseconds) */
  timestamp: number;
  /** Event status */
  status?: 'success' | 'error';
}

export interface SettingValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}
