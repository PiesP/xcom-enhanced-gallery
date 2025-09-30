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
  gallery: ReturnType<typeof galleryState>; // Native SolidJS Accessor
  download: ReturnType<typeof downloadState>; // Native SolidJS Accessor
  toolbar: ReturnType<typeof toolbarState>; // Native SolidJS Accessor
}

/**
 * 전체 앱 상태 조회
 */
export function getAppState(): AppStateSnapshot {
  return {
    gallery: galleryState(), // Native SolidJS Accessor
    download: downloadState(), // Native SolidJS Accessor
    toolbar: toolbarState(), // Native SolidJS Accessor
  };
}

/**
 * 앱 상태 초기화 (개발/테스트용)
 */
export async function resetAppState(): Promise<void> {
  // Gallery state reset - Native SolidJS Accessor
  if (galleryState().isOpen) {
    const { closeGallery } = await import('./signals/gallery.signals');
    closeGallery();
  }

  // Download state는 자동으로 완료되면 초기화됨
  // Toolbar state는 필요에 따라 초기화
}

/**
 * 상태 변경 감지를 위한 통합 구독
 * @deprecated Native SolidJS signals에서는 createEffect를 직접 사용하세요
 * @see {@link https://www.solidjs.com/docs/latest/api#createeffect}
 */
export function subscribeToAppState(_callback: (state: AppStateSnapshot) => void): () => void {
  // Gallery, Download, Toolbar 모두 native SolidJS signal로 변환 완료
  // createEffect를 사용하여 구독하는 것을 권장합니다:
  //
  // import { createEffect } from 'solid-js';
  // import { galleryState, downloadState, toolbarState } from '@shared/state/app-state';
  //
  // createEffect(() => {
  //   const state = {
  //     gallery: galleryState(),
  //     download: downloadState(),
  //     toolbar: toolbarState(),
  //   };
  //   callback(state);
  // });

  // Legacy 호환성을 위한 빈 unsubscribe 함수 반환
  return () => {
    // No-op: Native signals는 createEffect로 자동 정리됨
  };
}
