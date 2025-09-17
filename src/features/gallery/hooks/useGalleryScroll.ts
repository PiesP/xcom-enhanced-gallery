/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 개선된 갤러리 스크롤 관리 훅
 * @description 마우스 움직임에 의존하지 않는 안정적인 스크롤 처리를 제공
 */

import { getPreactHooks } from '../../../shared/external/vendors';
// NOTE: Vitest(vite-node) Windows alias 해석 이슈 회피 — 내부 의존성은 상대 경로 사용
import { logger } from '../../../shared/logging/logger';
import { EventManager } from '../../../shared/services/EventManager';
import { galleryState } from '../../../shared/state/signals/gallery.signals';
import { useSelector } from '../../../shared/utils/signalSelector';
import { findTwitterScrollContainer } from '../../../shared/utils/core-utils';
import { globalTimerManager } from '../../../shared/utils/timer-management';

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
  // EventManager는 cleanup() 이후 재사용이 불가하므로, 지연 생성 + 파괴 검사를 통해
  // 항상 유효한 인스턴스를 사용한다.
  const eventManagerRef = useRef<EventManager | null>(null);
  const isScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Optimize subscription to gallery open state using selector
  const isGalleryOpen = useSelector<typeof galleryState.value, boolean>(
    galleryState as unknown as { value: typeof galleryState.value },
    (s: typeof galleryState.value) => s.isOpen,
    { dependencies: (s: typeof galleryState.value) => [s.isOpen] }
  );

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
        globalTimerManager.clearTimeout(directionTimeoutRef.current);
      }

      directionTimeoutRef.current = globalTimerManager.setTimeout(() => {
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
      globalTimerManager.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = globalTimerManager.setTimeout(() => {
      updateScrollState(false);
      logger.debug('useGalleryScroll: 스크롤 종료');
    }, 150);
  }, [updateScrollState]);

  // 트위터 페이지 스크롤 차단
  const preventTwitterScroll = useCallback(
    (event: Event) => {
      if (isScrollingRef.current && blockTwitterScroll) {
        event.preventDefault();
        event.stopPropagation();
        logger.debug('useGalleryScroll: 트위터 스크롤 차단');
      }
    },
    [blockTwitterScroll]
  );

  // 갤러리 휠 이벤트 처리
  const handleGalleryWheel = useCallback(
    (event: WheelEvent) => {
      // 갤러리가 열려있지 않으면 무시
      if (!isGalleryOpen) {
        logger.debug('useGalleryScroll: 갤러리가 열려있지 않음 - 휠 이벤트 무시');
        return;
      }

      const delta = event.deltaY;
      updateScrollState(true);

      // 스크롤 방향 감지 (옵션)
      updateScrollDirection(delta);

      // 스크롤 콜백 실행
      if (onScroll) {
        onScroll(delta);
      }

      // 트위터 페이지로의 이벤트 전파 방지
      if (blockTwitterScroll) {
        event.preventDefault();
        event.stopPropagation();
      }

      // 스크롤 종료 감지 타이머 재설정
      handleScrollEnd();

      logger.debug('useGalleryScroll: 휠 이벤트 처리 완료', {
        delta,
        isGalleryOpen,
        targetElement: (event.target as HTMLElement)?.tagName || 'unknown',
        targetClass: (event.target as HTMLElement)?.className || 'none',
        timestamp: Date.now(),
      });
    },
    [
      onScroll,
      blockTwitterScroll,
      updateScrollState,
      handleScrollEnd,
      updateScrollDirection,
      isGalleryOpen,
    ]
  );

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!enabled || !container) {
      return;
    }

    // ensure fresh EventManager (create lazily or replace if destroyed)
    if (!eventManagerRef.current || eventManagerRef.current.getIsDestroyed()) {
      eventManagerRef.current = new EventManager();
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
      // EventManager는 한 번 cleanup되면 재사용하지 않는다.
      eventManager.cleanup();

      // 타이머 정리
      if (scrollTimeoutRef.current) {
        globalTimerManager.clearTimeout(scrollTimeoutRef.current);
      }

      // 방향 감지 타이머 정리
      if (directionTimeoutRef.current) {
        globalTimerManager.clearTimeout(directionTimeoutRef.current);
      }

      logger.debug('useGalleryScroll: 정리 완료');
    };
  }, [enabled, container, blockTwitterScroll, handleGalleryWheel, preventTwitterScroll]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      eventManagerRef.current?.cleanup();
      if (scrollTimeoutRef.current) {
        globalTimerManager.clearTimeout(scrollTimeoutRef.current);
      }
      if (directionTimeoutRef.current) {
        globalTimerManager.clearTimeout(directionTimeoutRef.current);
      }
    };
  }, []);

  return {
    lastScrollTime: lastScrollTimeRef.current,
    isScrolling: isScrollingRef.current,
    ...(enableScrollDirection && { scrollDirection: scrollDirectionRef.current }),
  };
}
