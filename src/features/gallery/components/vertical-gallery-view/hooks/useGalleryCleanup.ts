/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Cleanup Hook
 * @description 갤러리 정리 작업을 담당하는 커스텀 훅 (Solid.js 기반)
 */

import { logger } from '../../../../../shared/logging/logger';
import { getSolid } from '../../../../../shared/external/vendors';
import { globalTimerManager } from '../../../../../shared/utils/timer-management';

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

const toAccessor = <T>(value: MaybeAccessor<T>): Accessor<T> =>
  typeof value === 'function' ? (value as Accessor<T>) : () => value;

interface UseGalleryCleanupOptions {
  isVisible: MaybeAccessor<boolean>;
  hideTimeoutRef: { current: number | null };
  themeCleanup: () => void;
}

export function useGalleryCleanup({
  isVisible,
  hideTimeoutRef,
  themeCleanup,
}: UseGalleryCleanupOptions) {
  const { createEffect, onCleanup } = getSolid();

  const isVisibleAccessor = toAccessor(isVisible);

  let isCleanedUp = false;

  const clearTimer = (timerId: number | null) => {
    if (timerId) {
      globalTimerManager.clearTimeout(timerId);
    }
  };

  const cleanupTimers = () => {
    if (hideTimeoutRef.current) {
      clearTimer(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const cleanupMediaElements = () => {
    if (isCleanedUp) return;

    try {
      const videos = document.querySelectorAll(
        '.xeg-gallery-container video, [data-gallery-element] video'
      );
      videos.forEach(video => {
        if (video instanceof HTMLVideoElement) {
          video.pause();
          video.currentTime = 0;
          video.src = '';
          video.load();
          video.onloadstart = null;
          video.oncanplay = null;
          video.onended = null;
          video.onerror = null;
        }
      });

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
  };

  const cleanupGalleryDOM = () => {
    if (isCleanedUp) return;

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
  };

  const restorePageState = () => {
    if (isCleanedUp) return;

    try {
      document.body.style.removeProperty('pointer-events');
      logger.debug('useGalleryCleanup: 페이지 상태 복원 완료');
    } catch (error) {
      logger.debug('Failed to restore page state:', error);
    }
  };

  const performFullCleanup = () => {
    if (isCleanedUp) {
      logger.debug('Cleanup already performed, skipping');
      return;
    }

    isCleanedUp = true;
    logger.info('Starting full gallery cleanup');

    cleanupTimers();
    cleanupMediaElements();
    themeCleanup();
    restorePageState();

    logger.info('Gallery cleanup completed');
  };

  createEffect(() => {
    const visible = isVisibleAccessor();

    if (!visible && !isCleanedUp) {
      const videos = document.querySelectorAll('.xeg-gallery-container video');
      videos.forEach(video => {
        if (video instanceof HTMLVideoElement && !video.paused) {
          video.pause();
          video.currentTime = 0;
        }
      });
    }
  });

  onCleanup(() => {
    performFullCleanup();
    cleanupGalleryDOM();
  });

  createEffect(() => {
    isCleanedUp = false;
  });

  return {
    cleanupMediaElements,
    cleanupGalleryDOM,
    restorePageState,
    cleanupTimers,
    performFullCleanup,
  };
}
