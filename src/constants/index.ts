/**
 * @fileoverview Integrated constants barrel export (Phase 352)
 *
 * Maintains backward compatibility with shared constant imports such as selectors and media data:
 * - import { SELECTORS } from '@/constants';
 *
 * App runtime config is available via the dedicated module to avoid duplicate exposures:
 * - import { APP_CONFIG, createAppConfig } from '@/constants/app-config';
 */

// ================================
// Core Constants
// ================================
export { SELECTORS, STABLE_SELECTORS } from './selectors';

// ================================
// Media & CSS
// ================================
export { MEDIA } from './media';
export { CSS } from './css';

// ================================
// Services
// ================================
export { SERVICE_KEYS } from './service-keys';

// ================================
// Twitter API
// ================================
export { TWITTER_API_CONFIG } from './twitter-api';

// ================================
// Video & System
// ================================
export { VIDEO_CONTROL_SELECTORS, SYSTEM_PAGES, VIEW_MODES } from './video-controls';

// ================================
// Settings
// ================================
export { DEFAULT_SETTINGS } from './default-settings';

// ================================
// Types
// ================================
export type { MediaType, MediaQuality, FileExtension, AppServiceKey, ViewMode } from './types';

// ================================
// URL Patterns (Phase 22.2 compatibility)
// ================================
