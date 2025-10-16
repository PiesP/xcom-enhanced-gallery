/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 개선된 갤러리 스크롤 관리 훅
 * @description 마우스 움직임에 의존하지 않는 안정적인 스크롤 처리를 제공
 */

import { getSolid } from '../../../shared/external/vendors';
// NOTE: Vitest(vite-node) Windows alias 해석 이슈 회피 — 내부 의존성은 상대 경로 사용
import { logger } from '../../../shared/logging/logger';
import { EventManager } from '../../../shared/services/event-manager';
import type { StabilityDetector } from '../../../shared/services/stability-detector';
import { galleryState } from '../../../shared/state/signals/gallery.signals';
import type { GalleryState } from '../../../shared/state/signals/gallery.signals';
import { useSelector } from '../../../shared/utils/signal-selector';
import { findTwitterScrollContainer } from '../../../shared/utils/core-utils';
import { globalTimerManager } from '../../../shared/utils/timer-management';

const { createSignal, createEffect, batch, onCleanup } = getSolid();

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

const toAccessor = <T>(value: MaybeAccessor<T>): Accessor<T> =>
  typeof value === 'function' ? (value as Accessor<T>) : () => value;

type ScrollDirection = 'up' | 'down' | 'idle';

interface UseGalleryScrollOptions {
  /** 갤러리 컨테이너 참조 */
  container: HTMLElement | null | Accessor<HTMLElement | null>;
  /** 실제 스크롤 타깃 (기본: container) */
  scrollTarget?: HTMLElement | null | Accessor<HTMLElement | null>;
  /** 스크롤 콜백 함수 */
  onScroll?: (delta: number, target: HTMLElement | null) => void;
  /** 스크롤 처리 활성화 여부 */
  enabled?: MaybeAccessor<boolean>;
  /** 트위터 페이지 스크롤 차단 여부 */
  blockTwitterScroll?: MaybeAccessor<boolean>;
  /** 스크롤 방향 감지 활성화 여부 */
  enableScrollDirection?: MaybeAccessor<boolean>;
  /** 스크롤 방향 변경 콜백 */
  onScrollDirectionChange?: (direction: ScrollDirection) => void;
  /** Stability Detector (스크롤 활동 기록) */
  stabilityDetector?: StabilityDetector;
}

export interface UseGalleryScrollReturn {
  /** 마지막 스크롤 시간 */
  lastScrollTime: Accessor<number>;
  /** 현재 스크롤 중인지 여부 */
  isScrolling: Accessor<boolean>;
  /** 현재 스크롤 방향 (옵션) */
  scrollDirection: Accessor<ScrollDirection>;
}

// Focus Stability Quick Reference 제안에 따라 idle 판정을 완화
// 기존 150ms → 250ms 로 상향하여 스크롤 중 포커스 흔들림을 줄임
export const SCROLL_IDLE_TIMEOUT = 250;

export function useGalleryScroll({
  container,
  scrollTarget,
  onScroll,
  enabled = true,
  blockTwitterScroll = true,
  enableScrollDirection = false,
  onScrollDirectionChange,
  stabilityDetector,
}: UseGalleryScrollOptions): UseGalleryScrollReturn {
  const containerAccessor = toAccessor(container);
  const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
  const enabledAccessor = toAccessor(enabled);
  const blockTwitterScrollAccessor = toAccessor(blockTwitterScroll);
  const enableScrollDirectionAccessor = toAccessor(enableScrollDirection);

  const isGalleryOpen = useSelector<GalleryState, boolean>(
    galleryState as unknown as { value: GalleryState },
    (state: GalleryState) => state.isOpen,
    { dependencies: state => [state.isOpen] }
  );

  const [isScrolling, setIsScrolling] = createSignal(false);
  const [lastScrollTime, setLastScrollTime] = createSignal(0);
  const [scrollDirection, setScrollDirection] = createSignal<ScrollDirection>('idle');

  let scrollTimeoutId: number | null = null;
  let directionTimeoutId: number | null = null;

  const clearScrollTimeout = () => {
    if (scrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(scrollTimeoutId);
      scrollTimeoutId = null;
    }
  };

  const clearDirectionTimeout = () => {
    if (directionTimeoutId !== null) {
      globalTimerManager.clearTimeout(directionTimeoutId);
      directionTimeoutId = null;
    }
  };

  const updateScrollState = (scrolling: boolean) => {
    batch(() => {
      setIsScrolling(scrolling);
      if (scrolling) {
        setLastScrollTime(Date.now());
      }
    });
  };

  const updateScrollDirection = (delta: number) => {
    if (!enableScrollDirectionAccessor()) {
      return;
    }

    const newDirection: ScrollDirection = delta > 0 ? 'down' : 'up';

    if (scrollDirection() !== newDirection) {
      setScrollDirection(newDirection);
      onScrollDirectionChange?.(newDirection);

      logger.debug('useGalleryScroll: 스크롤 방향 변경', {
        direction: newDirection,
        delta,
      });
    }

    clearDirectionTimeout();
    directionTimeoutId = globalTimerManager.setTimeout(() => {
      if (scrollDirection() !== 'idle') {
        setScrollDirection('idle');
        onScrollDirectionChange?.('idle');
      }
    }, SCROLL_IDLE_TIMEOUT);
  };

  const handleScrollEnd = () => {
    clearScrollTimeout();
    scrollTimeoutId = globalTimerManager.setTimeout(() => {
      updateScrollState(false);
      logger.debug('useGalleryScroll: 스크롤 종료');
    }, SCROLL_IDLE_TIMEOUT);
  };

  const preventTwitterScroll = (event: Event) => {
    if (isScrolling() && blockTwitterScrollAccessor()) {
      event.preventDefault();
      event.stopPropagation();
      logger.debug('useGalleryScroll: 트위터 스크롤 차단');
    }
  };

  const handleGalleryWheel = (event: WheelEvent) => {
    if (!isGalleryOpen()) {
      logger.debug('useGalleryScroll: 갤러리가 열려있지 않음 - 휠 이벤트 무시');
      return;
    }

    const delta = event.deltaY;
    const targetElement = scrollTargetAccessor();
    updateScrollState(true);
    updateScrollDirection(delta);

    // StabilityDetector에 스크롤 활동 기록
    stabilityDetector?.recordActivity('scroll');

    onScroll?.(delta, targetElement);

    // Note: preventDefault/stopPropagation 제거 - 브라우저/OS 네이티브 스크롤 동작 사용
    // 트위터 페이지와의 충돌은 preventTwitterScroll 함수에서 별도 처리

    handleScrollEnd();

    logger.debug('useGalleryScroll: 휠 이벤트 처리 완료', {
      delta,
      isGalleryOpen: isGalleryOpen(),
      targetElement: (event.target as HTMLElement)?.tagName || 'unknown',
      targetClass: (event.target as HTMLElement)?.className || 'none',
      timestamp: Date.now(),
    });
  };

  createEffect(() => {
    const isEnabled = enabledAccessor();
    const containerElement = containerAccessor();
    const shouldBlockTwitterScroll = blockTwitterScrollAccessor();

    if (!isEnabled || !containerElement) {
      updateScrollState(false);
      clearScrollTimeout();
      clearDirectionTimeout();
      setScrollDirection('idle');
      return;
    }

    const eventManager = new EventManager();

    // 갤러리 휠 이벤트는 passive 리스너로 등록 (브라우저 네이티브 스크롤 동작 사용)
    eventManager.addEventListener(document, 'wheel', handleGalleryWheel, {
      capture: true,
      passive: true, // 브라우저/OS 네이티브 스크롤 속도 설정 준수
    });

    if (shouldBlockTwitterScroll) {
      const twitterContainer = findTwitterScrollContainer();
      if (twitterContainer) {
        eventManager.addEventListener(twitterContainer, 'wheel', preventTwitterScroll, {
          capture: true,
          passive: false,
        });
      }
    }

    logger.debug('useGalleryScroll: 이벤트 리스너 등록 완료', {
      hasContainer: !!containerElement,
      blockTwitterScroll: shouldBlockTwitterScroll,
    });

    onCleanup(() => {
      eventManager.cleanup();
      clearScrollTimeout();
      clearDirectionTimeout();
      setScrollDirection('idle');
      setIsScrolling(false);
      logger.debug('useGalleryScroll: 정리 완료');
    });
  });

  onCleanup(() => {
    clearScrollTimeout();
    clearDirectionTimeout();
  });

  return {
    lastScrollTime,
    isScrolling,
    scrollDirection,
  };
}
