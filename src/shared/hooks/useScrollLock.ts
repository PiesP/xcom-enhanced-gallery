/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 갤러리 호환 스크롤 잠금 전용 커스텀 훅
 * @description 갤러리 내부 스크롤과 충돌하지 않는 개선된 스크롤 락 시스템
 * @version 3.0.0 - 갤러리 충돌 해결
 */

import { getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

const { useCallback, useRef } = getPreactHooks();

interface UseScrollLockReturn {
  lockScroll: () => void;
  unlockScroll: () => void;
  isLocked: () => boolean;
}

interface OriginalScrollState {
  docOverflow: string;
  bodyOverflow: string;
  wheelHandler?: (event: WheelEvent) => void;
}

/**
 * 갤러리 호환 스크롤 잠금 전용 커스텀 훅
 *
 * @description
 * 갤러리 내부 스크롤을 보존하면서 배경 스크롤을 차단:
 * - CSS 클래스 기반 스크롤 제어 (우선)
 * - document.documentElement와 document.body 직접 제어 (백업)
 * - 갤러리 내부 wheel 이벤트 보존
 * - 중복 락 방지 및 안전한 언락
 *
 * @returns {UseScrollLockReturn} 스크롤 락 제어 함수들
 */
export const useScrollLock = (): UseScrollLockReturn => {
  const originalStateRef = useRef<OriginalScrollState | null>(null);

  const lockScroll = useCallback(() => {
    // 중복 락 방지
    if (originalStateRef.current) {
      logger.debug('스크롤이 이미 잠겨있습니다.');
      return;
    }

    try {
      const docElement = document.documentElement;
      const bodyElement = document.body;

      // 현재 상태 저장
      const originalState: OriginalScrollState = {
        docOverflow: docElement.style.overflow || '',
        bodyOverflow: bodyElement.style.overflow || '',
      };

      // CSS 클래스 기반 스크롤 락 적용 (우선 방법)
      bodyElement.classList.add('xeg-no-scroll');

      // 스타일 기반 백업 제어
      docElement.style.overflow = 'hidden';
      bodyElement.style.overflow = 'hidden';

      // 갤러리 외부 wheel 이벤트만 차단하는 핸들러
      const handleWheelEvent = (event: WheelEvent) => {
        const target = event.target as Element;

        // 갤러리 내부 요소 확인
        if (
          target.closest(
            '.xeg-gallery-container, .content, .itemsList, [class*="vertical-gallery"], [class*="gallery-view"]'
          )
        ) {
          // 갤러리 내부에서는 스크롤 허용
          return;
        }

        // 갤러리 외부에서만 스크롤 차단
        event.preventDefault();
        event.stopPropagation();
      };

      // 캡처링 단계에서 이벤트를 처리하여 확실한 차단
      document.addEventListener('wheel', handleWheelEvent, {
        passive: false,
        capture: true,
      });
      originalState.wheelHandler = handleWheelEvent;

      originalStateRef.current = originalState;
      logger.debug('스크롤 잠금 활성화 (갤러리 호환 모드)');
    } catch (error) {
      logger.error('스크롤 잠금 실패:', error);
    }
  }, []);

  const unlockScroll = useCallback(() => {
    if (!originalStateRef.current) {
      logger.debug('잠금 해제할 스크롤 상태가 없습니다.');
      return;
    }

    try {
      const { docOverflow, bodyOverflow, wheelHandler } = originalStateRef.current;
      const docElement = document.documentElement;
      const bodyElement = document.body;

      // CSS 클래스 제거
      bodyElement.classList.remove('xeg-no-scroll');

      // 원래 스타일 복원
      docElement.style.overflow = docOverflow;
      bodyElement.style.overflow = bodyOverflow;

      // wheel 이벤트 리스너 제거 (캡처 옵션과 일치)
      if (wheelHandler) {
        document.removeEventListener('wheel', wheelHandler, { capture: true });
      }

      originalStateRef.current = null;
      logger.debug('스크롤 잠금 해제 완료');
    } catch (error) {
      logger.error('스크롤 잠금 해제 실패:', error);
    }
  }, []);

  const isLocked = useCallback(() => {
    return originalStateRef.current !== null;
  }, []);

  return {
    lockScroll,
    unlockScroll,
    isLocked,
  };
};

export default useScrollLock;
