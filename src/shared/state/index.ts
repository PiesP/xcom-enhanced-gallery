/**
 * @fileoverview Unified App State Management
 * @version 3.0.0 - Phase 3: 상태 관리 통합
 *
 * 모든 상태 관리를 하나로 통합:
 * - gallery.signals.ts (갤러리 상태)
 * - download.signals.ts (다운로드 상태)
 * - toolbar.signals.ts (툴바 상태)
 */

// 통합된 앱 상태 관리 export
export * from './app-state';

// 하위 호환성을 위한 별칭들
export {
  // Gallery state
  galleryState,
  openGallery,
  closeGallery,
  navigateToItem,
  navigatePrevious,
  navigateNext,
  setLoading as setGalleryLoading,
  setError as setGalleryError,
  setViewMode,
  getCurrentMediaItem,
  hasMediaItems,
  getMediaItemsCount,
  hasPreviousMedia,
  hasNextMedia,
  isGalleryOpen,
  getCurrentIndex,
  getMediaItems,
  isLoading as isGalleryLoading,
  getError as getGalleryError,
  getViewMode,

  // Download state
  downloadState,
  createDownloadTask,
  startDownload,
  updateDownloadProgress,
  completeDownload,
  failDownload,
  removeTask as removeDownloadTask,
  clearCompletedTasks,
  getDownloadTask,
  getDownloadInfo,

  // Toolbar state
  toolbarState,
  updateToolbarMode,
  setHighContrast,
  getCurrentToolbarMode,
  getToolbarInfo,
  getCurrentMode,
} from './app-state';
