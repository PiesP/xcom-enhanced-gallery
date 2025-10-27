/**
 * Signals Module
 *
 * Solid.js 기반의 반응형 신호 모음
 */

export { createSignalSafe, effectSafe, computedSafe, type SafeSignal } from './signal-factory';

export {
  type GalleryState,
  type GalleryEvents,
  galleryState,
  gallerySignals,
  galleryIndexEvents,
  openGallery,
  closeGallery,
  navigateToItem,
  navigatePrevious,
  navigateNext,
  setLoading,
  setError,
  setViewMode,
  setFocusedIndex,
  getCurrentMediaItem,
  hasMediaItems,
  getMediaItemsCount,
  hasPreviousMedia,
  hasNextMedia,
  isGalleryOpen,
  getCurrentIndex,
  getMediaItems,
  isLoading,
  getError,
  getViewMode,
} from './gallery.signals';

export {
  type DownloadStatus,
  type DownloadTask,
  type DownloadState,
  type DownloadEvents,
  downloadState,
  createDownloadTask,
  startDownload,
  updateDownloadProgress,
  completeDownload,
  failDownload,
  removeTask,
  clearCompletedTasks,
  getDownloadTask,
  getDownloadInfo,
  addEventListener as addDownloadEventListener,
} from './download.signals';

export { type ScrollState, type ScrollDirection, INITIAL_SCROLL_STATE } from './scroll.signals';

export {
  type ToolbarState,
  type ToolbarEvents,
  toolbarState,
  updateToolbarMode,
  setHighContrast,
  getCurrentToolbarMode,
  getToolbarInfo,
  getCurrentMode,
  addEventListener as addToolbarEventListener,
} from './toolbar.signals';
