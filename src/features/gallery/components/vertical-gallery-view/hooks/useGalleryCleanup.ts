/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Cleanup Hook
 * @description 갤러리 정리 작업을 담당하는 커스텀 훅
 */

import { ComponentManager } from '@shared/components/component-manager';
import { logger } from '@shared/logging';
import { galleryState } from '@shared/state/signals/gallery.signals';

interface UseGalleryCleanupOptions {
  isVisible: boolean;
  hideTimeoutRef: { current: number | null };
  themeCleanup: () => void;
}

export function useGalleryCleanup({
  isVisible,
  hideTimeoutRef,
  themeCleanup,
}: UseGalleryCleanupOptions) {
  const { useCallback, useEffect, useRef } = ComponentManager.getHookManager();
  const isCleanedUp = useRef(false);

  // 타이머 헬퍼 함수
  const clearTimer = useCallback((timerId: number | null) => {
    if (timerId) {
      clearTimeout(timerId);
    }
  }, []);

  // 미디어 요소 정리 - 메모이제이션으로 안정화
  const cleanupMediaElements = useCallback(() => {
    if (isCleanedUp.current) return;

    try {
      // 비디오 요소 정리
      const videos = document.querySelectorAll(
        '.xeg-gallery-container video, [data-gallery-element] video'
      );
      videos.forEach(video => {
        if (video instanceof HTMLVideoElement) {
          video.pause();
          video.currentTime = 0;
          video.src = '';
          video.load();
          // 이벤트 리스너 제거
          video.onloadstart = null;
          video.oncanplay = null;
          video.onended = null;
          video.onerror = null;
        }
      });

      // 이미지 요소 정리 (blob URL 해제)
      const images = document.querySelectorAll(
        '.xeg-gallery-container img, [data-gallery-element] img'
      );
      images.forEach(img => {
        if (img instanceof HTMLImageElement) {
          if (img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
          }
          img.src = '';
          img.onload = null;
          img.onerror = null;
        }
      });

      logger.debug('Media elements cleaned up');
    } catch (error) {
      logger.warn('Error cleaning up media elements:', error);
    }
  }, []);

  // DOM 요소 정리 - 메모이제이션으로 안정화
  const cleanupGalleryDOM = useCallback(() => {
    if (isCleanedUp.current) return;

    try {
      const gallerySelectors = [
        '.xeg-gallery-container',
        '[data-gallery-element]',
        '[data-xeg-gallery]',
        '.xeg-overlay',
        '.xeg-modal',
      ];

      gallerySelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(container => {
          try {
            container.remove();
          } catch (error) {
            logger.debug(`Failed to remove container (${selector}):`, error);
          }
        });
      });
    } catch (error) {
      logger.debug('Error during DOM cleanup:', error);
    }
  }, []);

  // 페이지 상태 복원 및 이벤트 정리 - 개선된 버전
  const restorePageState = useCallback(() => {
    if (isCleanedUp.current) return;

    try {
      // Gallery operates only within its own container
      logger.debug('useGalleryCleanup: 페이지 상태 복원 시작');

      // 갤러리 컨테이너는 완전히 격리되어 있으므로 body 스타일 조작 없음

      // 🔑 개선: 갤러리 상태 명시적 초기화 (이벤트 리스너 정리 보장)
      if (galleryState.value.isOpen) {
        galleryState.value = {
          ...galleryState.value,
          isOpen: false,
          mediaItems: [],
        };
        logger.debug('useGalleryCleanup: 갤러리 상태 강제 초기화');
      }

      // 🔑 개선: 문서 레벨 이벤트 리스너 강제 정리 (혹시 남아있을 수 있는 리스너들)
      // 이는 안전장치 역할로, 정상적으로는 useGalleryScroll의 cleanup에서 처리됨
      const wheelEvents = ['wheel'];
      wheelEvents.forEach(eventType => {
        try {
          // 기존에 등록되었을 수 있는 갤러리 관련 이벤트 리스너 제거 시도
          // (실제 함수 참조가 없어서 완전한 제거는 어렵지만, 상태 기반 차단으로 무력화)
          logger.debug(`useGalleryCleanup: ${eventType} 이벤트 정리 시도`);
        } catch (error) {
          logger.debug(`useGalleryCleanup: ${eventType} 이벤트 정리 실패:`, error);
        }
      });

      logger.debug('useGalleryCleanup: 페이지 상태 복원 완료');
    } catch (error) {
      logger.debug('Failed to restore page state:', error);
    }
  }, []);

  // 타이머 정리 - 메모이제이션으로 안정화
  const cleanupTimers = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimer(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, [clearTimer, hideTimeoutRef]);

  // 전체 정리 함수 - 중복 실행 방지
  const performFullCleanup = useCallback(() => {
    if (isCleanedUp.current) {
      logger.debug('Cleanup already performed, skipping');
      return;
    }

    isCleanedUp.current = true;
    logger.info('Starting full gallery cleanup');

    cleanupTimers();
    cleanupMediaElements();
    themeCleanup();
    restorePageState();

    logger.info('Gallery cleanup completed');
  }, [cleanupTimers, cleanupMediaElements, themeCleanup, restorePageState]);

  // 갤러리 비가시 상태일 때 비디오 정리 - 조건부로 실행
  useEffect(() => {
    if (!isVisible && !isCleanedUp.current) {
      const stopAllVideos = () => {
        const videos = document.querySelectorAll('.xeg-gallery-container video');
        videos.forEach(video => {
          if (video instanceof HTMLVideoElement && !video.paused) {
            video.pause();
            video.currentTime = 0;
          }
        });
      };
      stopAllVideos();
    }
  }, [isVisible]);

  // 언마운트 시에만 전체 정리 실행
  useEffect(() => {
    return () => {
      performFullCleanup();
      cleanupGalleryDOM();
    };
  }, []); // 빈 의존성 배열로 언마운트 시에만 실행

  // 정리 상태 초기화 - 컴포넌트가 다시 마운트될 때
  useEffect(() => {
    isCleanedUp.current = false;
  }, []);

  return {
    cleanupMediaElements,
    cleanupGalleryDOM,
    restorePageState,
    cleanupTimers,
    performFullCleanup,
  };
}
