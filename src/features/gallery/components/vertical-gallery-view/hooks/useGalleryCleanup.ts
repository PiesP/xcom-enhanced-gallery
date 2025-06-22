/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Cleanup Hook
 * @description 갤러리 정리 작업을 담당하는 커스텀 훅
 */

import { logger } from '@infrastructure/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';
import { clearManagedTimer } from '@shared/utils/timer-utils';

const { useCallback, useEffect } = getPreactHooks();

interface UseGalleryCleanupOptions {
  isVisible: boolean;
  hideTimeoutRef: { current: string | null };
  themeCleanup: () => void;
}

export function useGalleryCleanup({
  isVisible,
  hideTimeoutRef,
  themeCleanup,
}: UseGalleryCleanupOptions) {
  // 미디어 요소 정리
  const cleanupMediaElements = useCallback(() => {
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

  // DOM 요소 정리
  const cleanupGalleryDOM = useCallback(() => {
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

  // 페이지 상태 복원
  const restorePageState = useCallback(() => {
    try {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('pointer-events');
      document.documentElement.style.removeProperty('overflow');
      document.body.classList.remove('xeg-gallery-open');
    } catch (error) {
      logger.debug('Failed to restore page state:', error);
    }
  }, []);

  // 타이머 정리
  const cleanupTimers = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearManagedTimer(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, [hideTimeoutRef]);

  // 전체 정리 함수
  const performFullCleanup = useCallback(() => {
    logger.info('Starting full gallery cleanup');

    cleanupTimers();
    cleanupMediaElements();
    themeCleanup();
    restorePageState();

    logger.info('Gallery cleanup completed');
  }, [cleanupTimers, cleanupMediaElements, themeCleanup, restorePageState]);

  // 갤러리 비가시 상태일 때 비디오 정리
  useEffect(() => {
    if (!isVisible) {
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

  // 언마운트 시 전체 정리
  useEffect(() => {
    return () => {
      performFullCleanup();
      cleanupGalleryDOM();
    };
  }, [performFullCleanup, cleanupGalleryDOM]);

  return {
    cleanupMediaElements,
    cleanupGalleryDOM,
    restorePageState,
    cleanupTimers,
    performFullCleanup,
  };
}
