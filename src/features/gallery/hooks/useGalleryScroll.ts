/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 개선된 갤러리 스크롤 관리 훅
 * @description 마우스 움직임에 의존하지 않는 안정적인 스크롤 처리를 제공
 */

import { getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';
import { createEventManager } from '@shared/dom/DOMEventManager';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { findTwitterScrollContainer } from '@shared/utils';

const { useEffect, useRef, useCallback } = getPreactHooks();

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
 * 갤러리 스크롤 처리를 위한 개선된 커스텀 훅
 *
 * @description
 * - 갤러리 열림 상태 기반 스크롤 감지 (event.target 의존성 제거)
 * - 가상 스크롤링과 DOM 재배치에 안정적으로 대응
 * - 트위터 페이지와의 이벤트 충돌 방지
 * - 안정적인 이벤트 리스너 관리
 * - 메모리 누수 방지
 *
 * @version 2.0.0 - DOM 재배치 대응 개선
 */
export function useGalleryScroll({
  container,
  onScroll,
  enabled = true,
  blockTwitterScroll = true,
  enableScrollDirection = false,
  onScrollDirectionChange,
}: UseGalleryScrollOptions): UseGalleryScrollReturn {
  const eventManagerRef = useRef(createEventManager());
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

        logger.debug('useGalleryScroll: 스크롤 방향 변경', {
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

  // 스크롤 종료 감지
  const handleScrollEnd = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      updateScrollState(false);
      logger.debug('useGalleryScroll: 스크롤 종료');
    }, 150);
  }, [updateScrollState]);

  // 트위터 페이지 스크롤 차단 - 개선된 버전 (갤러리 내부 제외)
  const preventTwitterScroll = useCallback(
    (event: Event) => {
      // 갤러리가 열려있지 않으면 차단하지 않음
      if (!galleryState.value.isOpen || !blockTwitterScroll) {
        return;
      }

      // 🔑 핵심 개선: 이벤트가 갤러리 컨테이너 내부에서 발생했는지 확인
      const eventTarget = event.target as HTMLElement;
      const isInsideGallery = container?.contains(eventTarget);

      // 갤러리 내부 이벤트는 차단하지 않고, 외부에서만 차단
      if (!isInsideGallery && isScrollingRef.current) {
        event.preventDefault();
        event.stopPropagation();
        logger.debug('useGalleryScroll: 트위터 외부 스크롤 차단', {
          targetElement: eventTarget?.tagName || 'unknown',
          targetClass: eventTarget?.className || 'none',
        });
      } else if (isInsideGallery) {
        logger.debug('useGalleryScroll: 갤러리 내부 스크롤 허용 (preventTwitterScroll)', {
          targetElement: eventTarget?.tagName || 'unknown',
          targetClass: eventTarget?.className || 'none',
        });
      }
    },
    [container, blockTwitterScroll]
  );

  // 갤러리 휠 이벤트 처리 - 개선된 버전
  const handleGalleryWheel = useCallback(
    (event: WheelEvent) => {
      // 갤러리가 열려있지 않으면 무시
      if (!galleryState.value.isOpen) {
        logger.debug('useGalleryScroll: 갤러리가 열려있지 않음 - 휠 이벤트 무시');
        return;
      }

      // 🔑 핵심 개선: 이벤트가 갤러리 컨테이너 내부에서 발생했는지 확인
      const eventTarget = event.target as HTMLElement;
      const isInsideGallery = container?.contains(eventTarget);

      const delta = event.deltaY;
      updateScrollState(true);

      // 스크롤 방향 감지 (옵션)
      updateScrollDirection(delta);

      // 스크롤 콜백 실행
      if (onScroll) {
        onScroll(delta);
      }

      // 🔑 개선된 스크롤 차단 로직: 갤러리 외부에서만 차단
      if (blockTwitterScroll && !isInsideGallery) {
        event.preventDefault();
        event.stopPropagation();
        logger.debug('useGalleryScroll: 외부 스크롤 차단', {
          targetElement: eventTarget?.tagName || 'unknown',
          targetClass: eventTarget?.className || 'none',
        });
      } else if (isInsideGallery) {
        logger.debug('useGalleryScroll: 갤러리 내부 스크롤 허용', {
          targetElement: eventTarget?.tagName || 'unknown',
          targetClass: eventTarget?.className || 'none',
        });
      }

      // 스크롤 종료 감지 타이머 재설정
      handleScrollEnd();

      logger.debug('useGalleryScroll: 휠 이벤트 처리 완료', {
        delta,
        isGalleryOpen: galleryState.value.isOpen,
        isInsideGallery,
        eventBlocked: blockTwitterScroll && !isInsideGallery,
        targetElement: eventTarget?.tagName || 'unknown',
        targetClass: eventTarget?.className || 'none',
        timestamp: Date.now(),
      });
    },
    [
      container,
      onScroll,
      blockTwitterScroll,
      updateScrollState,
      handleScrollEnd,
      updateScrollDirection,
    ]
  );

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!enabled || !container) {
      return;
    }

    const eventManager = eventManagerRef.current;

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

    logger.debug('useGalleryScroll: 이벤트 리스너 등록 완료', {
      hasContainer: !!container,
      blockTwitterScroll,
    });

    return () => {
      eventManager.cleanup();

      // 타이머 정리
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 방향 감지 타이머 정리
      if (directionTimeoutRef.current) {
        clearTimeout(directionTimeoutRef.current);
      }

      logger.debug('useGalleryScroll: 정리 완료');
    };
  }, [enabled, container, blockTwitterScroll, handleGalleryWheel, preventTwitterScroll]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      eventManagerRef.current.cleanup();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (directionTimeoutRef.current) {
        clearTimeout(directionTimeoutRef.current);
      }
    };
  }, []);

  return {
    lastScrollTime: lastScrollTimeRef.current,
    isScrolling: isScrollingRef.current,
    ...(enableScrollDirection && { scrollDirection: scrollDirectionRef.current }),
  };
}
