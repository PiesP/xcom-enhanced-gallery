/**
 * 갤러리 스크롤 보호 커스텀 훅
 * Clean Architecture 원칙에 따라 단순화된 스크롤 관리
 */

import { logger } from '@infrastructure/logging/logger';
import { galleryScrollManager } from '@shared/utils/core/dom/gallery-scroll-manager';
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
 * 갤러리 내부 스크롤만 관리 (페이지 스크롤은 GalleryStateManager에서 처리)
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
    logger.debug('Gallery scroll protection initialized', {
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

    galleryScrollManager.reset();
    isInitializedRef.current = false;

    logger.debug('Gallery scroll protection cleanup completed');
  }, []);

  /**
   * 스크롤 보호 리셋
   */
  const resetScrollProtection = useCallback(() => {
    cleanupGalleryScrollProtection();
    galleryScrollManager.reset();

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

    const itemsList = containerRef.current.querySelector('.itemsList') as HTMLElement;

    if (itemsList) {
      galleryScrollManager.setFocusedImageIndex(currentIndex);
      galleryScrollManager.scrollToImageTopSafely(itemsList, currentIndex, {
        behavior: 'smooth',
      });

      logger.debug(`Safe scroll to image ${currentIndex} executed`);
    } else {
      logger.warn('Items list not found for safe scrolling');
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
