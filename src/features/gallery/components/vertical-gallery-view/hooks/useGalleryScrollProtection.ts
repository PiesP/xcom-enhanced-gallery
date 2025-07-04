/**
 * 갤러리 스크롤 보호 커스텀 훅
 * Clean Architecture 원칙에 따라 단순화된 스크롤 관리
 */

import { logger } from '@infrastructure/logging/logger';
import { scrollManager } from '@core/services/scroll/ScrollManager';
import { getPreactHooks } from '@infrastructure/external/vendors';

const { useCallback, useEffect, useRef } = getPreactHooks();

interface UseGalleryScrollProtectionOptions {
  isGalleryOpen: boolean;
  currentIndex: number;
  containerRef: { current: HTMLElement | null };
  mediaItems: readonly unknown[];
}

interface UseGalleryScrollProtectionReturn {
  scrollToCurrentImageSafely: () => void;
  isScrollProtected: boolean;
  resetScrollProtection: () => void;
}

/**
 * 갤러리 스크롤 보호 Hook
 * 통합된 ScrollManager를 사용하여 갤러리 내부 스크롤을 관리
 */
export function useGalleryScrollProtection({
  isGalleryOpen,
  currentIndex,
  containerRef,
  mediaItems,
}: UseGalleryScrollProtectionOptions): UseGalleryScrollProtectionReturn {
  const isInitializedRef = useRef(false);

  /**
   * 갤러리 스크롤 초기화
   */
  const initializeGalleryScrollProtection = useCallback(() => {
    if (!isGalleryOpen || mediaItems.length === 0 || isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;
    logger.debug('갤러리 스크롤 보호 초기화 완료', {
      currentIndex,
      mediaCount: mediaItems.length,
    });
  }, [isGalleryOpen, mediaItems.length, currentIndex]);

  /**
   * 갤러리 스크롤 정리
   */
  const cleanupGalleryScrollProtection = useCallback(() => {
    if (!isInitializedRef.current) {
      return;
    }

    // ScrollManager 상태 리셋 (갤러리 부분만)
    scrollManager.saveGalleryScrollPosition(0);
    isInitializedRef.current = false;

    logger.debug('갤러리 스크롤 보호 정리 완료');
  }, []);

  /**
   * 스크롤 보호 리셋
   */
  const resetScrollProtection = useCallback(() => {
    cleanupGalleryScrollProtection();

    if (isGalleryOpen && mediaItems.length > 0) {
      initializeGalleryScrollProtection();
    }
  }, [
    cleanupGalleryScrollProtection,
    initializeGalleryScrollProtection,
    isGalleryOpen,
    mediaItems.length,
  ]);

  /**
   * 현재 이미지로 안전한 스크롤
   */
  const scrollToCurrentImageSafely = useCallback(() => {
    if (!containerRef.current || currentIndex < 0 || !isInitializedRef.current) {
      return;
    }

    const itemsList = containerRef.current.querySelector(
      '[data-xeg-role="items-list"]'
    ) as HTMLElement;

    if (itemsList) {
      // 통합된 ScrollManager를 사용하여 갤러리 아이템으로 스크롤
      scrollManager.scrollToGalleryItem(itemsList, currentIndex, {
        behavior: 'smooth',
        offset: -10, // 약간의 여백
      });

      logger.debug(`안전한 스크롤: 이미지 ${currentIndex}로 이동 완료`);
    } else {
      logger.warn('아이템 리스트를 찾을 수 없어 안전한 스크롤을 실행할 수 없음');
    }
  }, [containerRef, currentIndex]);

  // 갤러리 열기/닫기 시 자동 처리
  useEffect(() => {
    if (isGalleryOpen && mediaItems.length > 0) {
      initializeGalleryScrollProtection();
    }

    return () => {
      if (isInitializedRef.current) {
        cleanupGalleryScrollProtection();
      }
    };
  }, [
    isGalleryOpen,
    mediaItems.length,
    initializeGalleryScrollProtection,
    cleanupGalleryScrollProtection,
  ]);

  // 현재 인덱스 변경 시 안전한 스크롤
  useEffect(() => {
    if (isGalleryOpen && isInitializedRef.current && currentIndex >= 0) {
      const timeoutId = setTimeout(() => {
        scrollToCurrentImageSafely();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [currentIndex, isGalleryOpen, scrollToCurrentImageSafely]);

  return {
    scrollToCurrentImageSafely,
    isScrollProtected: isInitializedRef.current,
    resetScrollProtection,
  };
}
