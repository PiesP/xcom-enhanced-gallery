/**
 * @fileoverview Integrated constants barrel export (Phase 352)
 *
 * Maintains backward compatibility with shared constant imports such as selectors and media data.
 * Prefer importing individual selector constants from '@shared/dom/selectors' or '@constants/selectors'
 * to maximize tree-shaking.
 *
 * App runtime config is available via the dedicated module to avoid duplicate exposures:
 * - import { createAppConfig } from '@constants/app-config';
 */

export { CSS } from './css.ts';
// ================================
// Settings
// ================================
export { createDefaultSettings, DEFAULT_SETTINGS } from './default-settings.ts';
// ================================
// Media & CSS
// ================================
export { MEDIA } from './media.ts';
// ================================
// Services
// ================================
export { SERVICE_KEYS } from './service-keys.ts';
// ================================
// Storage
// ================================
export { APP_SETTINGS_STORAGE_KEY } from './storage.ts';
// ================================
// Twitter API
// ================================
export { TWITTER_API_CONFIG } from './twitter-api.ts';
// ================================
// Types
// ================================
export type { AppServiceKey, FileExtension, MediaQuality, MediaType, ViewMode } from './types.ts';
// ================================
// Video & System
// ================================
export {
  SYSTEM_PAGES,
  VIDEO_CONTROL_ARIA_TOKENS,
  VIDEO_CONTROL_DATASET_PREFIXES,
  VIDEO_CONTROL_ROLES,
  VIEW_MODES,
} from './video-controls.ts';

// ================================
// URL Patterns (Phase 22.2 compatibility)
// ================================
