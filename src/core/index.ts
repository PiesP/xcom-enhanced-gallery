/**
 * Core Layer Barrel Export
 *
 * Core는 애플리케이션의 핵심 비즈니스 로직을 담당합니다.
 * Infrastructure에만 의존하며, 도메인별 상수, 타입, 서비스, 상태 관리를 제공합니다.
 *
 * 의존성 규칙:
 * - core → infrastructure (O)
 * - shared → core (O)
 * - features → core (O)
 */

// Domain constants
export * from './constants';

// Business interfaces
export * from './interfaces';

// State management
export * from './state/ExtractionStateManager';

// Core types (selective export to avoid conflicts)
export type {
  // Service types
  BaseService,
  ServiceConfig,
  ServiceDependency,
  ServiceFactory,
  ServiceLifecycle,
} from './types/services.types';

export type {
  // View mode types
  ViewMode,
} from './types/view-mode.types';

export {
  VIEW_MODES,
  getDefaultViewMode,
  // View mode utilities
  isValidViewMode,
  normalizeViewMode,
} from './types/view-mode.types';

// Re-export media types with core namespace to avoid conflicts
export type {
  MediaInfo as CoreMediaInfo,
  MediaItem as CoreMediaItem,
  MediaQuality as CoreMediaQuality,
  MediaType as CoreMediaType,
} from './types/media.types';

// Business services
export * from './services';

// State management
export * from './state';
