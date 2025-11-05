/**
 * @fileoverview 통합 상수 배럴 export (Phase 352)
 *
 * 하위 호환성을 위해 기존 import 경로를 유지합니다:
 * - import { APP_CONFIG, TIMING } from '@/constants';
 *
 * 개별 파일 import도 가능합니다 (tree-shaking 최적화):
 * - import { APP_CONFIG } from '@/constants/app-config';
 */

// ================================
// Core Constants
// ================================
export { APP_CONFIG } from './app-config';
export { TIMING } from './timing';
export { SELECTORS, STABLE_SELECTORS } from './selectors';

// ================================
// Media & CSS
// ================================
export { MEDIA } from './media';
export { CSS, HOTKEYS } from './css';

// ================================
// Events & Services
// ================================
export { EVENTS } from './events';
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
export type {
  MediaType,
  MediaQuality,
  FileExtension,
  AppServiceKey,
  EventType,
  ViewMode,
} from './types';

// ================================
// URL Patterns (Phase 22.2 호환)
// ================================
export { URL_PATTERNS } from '../shared/utils/patterns/url-patterns';
