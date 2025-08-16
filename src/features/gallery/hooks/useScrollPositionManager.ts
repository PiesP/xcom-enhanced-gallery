/**
 * @fileoverview 스크롤 위치 관리 전용 훅
 * @description 갤러리와 스크롤 위치 복원을 안전하게 처리하는 커스텀 훅
 */

import { ComponentManager } from '@shared/components/component-manager';
import { ScrollPositionController } from '@shared/scroll/scroll-position-controller';
import { logger } from '@shared/logging';

const { useEffect, useCallback } = ComponentManager.getHookManager();

/**
 * 스크롤 위치 관리 옵션
 */
export interface UseScrollPositionManagerOptions {
  /** 스크롤 위치 관리 활성화 여부 */
  enabled?: boolean;
  /** 갤러리 열림 상태 */
  isGalleryOpen: boolean;
  /** 갤러리 열기 콜백 */
  onGalleryOpen?: () => void;
  /** 갤러리 닫기 콜백 */
  onGalleryClose?: () => void;
}

/**
 * 스크롤 위치 관리 반환 타입
 */
export interface UseScrollPositionManagerReturn {
  /** 스크롤 위치 수동 저장 */
  saveCurrentPosition: () => void;
  /** 스크롤 위치 수동 복원 */
  restorePosition: () => void;
  /** 저장된 위치 초기화 */
  clearPosition: () => void;
}

/**
 * 갤러리 스크롤 위치 관리 훅
 *
 * @description
 * - 갤러리 열기/닫기와 연동하여 자동으로 스크롤 위치 저장/복원
 * - 타입 안전성 보장
 * - 에러 처리 포함
 * - getter 함수를 통한 안전한 브라우저 API 접근
 *
 * @param options - 스크롤 위치 관리 옵션
 * @returns 스크롤 위치 관리 함수들
 */
export function useScrollPositionManager({
  enabled = true,
  isGalleryOpen,
  onGalleryOpen,
  onGalleryClose,
}: UseScrollPositionManagerOptions): UseScrollPositionManagerReturn {
  // 스크롤 위치 수동 저장
  const saveCurrentPosition = useCallback(() => {
    if (!enabled) return;

    try {
      ScrollPositionController.save();
      logger.debug('[ScrollPositionManager] 스크롤 위치 저장 완료');
    } catch (error) {
      logger.warn('[ScrollPositionManager] 스크롤 위치 저장 실패:', error);
    }
  }, [enabled]);

  // 스크롤 위치 수동 복원
  const restorePosition = useCallback(() => {
    if (!enabled) return;

    try {
      ScrollPositionController.restore({ smooth: false, mode: 'immediate' });
      logger.debug('[ScrollPositionManager] 스크롤 위치 복원 완료');
    } catch (error) {
      logger.warn('[ScrollPositionManager] 스크롤 위치 복원 실패:', error);
    }
  }, [enabled]);

  // 저장된 위치 초기화
  const clearPosition = useCallback(() => {
    try {
      ScrollPositionController.clear();
      logger.debug('[ScrollPositionManager] 저장된 스크롤 위치 초기화 완료');
    } catch (error) {
      logger.warn('[ScrollPositionManager] 스크롤 위치 초기화 실패:', error);
    }
  }, []);

  // 갤러리 상태 변화 감지 및 자동 처리
  useEffect(() => {
    if (!enabled) return;

    if (isGalleryOpen) {
      // 갤러리가 열렸을 때 스크롤 위치 저장 (즉시)
      saveCurrentPosition();
      onGalleryOpen?.();
      return;
    }

    // 갤러리가 닫힐 때: 언마운트 직전이라도 즉시 복원하여 timeout 취소 문제 제거
    // 1) 즉시 복원 (가장 신뢰도 높음)
    try {
      restorePosition();
    } catch (e) {
      logger.warn('[ScrollPositionManager] 즉시 복원 중 오류:', e);
    }

    // 2) 레이아웃/스타일 적용이 늦게 완료되는 경우를 대비한 1~2프레임 후 보정 복원 (선택적)
    // requestAnimationFrame 이 존재하는 환경에서만 실행하며 실패해도 무시
    const raf = (cb: () => void) => {
      try {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => {
            try {
              cb();
            } catch (err) {
              logger.debug('[ScrollPositionManager] rAF 보정 실패:', err);
            }
          });
        }
      } catch {
        // ignore
      }
    };
    raf(() => restorePosition());
    raf(() => restorePosition()); // 2프레임 보정 (갤러리 오버레이 제거 후 스크롤바 reflow 대비)

    onGalleryClose?.();
  }, [isGalleryOpen, enabled, saveCurrentPosition, restorePosition, onGalleryOpen, onGalleryClose]);

  return {
    saveCurrentPosition,
    restorePosition,
    clearPosition,
  };
}
