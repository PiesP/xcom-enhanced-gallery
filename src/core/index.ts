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

// State management (selective exports to avoid conflicts with constants)
export {
  // Gallery signals
  galleryState,
  openGallery,
  closeGallery,
  navigateToItem,
  navigatePrevious,
  navigateNext,
  setLoading,
  setError,
  setViewMode,
  getCurrentMediaItem,
  hasMediaItems,
  getMediaItemsCount,
  hasPreviousMedia,
  hasNextMedia,
  type GalleryEvents,
} from './state/signals/gallery.signals';

export {
  // Download signals
  downloadState,
  startDownload,
  updateDownloadProgress,
  completeDownload,
  failDownload,
  removeTask,
  type DownloadTask,
  type DownloadState,
} from './state/signals/download.signals';

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
  // View mode utilities
  isValidViewMode,
  normalizeViewMode,
} from './types/view-mode.types';

// Business services
export * from './services';
