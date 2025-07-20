export * from '../constants';
export * from './interfaces';
export * from './logging';
export * from './utils';
export * from './external';
export * from './error';
export * from './managers';

// Newly migrated components - Phase 2A Step 8
export * from './browser';
export * from './dom';
export * from './media';

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
export type {
  BaseService,
  ServiceConfig,
  ServiceDependency,
  ServiceFactory,
  ServiceLifecycle,
} from './types/services.types';
export type { ViewMode } from './types/view-mode.types';
export { VIEW_MODES, isValidViewMode, normalizeViewMode } from './types/view-mode.types';
export * from './services';
