/**
 * @fileoverview TDD REFACTOR Phase: 개선된 갤러리 휠 스크롤 관리
 * @description 기존 useGalleryScroll 훅의 개선사항을 적용한 새 버전
 */

import { getPreactHooks } from '@shared/external/vendors';
import { isHTMLElement } from '@shared/utils/dom-guards';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/EventManager';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { findTwitterScrollContainer } from '@shared/utils';

const { useEffect, useRef, useCallback } = getPreactHooks();

interface ImageSize {
  width: number;
  height: number;
}

interface ViewportSize {
  width: number;
  height: number;
}

interface UseGalleryScrollOptions {
  /** 갤러리 컨테이너 참조 */
  container: HTMLElement | null;
  /** 스크롤 콜백 함수 */
  onScroll?: (delta: number) => void;
  /** 스크롤 처리 활성화 여부 */
  enabled?: boolean;
  /** 트위터 페이지 스크롤 차단 여부 */
  blockTwitterScroll?: boolean;
  /** 스크롤 방향 감지 활성화 여부 */
  enableScrollDirection?: boolean;
  /** 스크롤 방향 변경 콜백 */
  onScrollDirectionChange?: (direction: 'up' | 'down' | 'idle') => void;
  /** 이미지 크기 정보 (조건적 처리용) */
  imageSize?: ImageSize | null;
  /** 뷰포트 크기 정보 (조건적 처리용) */
  viewportSize?: ViewportSize | null;
  /** 이미지 네비게이션 콜백 (작은 이미지일 때) */
  onImageNavigation?: (direction: 'next' | 'prev') => void;
}

interface UseGalleryScrollReturn {
  /** 마지막 스크롤 시간 */
  lastScrollTime: number;
  /** 현재 스크롤 중인지 여부 */
  isScrolling: boolean;
  /** 현재 스크롤 방향 (옵션) */
  scrollDirection?: 'up' | 'down' | 'idle';
}

/**
 * 갤러리 휠 스크롤 이벤트 누출 방지를 위한 개선된 훅
 *
 * @description
 * - 갤러리 열림 상태에서 wheel 이벤트를 확실히 차단
 * - 이미지 크기에 따른 조건적 처리 (작은 이미지: 네비게이션, 큰 이미지: 스크롤)
 * - 브라우저 호환성을 위한 JavaScript 대안 제공
 * - 향상된 타입 안전성과 에러 처리
 *
 * @param options - 훅 설정 옵션
 * @returns 스크롤 상태 정보
 */
export function useGalleryScrollEnhanced({
  container,
  onScroll,
  enabled = true,
  blockTwitterScroll = true,
  enableScrollDirection = false,
  onScrollDirectionChange,
  imageSize,
  viewportSize,
  onImageNavigation,
}: UseGalleryScrollOptions): UseGalleryScrollReturn {
  const eventManagerRef = useRef(new EventManager());
  const isScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  // 스크롤 방향 감지 관련 상태 (옵션)
  const scrollDirectionRef = useRef<'up' | 'down' | 'idle'>('idle');
  const directionTimeoutRef = useRef<number | null>(null);

  // 스크롤 상태 업데이트
  const updateScrollState = useCallback((isScrolling: boolean) => {
    isScrollingRef.current = isScrolling;
    if (isScrolling) {
      lastScrollTimeRef.current = Date.now();
    }
  }, []);

  // 스크롤 방향 업데이트 (옵션)
  const updateScrollDirection = useCallback(
    (delta: number) => {
      if (!enableScrollDirection) return;

      const newDirection: 'up' | 'down' | 'idle' = delta > 0 ? 'down' : 'up';

      if (scrollDirectionRef.current !== newDirection) {
        scrollDirectionRef.current = newDirection;
        onScrollDirectionChange?.(newDirection);

        logger.debug('useGalleryScrollEnhanced: 스크롤 방향 변경', {
          direction: newDirection,
          delta,
        });
      }

      // 스크롤 방향 idle 상태로 전환 타이머
      if (directionTimeoutRef.current) {
        clearTimeout(directionTimeoutRef.current);
      }

      directionTimeoutRef.current = window.setTimeout(() => {
        if (scrollDirectionRef.current !== 'idle') {
          scrollDirectionRef.current = 'idle';
          onScrollDirectionChange?.('idle');
        }
      }, 150);
    },
    [enableScrollDirection, onScrollDirectionChange]
  );

  // 이미지가 뷰포트보다 작은지 판단
  const isImageSmallerThanViewport = useCallback((): boolean => {
    if (!imageSize || !viewportSize) {
      logger.debug('useGalleryScrollEnhanced: 이미지 또는 뷰포트 크기 정보 없음');
      return false;
    }

    const isSmaller =
      imageSize.width <= viewportSize.width && imageSize.height <= viewportSize.height;

    logger.debug('useGalleryScrollEnhanced: 이미지 크기 비교', {
      imageSize,
      viewportSize,
      isSmaller,
    });

    return isSmaller;
  }, [imageSize, viewportSize]);

  // CSS overscroll-behavior 지원 여부 확인
  const supportsOverscrollBehavior = useCallback((): boolean => {
    try {
      return CSS.supports('overscroll-behavior', 'contain');
    } catch (error) {
      logger.debug('useGalleryScrollEnhanced: CSS.supports 확인 실패', error);
      return false;
    }
  }, []);

  // JavaScript 대안으로 스크롤 체이닝 방지
  const preventScrollChaining = useCallback((event: WheelEvent, target: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = target;

    // 스크롤 끝에서 추가 스크롤 방지
    const isAtTop = scrollTop === 0 && event.deltaY < 0;
    const isAtBottom = scrollTop >= scrollHeight - clientHeight && event.deltaY > 0;

    if (isAtTop || isAtBottom) {
      event.preventDefault();
      logger.debug('useGalleryScrollEnhanced: 스크롤 체이닝 방지 (JavaScript 대안)', {
        scrollTop,
        scrollHeight,
        clientHeight,
        deltaY: event.deltaY,
        reason: isAtTop ? 'top' : 'bottom',
      });
    }
  }, []);

  // 스크롤 종료 감지
  const handleScrollEnd = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      updateScrollState(false);
      logger.debug('useGalleryScrollEnhanced: 스크롤 종료');
    }, 150);
  }, [updateScrollState]);

  // 개선된 갤러리 휠 이벤트 처리
  const handleGalleryWheel = useCallback(
    (event: WheelEvent) => {
      try {
        // 갤러리가 열려있지 않으면 무시
        if (!galleryState.value?.isOpen) {
          logger.debug('useGalleryScrollEnhanced: 갤러리가 열려있지 않음 - 휠 이벤트 무시');
          return;
        }

        // 갤러리가 열려있으면 항상 문서 레벨 전파 차단
        event.preventDefault();
        event.stopPropagation();

        const delta = event.deltaY;
        updateScrollState(true);

        // 스크롤 방향 감지 (옵션)
        updateScrollDirection(delta);

        // 이미지 크기에 따른 조건적 처리
        const isSmallImage = isImageSmallerThanViewport();

        if (isSmallImage && onImageNavigation) {
          // 작은 이미지: wheel 이벤트로 이미지 네비게이션
          const direction = delta > 0 ? 'next' : 'prev';
          onImageNavigation(direction);

          logger.debug('useGalleryScrollEnhanced: 작은 이미지 - 네비게이션 처리', {
            direction,
            delta,
            imageSize,
            viewportSize,
          });
        } else {
          // 큰 이미지: 기존 스크롤 콜백 실행
          if (onScroll) {
            onScroll(delta);
          }

          // CSS overscroll-behavior 미지원 시 JavaScript 대안 적용
          if (!supportsOverscrollBehavior() && container) {
            preventScrollChaining(event, container);
          }

          logger.debug('useGalleryScrollEnhanced: 큰 이미지 - 스크롤 처리', {
            delta,
            imageSize,
            viewportSize,
            hasOverscrollSupport: supportsOverscrollBehavior(),
          });
        }

        // 스크롤 종료 감지 타이머 재설정
        handleScrollEnd();

        const rawTarget = event.target;
        const targetTag = isHTMLElement(rawTarget) ? rawTarget.tagName : 'unknown';

        logger.debug('useGalleryScrollEnhanced: 휠 이벤트 처리 완료', {
          delta,
          isGalleryOpen: galleryState.value?.isOpen,
          isSmallImage,
          targetElement: targetTag,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('useGalleryScrollEnhanced: 휠 이벤트 처리 중 오류', error);
      }
    },
    [
      onScroll,
      updateScrollState,
      handleScrollEnd,
      updateScrollDirection,
      isImageSmallerThanViewport,
      onImageNavigation,
      imageSize,
      viewportSize,
      supportsOverscrollBehavior,
      preventScrollChaining,
      container,
    ]
  );

  // 트위터 페이지 스크롤 차단 (기존 로직 유지)
  const preventTwitterScroll = useCallback(
    (event: Event) => {
      if (isScrollingRef.current && blockTwitterScroll) {
        event.preventDefault();
        event.stopPropagation();
        logger.debug('useGalleryScrollEnhanced: 트위터 스크롤 차단');
      }
    },
    [blockTwitterScroll]
  );

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!enabled || !container) {
      return;
    }

    const eventManager = eventManagerRef.current;

    try {
      // 문서 레벨에서 휠 이벤트 처리 (갤러리 열림 상태에 따라 동작)
      eventManager.addEventListener(document, 'wheel', handleGalleryWheel, {
        capture: true,
        passive: false,
      });

      // 트위터 페이지 스크롤 차단 (옵션)
      if (blockTwitterScroll) {
        const twitterContainer = findTwitterScrollContainer();
        if (twitterContainer) {
          eventManager.addEventListener(twitterContainer, 'wheel', preventTwitterScroll, {
            capture: true,
            passive: false,
          });
        }
      }

      logger.debug('useGalleryScrollEnhanced: 이벤트 리스너 등록 완료', {
        hasContainer: !!container,
        blockTwitterScroll,
        supportsOverscroll: supportsOverscrollBehavior(),
      });
    } catch (error) {
      logger.error('useGalleryScrollEnhanced: 이벤트 리스너 등록 실패', error);
    }

    return () => {
      try {
        eventManager.cleanup();

        // 타이머 정리
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // 방향 감지 타이머 정리
        if (directionTimeoutRef.current) {
          clearTimeout(directionTimeoutRef.current);
        }

        logger.debug('useGalleryScrollEnhanced: 정리 완료');
      } catch (error) {
        logger.error('useGalleryScrollEnhanced: 정리 중 오류', error);
      }
    };
  }, [
    enabled,
    container,
    blockTwitterScroll,
    handleGalleryWheel,
    preventTwitterScroll,
    supportsOverscrollBehavior,
  ]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      try {
        eventManagerRef.current.cleanup();
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (directionTimeoutRef.current) {
          clearTimeout(directionTimeoutRef.current);
        }
      } catch (error) {
        logger.error('useGalleryScrollEnhanced: 언마운트 정리 중 오류', error);
      }
    };
  }, []);

  return {
    lastScrollTime: lastScrollTimeRef.current,
    isScrolling: isScrollingRef.current,
    ...(enableScrollDirection && { scrollDirection: scrollDirectionRef.current }),
  };
}
