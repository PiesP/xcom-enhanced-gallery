/**
 * @fileoverview 스크롤 위치 관리 전용 훅
 * @description 갤러리와 스크롤 위치 복원을 안전하게 처리하는 커스텀 훅
 */

import { ComponentManager } from '@shared/components/component-manager';
import {
  saveScrollPosition,
  restoreScrollPosition,
  clearSavedScrollPosition,
} from '@shared/browser/utils/browser-utils';
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
      saveScrollPosition();
      logger.debug('[ScrollPositionManager] 스크롤 위치 저장 완료');
    } catch (error) {
      logger.warn('[ScrollPositionManager] 스크롤 위치 저장 실패:', error);
    }
  }, [enabled]);

  // 스크롤 위치 수동 복원
  const restorePosition = useCallback(() => {
    if (!enabled) return;

    try {
      restoreScrollPosition();
      logger.debug('[ScrollPositionManager] 스크롤 위치 복원 완료');
    } catch (error) {
      logger.warn('[ScrollPositionManager] 스크롤 위치 복원 실패:', error);
    }
  }, [enabled]);

  // 저장된 위치 초기화
  const clearPosition = useCallback(() => {
    try {
      clearSavedScrollPosition();
      logger.debug('[ScrollPositionManager] 저장된 스크롤 위치 초기화 완료');
    } catch (error) {
      logger.warn('[ScrollPositionManager] 스크롤 위치 초기화 실패:', error);
    }
  }, []);

  // 갤러리 상태 변화 감지 및 자동 처리
  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (isGalleryOpen) {
      // 갤러리가 열렸을 때 스크롤 위치 저장
      saveCurrentPosition();
      onGalleryOpen?.();
    } else {
      // 갤러리가 닫혔을 때 스크롤 위치 복원
      // 약간의 지연을 두어 DOM 변경이 완료된 후 복원
      timeoutId = setTimeout(() => {
        restorePosition();
        onGalleryClose?.();
      }, 10);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isGalleryOpen, enabled, saveCurrentPosition, restorePosition, onGalleryOpen, onGalleryClose]);

  return {
    saveCurrentPosition,
    restorePosition,
    clearPosition,
  };
}
