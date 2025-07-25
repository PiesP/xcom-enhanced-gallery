/**
 * @fileoverview App State - 통합 애플리케이션 상태 관리
 * @description Phase 2: 모든 상태 관리를 하나로 통합
 * @version 2.0.0 - Layer Simplification
 */

// 기존 시그널들 re-export (중복 방지)
export {
  // Gallery signals
  openGallery,
  closeGallery,
  navigateToItem,
  getCurrentMediaItem,
  galleryState,
} from '../state/signals/gallery.signals';

export {
  // Download signals
  downloadState,
  updateDownloadProgress,
  completeDownload,
  failDownload,
} from '../state/signals/download.signals';

export {
  // Toolbar signals (이벤트 리스너 중복 방지)
  toolbarState,
  updateToolbarMode,
} from '../state/signals/toolbar.signals';

// 통합 상태 접근을 위한 편의 함수들
import { galleryState } from '../state/signals/gallery.signals';
import { downloadState } from '../state/signals/download.signals';
import { toolbarState } from '../state/signals/toolbar.signals';

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
  // 각 시그널의 초기화 함수들 호출
  // Gallery state reset은 closeGallery를 통해
  if (galleryState.value.isOpen) {
    const { closeGallery } = await import('../state/signals/gallery.signals');
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
    galleryState.subscribe(() => callback(getAppState())),
    downloadState.subscribe(() => callback(getAppState())),
    toolbarState.subscribe(() => callback(getAppState())),
  ];

  // 모든 구독 해제하는 함수 반환
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
  };
}
