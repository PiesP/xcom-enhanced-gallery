/**
 * @fileoverview App State Management
 * @description Phase 3: 모든 상태 관리를 하나로 통합
 * @version 3.0.0 - File Consolidation
 */

// 모든 기존 signals 기능 통합 export
export {
  // Gallery signals - 전체 API
  type GalleryState,
  type GalleryEvents,
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
  isGalleryOpen,
  getCurrentIndex,
  getMediaItems,
  isLoading,
  getError,
  getViewMode,
} from './signals/gallery.signals';

export {
  // Download signals - 전체 API
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
} from './signals/download.signals';

export {
  // Toolbar signals - 전체 API
  type ToolbarState,
  type ToolbarEvents,
  toolbarState,
  updateToolbarMode,
  setHighContrast,
  getCurrentToolbarMode,
  getToolbarInfo,
  addEventListener as addToolbarEventListener,
  getCurrentMode,
} from './signals/toolbar.signals';

// 통합 상태 스냅샷 및 관리 함수들
import { galleryState } from './signals/gallery.signals';
import { downloadState } from './signals/download.signals';
import { toolbarState } from './signals/toolbar.signals';

/**
 * 애플리케이션 전체 상태 스냅샷
 */
export interface AppStateSnapshot {
  gallery: typeof galleryState.value;
  download: typeof downloadState.value;
  toolbar: typeof toolbarState.value;
}

/**
 * 전체 앱 상태 조회
 */
export function getAppState(): AppStateSnapshot {
  return {
    gallery: galleryState.value,
    download: downloadState.value,
    toolbar: toolbarState.value,
  };
}

/**
 * 앱 상태 초기화 (개발/테스트용)
 */
export async function resetAppState(): Promise<void> {
  // Gallery state reset
  if (galleryState.value.isOpen) {
    const { closeGallery } = await import('./signals/gallery.signals');
    closeGallery();
  }

  // Download state는 자동으로 완료되면 초기화됨
  // Toolbar state는 필요에 따라 초기화
}

/**
 * 상태 변경 감지를 위한 통합 구독
 */
export function subscribeToAppState(callback: (state: AppStateSnapshot) => void): () => void {
  const unsubscribers = [
    galleryState.subscribe?.(() => callback(getAppState())),
    downloadState.subscribe?.(() => callback(getAppState())),
    toolbarState.subscribe?.(() => callback(getAppState())),
  ].filter(Boolean);

  // 모든 구독 해제하는 함수 반환
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe?.());
  };
}
