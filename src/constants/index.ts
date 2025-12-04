/**
 * @fileoverview Integrated constants barrel export (Phase 352)
 *
 * Maintains backward compatibility with shared constant imports such as selectors and media data:
 * - import { SELECTORS } from '@constants';
 *
 * App runtime config is available via the dedicated module to avoid duplicate exposures:
 * - import { createAppConfig } from '@constants/app-config';
 */

export { CSS } from './css';
// ================================
// Settings
// ================================
export { createDefaultSettings, DEFAULT_SETTINGS } from './default-settings';
// ================================
// Media & CSS
// ================================
export { MEDIA } from './media';
// ================================
// Core Constants
// ================================
export {
  FALLBACK_SELECTORS,
  queryAllWithFallback,
  queryWithFallback,
  SELECTORS,
  STABLE_SELECTORS,
} from './selectors';
// ================================
// Services
// ================================
export { SERVICE_KEYS } from './service-keys';
// ================================
// Storage
// ================================
export { APP_SETTINGS_STORAGE_KEY } from './storage';
// ================================
// Twitter API
// ================================
export { TWITTER_API_CONFIG } from './twitter-api';
// ================================
// Types
// ================================
export type { AppServiceKey, FileExtension, MediaQuality, MediaType, ViewMode } from './types';
// ================================
// Video & System
// ================================
export {
  SYSTEM_PAGES,
  VIDEO_CONTROL_ARIA_TOKENS,
  VIDEO_CONTROL_DATASET_PREFIXES,
  VIDEO_CONTROL_ROLES,
  VIDEO_CONTROL_SELECTORS,
  VIEW_MODES,
} from './video-controls';

// ================================
// URL Patterns (Phase 22.2 compatibility)
// ================================
