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
  const eventManagerRef = useRef<EventManager | null>(null);
  const isScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Optimize subscription to gallery open state using selector
  // 갤러리 열림 상태는 핸들러 내에서 galleryState.value로 직접 조회합니다.

  // 최신 상태 접근을 위한 ref들 (리스너를 재등록하지 않고 최신 값을 참조)
  const onScrollRef = useRef<typeof onScroll>(onScroll);
  const blockTwitterScrollRef = useRef<boolean>(blockTwitterScroll);

  // signal/props 변경 시 ref 동기화
  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  useEffect(() => {
    blockTwitterScrollRef.current = blockTwitterScroll;
  }, [blockTwitterScroll]);

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

  // 갤러리 휠 이벤트 처리 (안정 핸들러: 최신 상태는 ref로 참조)
  const handleGalleryWheelStable = useCallback(
    (event: WheelEvent) => {
      // 최신 갤러리 열림 상태를 전역 signal에서 직접 조회 (리렌더 대기 불필요)
      const isOpen = galleryState.value.isOpen;
      if (!isOpen) {
        logger.debug('useGalleryScroll: 갤러리가 열려있지 않음 - 휠 이벤트 무시');
        return;
      }

      const delta = event.deltaY;
      updateScrollState(true);

      // 스크롤 방향 감지 (옵션)
      updateScrollDirection(delta);

      // 스크롤 콜백 실행 (최신 콜백 사용)
      const onScrollCb = onScrollRef.current;
      if (onScrollCb) {
        onScrollCb(delta);
      }

      // 트위터 페이지로의 이벤트 전파 방지
      if (blockTwitterScrollRef.current) {
        event.preventDefault();
        event.stopPropagation();
      }

      // 스크롤 종료 감지 타이머 재설정
      handleScrollEnd();

      logger.debug('useGalleryScroll: 휠 이벤트 처리 완료', {
        delta,
        isGalleryOpen: isOpen,
        targetElement: (event.target as HTMLElement)?.tagName || 'unknown',
        targetClass: (event.target as HTMLElement)?.className || 'none',
        timestamp: Date.now(),
      });
    },
    [updateScrollState, handleScrollEnd, updateScrollDirection]
  );

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!enabled || !container) {
      return;
    }

    // 새 이벤트 매니저를 효과 수명에 맞춰 생성(파괴 인스턴스 재사용 방지)
    if (!eventManagerRef.current || eventManagerRef.current.getIsDestroyed()) {
      eventManagerRef.current = new EventManager();
    }
    const eventManager = eventManagerRef.current;

    // 문서 레벨에서 휠 이벤트 처리: 항상 등록하고, 동작 여부는 isOpenRef로 제어
    eventManager.addEventListener(document, 'wheel', handleGalleryWheelStable, {
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
        globalTimerManager.clearTimeout(scrollTimeoutRef.current);
      }

      // 방향 감지 타이머 정리
      if (directionTimeoutRef.current) {
        globalTimerManager.clearTimeout(directionTimeoutRef.current);
      }

      logger.debug('useGalleryScroll: 정리 완료');
    };
  }, [enabled, container, blockTwitterScroll, handleGalleryWheelStable, preventTwitterScroll]);

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
