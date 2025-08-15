/**
 * 페이지 언로드 시 갤러리 관련 정리 작업을 수행합니다.
 * 브라우저 탐색 중에 갤러리가 열린 상태로 남아있을 경우를 대비한 예방적 조치입니다.
 *
 * @module PageUnloadCleanup
 */

import { logger } from '@shared/logging';

/**
 * 페이지 언로드 시 body overflow 복구를 보장하는 정리 로직
 */
export function initializePageUnloadCleanup(): void {
  const safeWindow: Window | null = typeof window !== 'undefined' ? window : null;

  if (!safeWindow || typeof document === 'undefined') {
    return;
  }

  /**
   * beforeunload 이벤트에서 body overflow 강제 복구
   * 갤러리가 열린 상태로 페이지를 떠날 경우 스크롤 차단을 방지합니다.
   */
  const handleBeforeUnload = (): void => {
    try {
      if (document.body) {
        // body overflow 강제 복구
        document.body.style.overflow = '';
        document.body.classList.remove('xeg-scroll-lock');

        logger.debug('[PageUnload] Body overflow 정리 완료');
      }
    } catch {
      // beforeunload에서는 console.error도 제한될 수 있으므로 무시
    }
  };

  /**
   * pagehide 이벤트에서 세션스토리지 정리
   * 불필요한 스크롤 위치 데이터를 제거합니다.
   */
  const handlePageHide = (): void => {
    try {
      if (safeWindow.sessionStorage) {
        // XEG 관련 세션스토리지 키 찾기 및 정리
        const keysToRemove: string[] = [];
        for (let i = 0; i < safeWindow.sessionStorage.length; i++) {
          const key = safeWindow.sessionStorage.key(i);
          if (key?.startsWith('xeg_scroll_')) {
            keysToRemove.push(key);
          }
        }

        // 배치 삭제
        keysToRemove.forEach(key => {
          try {
            safeWindow.sessionStorage.removeItem(key);
          } catch {
            // 개별 삭제 실패는 무시
          }
        });

        logger.debug(`[PageUnload] 세션스토리지 정리 완료 (${keysToRemove.length}개 키)`);
      }
    } catch {
      // pagehide에서도 로그 제한이 있을 수 있으므로 무시
    }
  };

  // 이벤트 리스너 등록
  safeWindow.addEventListener('beforeunload', handleBeforeUnload, { passive: true });
  safeWindow.addEventListener('pagehide', handlePageHide, { passive: true });

  logger.debug('[PageUnload] 정리 로직 초기화 완료');
}

/**
 * 즉시 body overflow 복구 실행 (수동 호출용)
 */
export function forceBodyOverflowRestore(): boolean {
  try {
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = '';
      document.body.classList.remove('xeg-scroll-lock');
      logger.debug('[PageUnload] 수동 body overflow 복구 완료');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('[PageUnload] 수동 body overflow 복구 실패:', error);
    return false;
  }
}
