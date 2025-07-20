/**
 * Core Layer Exports
 *
 * Phase 2B Step 3: Core Layer 최종 정리
 * 핵심 비즈니스 로직과 서비스만 선별적으로 export
 */

// Constants and configuration
export * from '../constants';

// Essential interfaces and types
export * from './interfaces';
export type {
  BaseService,
  ServiceConfig,
  ServiceDependency,
  ServiceFactory,
  ServiceLifecycle,
  ServiceTypeMapping,
} from './types/services.types';

// Infrastructure components (moved to Core)
export * from './browser';
export * from './dom';
export * from './memory';
export * from './types/view-mode.types';

// Core infrastructure
export * from './logging';
export * from './external';
export * from './error';
export * from './utils';

// Migrated infrastructure components
export * from './browser';
export * from './dom';
export * from './media';
export * from './managers';

// Core business services
export * from './services';

// Gallery state management (essential signals)
export {
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

// Download state management (essential signals)
export {
  downloadState,
  startDownload,
  updateDownloadProgress,
  completeDownload,
  failDownload,
  removeTask,
  type DownloadTask,
  type DownloadState,
} from './state/signals/download.signals';
