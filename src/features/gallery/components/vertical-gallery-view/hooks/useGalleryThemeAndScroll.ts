/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 갤러리 테마 및 스크롤 관리 Hook
 * @description 갤러리의 테마 및 스크롤 관리를 처리하는 커스텀 훅
 */

import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';

const { useEffect, useRef, useCallback } = getPreactHooks();

/**
 * 갤러리 테마 및 스크롤 관리 훅
 */
export function useGalleryThemeAndScroll(
  _mediaItems: readonly MediaInfo[],
  currentIndex: number,
  containerRef: { current: HTMLElement | null }
) {
  const themeTimerRef = useRef<string | null>(null);
  const scrollTimerRef = useRef<string | null>(null);

  // 타이머 헬퍼 함수들
  const clearTimer = (timerId: string | null) => {
    if (timerId) {
      clearTimeout(timerId);
    }
  };

  const createTimeout = (callback: () => void, delay: number): string => {
    const timerId = setTimeout(callback, delay);
    return timerId as unknown as string;
  };

  /**
   * 갤러리 초기화 - 단순화된 버전
   */
  const initializeGallery = useCallback(() => {
    try {
      // 투명 기조에서는 복잡한 테마 설정 없이 기본 클래스만 적용
      document.body.classList.add('xeg-gallery-open');

      // 기본 갤러리 컨테이너 클래스 적용
      if (containerRef.current) {
        containerRef.current.classList.add('xeg-glass');
      }

      logger.debug('갤러리 초기화 완료 (투명 테마)');
    } catch (error) {
      logger.error('갤러리 초기화 실패:', error);
    }
  }, [containerRef]);

  /**
   * 스크롤 위치 업데이트
   */
  const updateScrollPosition = useCallback(() => {
    if (!containerRef.current) return;

    try {
      const container = containerRef.current;
      const targetElement = container.querySelector(
        `[data-index="${currentIndex}"]`
      ) as HTMLElement;

      if (targetElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = targetElement.getBoundingClientRect();
        const scrollOffset = elementRect.top - containerRect.top + container.scrollTop - 100;

        container.scrollTo({
          top: scrollOffset,
          behavior: 'smooth',
        });
      }
    } catch (error) {
      logger.warn('스크롤 위치 업데이트 실패:', error);
    }
  }, [currentIndex, containerRef]);

  /**
   * 갤러리 정리 - 개선된 버전
   */
  const cleanupGallery = useCallback(() => {
    try {
      // 약간의 지연을 두어 다른 정리 작업과 순서 조정
      setTimeout(() => {
        document.body.classList.remove('xeg-gallery-open');

        if (containerRef.current) {
          containerRef.current.classList.remove('xeg-glass');
        }

        // 타이머 정리
        if (themeTimerRef.current) {
          clearTimer(themeTimerRef.current);
          themeTimerRef.current = null;
        }

        if (scrollTimerRef.current) {
          clearTimer(scrollTimerRef.current);
          scrollTimerRef.current = null;
        }

        logger.debug('갤러리 정리 완료');
      }, 10);
    } catch (error) {
      logger.error('갤러리 정리 실패:', error);
    }
  }, [containerRef]);

  /**
   * 현재 인덱스 변경 시 스크롤 업데이트
   */
  useEffect(() => {
    if (scrollTimerRef.current) {
      clearTimer(scrollTimerRef.current);
    }

    scrollTimerRef.current = createTimeout(() => {
      updateScrollPosition();
    }, 100);

    return () => {
      if (scrollTimerRef.current) {
        clearTimer(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, [currentIndex, updateScrollPosition]);

  /**
   * 갤러리 초기화 및 정리
   */
  useEffect(() => {
    initializeGallery();

    return () => {
      cleanupGallery();
    };
  }, [initializeGallery, cleanupGallery]);

  return {
    initializeGallery,
    cleanupGallery,
    updateScrollPosition,
  };
}
