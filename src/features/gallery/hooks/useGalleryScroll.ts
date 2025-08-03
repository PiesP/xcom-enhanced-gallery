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

const { useEffect, useRef, useCallback } = getPreactHooks();

interface UseGalleryScrollOptions {
  /** 갤러리 컨테이너 참조 */
  container: HTMLElement | null;
  /** 스크롤 콜백 함수 */
  onScroll?: (delta: number) => void;
  /** 스크롤 처리 활성화 여부 */
  enabled?: boolean;
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

  // 갤러리 휠 이벤트 처리 - 단순화된 버전
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

      // 갤러리 내부 스크롤 허용
      if (isInsideGallery) {
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
        targetElement: eventTarget?.tagName || 'unknown',
        targetClass: eventTarget?.className || 'none',
        timestamp: Date.now(),
      });
    },
    [container, onScroll, updateScrollState, handleScrollEnd, updateScrollDirection]
  );

  // 🎯 정밀한 갤러리 스크롤 처리 - 갤러리 내외부 구분하여 이벤트 제어
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const eventManager = eventManagerRef.current;

    // 갤러리 컨테이너에만 휠 이벤트 처리 (갤러리 내부 스크롤)
    if (container) {
      eventManager.addEventListener(container, 'wheel', handleGalleryWheel, {
        passive: false,
      });
    }

    logger.debug('useGalleryScroll: 이벤트 리스너 등록 완료', {
      hasContainer: !!container,
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

      logger.debug('useGalleryScroll: 정리 완료 (정밀한 버전)');
    };
  }, [enabled, container, handleGalleryWheel]);

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
