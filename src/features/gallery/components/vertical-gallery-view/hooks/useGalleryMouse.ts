/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Mouse Interaction Hook
 * @description 갤러리의 마우스/터치 상호작용을 처리하는 커스텀 훅
 */

import { logger } from '@infrastructure/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';
import { clearManagedTimer, createRefManagedTimeout } from '@shared/utils/timer-utils';

const { useCallback } = getPreactHooks();

interface UseGalleryMouseOptions {
  onClose: () => void;
  onToggleUI: (show: boolean) => void;
  isToolbarHovering: boolean;
  hideTimeoutRef: { current: string | null };
}

export function useGalleryMouse({
  onClose,
  onToggleUI,
  isToolbarHovering,
  hideTimeoutRef,
}: UseGalleryMouseOptions) {
  // 툴바 마우스 엔터 핸들러
  const handleToolbarMouseEnter = useCallback(() => {
    onToggleUI(true);

    // 기존 타이머 정리
    if (hideTimeoutRef.current) {
      clearManagedTimer(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, [onToggleUI, hideTimeoutRef]);

  // 툴바 마우스 리브 핸들러
  const handleToolbarMouseLeave = useCallback(() => {
    // 툴바를 벗어나면 0.5초 후 숨김
    if (hideTimeoutRef.current) {
      clearManagedTimer(hideTimeoutRef.current);
    }

    createRefManagedTimeout(
      hideTimeoutRef,
      () => {
        onToggleUI(false);
      },
      500
    );
  }, [onToggleUI, hideTimeoutRef]);

  // 마우스 이동 핸들러 (상단 100px 영역 감지)
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const isInTopArea = event.clientY <= 100;

      if (isInTopArea) {
        onToggleUI(true);

        // 기존 타이머 정리
        if (hideTimeoutRef.current) {
          clearManagedTimer(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }

        // 툴바 호버 상태가 아닐 때만 자동 숨김 타이머 설정
        if (!isToolbarHovering) {
          createRefManagedTimeout(
            hideTimeoutRef,
            () => {
              onToggleUI(false);
            },
            500
          );
        }
      } else {
        // 상단 100px 외부: 툴바 호버 상태 확인 후 즉시 숨김
        if (!isToolbarHovering) {
          if (hideTimeoutRef.current) {
            clearManagedTimer(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }
          onToggleUI(false);
        }
      }
    },
    [onToggleUI, isToolbarHovering, hideTimeoutRef]
  );

  // 배경 클릭 핸들러
  const handleBackgroundClick = useCallback(
    (event: MouseEvent, containerRef: { current: HTMLDivElement | null }) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.target === containerRef.current) {
        logger.debug('Gallery: Background click, closing gallery');
        onClose();
      }
    },
    [onClose]
  );

  // 콘텐츠 클릭 핸들러
  const handleContentClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // tweetPhoto 컨테이너 내부 클릭인지 확인
    const tweetPhotoContainer = target.closest('[data-testid="tweetPhoto"]');

    if (tweetPhotoContainer) {
      logger.debug('Gallery: tweetPhoto click detected - allowing propagation');
      return;
    }

    // 이미지나 미디어 관련 요소는 이벤트 전파 허용
    if (
      target.tagName === 'IMG' ||
      target.tagName === 'VIDEO' ||
      target.classList.contains('css-9pa8cd') ||
      target.closest('.xeg-vertical-image-item') ||
      target.closest('[data-gallery-item]')
    ) {
      logger.debug('Gallery: Media element click - allowing propagation');
      return;
    }

    // 다른 영역 클릭은 이벤트 전파 차단
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, []);

  return {
    handleToolbarMouseEnter,
    handleToolbarMouseLeave,
    handleMouseMove,
    handleBackgroundClick,
    handleContentClick,
  };
}
