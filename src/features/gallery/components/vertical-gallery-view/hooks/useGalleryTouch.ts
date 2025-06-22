/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Touch Gesture Hook
 * @description 갤러리의 터치 제스처를 처리하는 커스텀 훅
 */

import { logger } from '@infrastructure/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';

const { useCallback, useRef } = getPreactHooks();

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isScrolling: boolean;
}

interface UseGalleryTouchOptions {
  onPrevious?: () => void;
  onNext?: () => void;
  onClose?: () => void;
  onToggleUI: (show: boolean) => void;
}

export function useGalleryTouch({
  onPrevious,
  onNext,
  onClose,
  onToggleUI,
}: UseGalleryTouchOptions) {
  const touchStateRef = useRef<TouchState | null>(null);

  // 터치 시작
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;

    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isScrolling: false,
    };
  }, []);

  // 터치 이동
  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touchState = touchStateRef.current;
    const touch = event.touches[0];

    if (!touchState || !touch) return;

    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);

    // 스크롤 여부 판단 (세로 스와이프가 더 클 때)
    if (!touchState.isScrolling && deltaY > deltaX && deltaY > 10) {
      touchState.isScrolling = true;
    }

    // 가로 스와이프가 임계값을 넘으면 스크롤 방지
    if (deltaX > 50 && deltaX > deltaY) {
      event.preventDefault();
    }
  }, []);

  // 터치 종료
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      const touchState = touchStateRef.current;
      const touch = event.changedTouches[0];

      if (!touchState || !touch) {
        touchStateRef.current = null;
        return;
      }

      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      const deltaTime = Date.now() - touchState.startTime;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // 터치 제스처 분석
      const isSwipe = distance > 50 && deltaTime < 300;
      const isTap = distance < 10 && deltaTime < 200;
      const isLongPress = distance < 10 && deltaTime > 500;

      if (touchState.isScrolling) {
        // 스크롤 중이었으면 제스처 무시
        touchStateRef.current = null;
        return;
      }

      if (isSwipe) {
        // 스와이프 제스처
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY) {
          // 가로 스와이프
          if (deltaX > 50) {
            logger.debug('Touch: Swipe right - Previous');
            onPrevious?.();
          } else if (deltaX < -50) {
            logger.debug('Touch: Swipe left - Next');
            onNext?.();
          }
        } else {
          // 세로 스와이프
          if (deltaY < -100) {
            logger.debug('Touch: Swipe up - Show UI');
            onToggleUI(true);
          } else if (deltaY > 100) {
            logger.debug('Touch: Swipe down - Close gallery');
            onClose?.();
          }
        }
      } else if (isTap) {
        // 탭 제스처 - UI 토글
        logger.debug('Touch: Tap - Toggle UI');
        onToggleUI(true);
      } else if (isLongPress) {
        // 길게 누르기 - 갤러리 닫기
        logger.debug('Touch: Long press - Close gallery');
        onClose?.();
      }

      touchStateRef.current = null;
    },
    [onPrevious, onNext, onClose, onToggleUI]
  );

  // 터치 취소
  const handleTouchCancel = useCallback(() => {
    touchStateRef.current = null;
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  };
}
