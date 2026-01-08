/** Settings module types and interfaces */

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
  /** Custom filename template (when filenamePattern is 'custom') */
  customTemplate?: string;
  /** Image quality */
  imageQuality: 'original' | 'large' | 'medium' | 'small';
  /** Maximum concurrent downloads */
  maxConcurrentDownloads: number;
  /** Auto-compress to ZIP */
  autoZip: boolean;
  /** Download folder structure */
  folderStructure: 'flat' | 'by-date' | 'by-user';
}

export interface TokenSettings {
  /** Bearer token (optional, empty if not configured) */
  bearerToken?: string;
  /** Auto-refresh on expiration */
  autoRefresh: boolean;
  /** Token expiration time (minutes) */
  expirationMinutes: number;
  /** Last token refresh time (UNIX timestamp in milliseconds) */
  lastRefresh?: number;
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
  tokens: TokenSettings;
  accessibility: AccessibilitySettings;
  features: FeatureFlags;
  version: string;
  lastModified: number;
}

export type SettingKey = keyof AppSettings;

export type NestedSettingKey =
  | `gallery.${keyof GallerySettings}`
  | `toolbar.${keyof ToolbarSettings}`
  | `download.${keyof DownloadSettings}`
  | `tokens.${keyof TokenSettings}`
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
