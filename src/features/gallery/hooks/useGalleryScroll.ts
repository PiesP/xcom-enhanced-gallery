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
import { isEventInsideContainer } from '../../../shared/dom/utils/dom-utils';
import { FEATURE_FLAGS } from '../../../constants';
import { scrollEventHub } from '../../../shared/utils/scroll/ScrollEventHub';

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
  // Policy: PC-only inputs. Window(document) 우선, container는 필요 시에만 추가.
  // EventManager는 effect-로컬로 생성/정리하여 파괴된 인스턴스의 재사용 경로를 제거한다.
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

  // 트위터 페이지 스크롤 차단 (ensureWheelLock와 함께 사용)
  const preventTwitterScroll = useCallback(
    (event: WheelEvent) => {
      // P4.9.b: 갤러리 내부 타겟이면 트위터 컨테이너 캡처 단계에서도 소비하지 않음
      const inGallery = isEventInsideContainer(event, container);
      if (inGallery) {
        return false; // 내부 기본 스크롤 허용
      }

      if (isScrollingRef.current && blockTwitterScroll) {
        logger.debug('useGalleryScroll: 트위터 스크롤 차단');
        return true; // 소비 요청
      }
      return false;
    },
    [blockTwitterScroll, container]
  );

  // 갤러리 휠 이벤트 처리
  const handleGalleryWheel = useCallback(
    (event: WheelEvent) => {
      // 갤러리가 열려있지 않으면 무시
      if (!isGalleryOpen) {
        logger.debug('useGalleryScroll: 갤러리가 열려있지 않음 - 휠 이벤트 무시');
        return false;
      }

      const delta = event.deltaY;
      updateScrollState(true);

      // 스크롤 방향 감지 (옵션)
      updateScrollDirection(delta);

      // 스크롤 콜백 실행
      if (onScroll) {
        onScroll(delta);
      }

      // 스크롤 종료 감지 타이머 재설정
      handleScrollEnd();
      // 휠 소비는 ensureWheelLock에 위임 (true 반환 시 preventDefault/stopPropagation 수행)
      // P4.9: 갤러리 컨테이너 내부 타겟이면 소비하지 않음(내부 기본 스크롤 허용)
      const inGallery = isEventInsideContainer(event, container);
      if (!inGallery && blockTwitterScroll) {
        return true; // 갤러리 외부는 페이지 스크롤 차단
      }

      logger.debug('useGalleryScroll: 휠 이벤트 처리 완료', {
        delta,
        isGalleryOpen,
        targetElement: (event.target as HTMLElement)?.tagName || 'unknown',
        targetClass: (event.target as HTMLElement)?.className || 'none',
        timestamp: Date.now(),
      });
      return false;
    },
    [
      onScroll,
      blockTwitterScroll,
      updateScrollState,
      handleScrollEnd,
      updateScrollDirection,
      isGalleryOpen,
      container,
    ]
  );

  // 문서 레벨 wheel 등록: container와 독립 (4.7)
  useEffect(() => {
    if (!enabled) return;

    // Flag-gated central hub path
    if (FEATURE_FLAGS.SCROLL_EVENT_HUB) {
      const sub = scrollEventHub.subscribeWheelLock(document, handleGalleryWheel, {
        capture: true,
        context: 'features/gallery/useGalleryScroll',
      });

      logger.debug('useGalleryScroll: [Hub] 문서 레벨 wheel 등록 완료', {
        hasContainer: !!container,
      });

      return () => {
        sub.cancel();
        // 타이머 정리
        if (scrollTimeoutRef.current) {
          globalTimerManager.clearTimeout(scrollTimeoutRef.current);
        }
        if (directionTimeoutRef.current) {
          globalTimerManager.clearTimeout(directionTimeoutRef.current);
        }
        logger.debug('useGalleryScroll: [Hub] 문서 레벨 wheel 정리 완료');
      };
    }

    // Existing path
    const eventManager = new EventManager();
    eventManager.addWheelLock(document, handleGalleryWheel, { capture: true });
    logger.debug('useGalleryScroll: 문서 레벨 wheel 등록 완료', {
      hasContainer: !!container,
    });
    return () => {
      eventManager.cleanup();
      if (scrollTimeoutRef.current) {
        globalTimerManager.clearTimeout(scrollTimeoutRef.current);
      }
      if (directionTimeoutRef.current) {
        globalTimerManager.clearTimeout(directionTimeoutRef.current);
      }
      logger.debug('useGalleryScroll: 문서 레벨 wheel 정리 완료');
    };
  }, [enabled, handleGalleryWheel, container]);

  // 트위터 컨테이너 wheel 차단: 컨테이너 준비 여부와 무관하나, 변경 시 갱신
  useEffect(() => {
    if (!enabled || !blockTwitterScroll) return;

    const twitterContainer = findTwitterScrollContainer();
    if (!twitterContainer) return;

    if (FEATURE_FLAGS.SCROLL_EVENT_HUB) {
      const sub = scrollEventHub.subscribeWheelLock(twitterContainer, preventTwitterScroll, {
        capture: true,
        context: 'features/gallery/useGalleryScroll:twitter',
      });
      logger.debug('useGalleryScroll: [Hub] 트위터 컨테이너 차단 등록', {
        hasTwitterContainer: !!twitterContainer,
      });
      return () => {
        sub.cancel();
        logger.debug('useGalleryScroll: [Hub] 트위터 컨테이너 차단 정리');
      };
    }

    const eventManager = new EventManager();
    eventManager.addWheelLock(twitterContainer, preventTwitterScroll, { capture: true });
    logger.debug('useGalleryScroll: 트위터 컨테이너 차단 등록', {
      hasTwitterContainer: !!twitterContainer,
    });
    return () => {
      eventManager.cleanup();
      logger.debug('useGalleryScroll: 트위터 컨테이너 차단 정리');
    };
  }, [enabled, blockTwitterScroll, preventTwitterScroll, container]);

  // 컴포넌트 언마운트 시 타이머 정리(효과들의 cleanup가 호출되지만, 안전망 유지)
  useEffect(() => {
    return () => {
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
