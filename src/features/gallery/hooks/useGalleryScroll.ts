/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 개선된 갤러리 스크롤 관리 훅
 * @description 마우스 움직임에 의존하지 않는 안정적인 스크롤 처리를 제공
 */

import { getSolid } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';
import type { StabilityDetector } from '@shared/utils/stability';
import { galleryState } from '@shared/state/signals/gallery.signals';
import type { GalleryState } from '@shared/state/signals/gallery.signals';
import type { ScrollState, ScrollDirection } from '@shared/state/signals/scroll.signals';
import { INITIAL_SCROLL_STATE } from '@shared/state/signals/scroll.signals';
import { useSelector } from '@shared/utils/signal-selector';
import { toAccessor } from '@shared/utils/solid-helpers';
import { findTwitterScrollContainer, isGalleryInternalEvent } from '@shared/utils/core-utils';
import { globalTimerManager } from '@shared/utils/timer-management';

const { createSignal, createEffect, batch, onCleanup } = getSolid();

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

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
  /** 전체 스크롤 상태 스냅샷 */
  state: Accessor<ScrollState>;
}

/**
 * 유휴 상태로 판정하기까지의 대기 시간 (ms)
 * Phase 153: 250ms로 설정하여 스크롤 중 포커스 흔들림 완화
 */
export const SCROLL_IDLE_TIMEOUT = 250;

const TWITTER_WHEEL_CAPTURE = true;

const describeEventTarget = (target: EventTarget | null): string => {
  if (target instanceof HTMLElement) {
    return (
      target.dataset.galleryElement ??
      target.getAttribute('data-testid') ??
      target.id ??
      target.tagName.toLowerCase()
    );
  }

  if (target instanceof Element) {
    return target.tagName.toLowerCase();
  }

  return 'unknown';
};

const extractWheelDelta = (event: Event): number => {
  if (event instanceof WheelEvent) {
    return typeof event.deltaY === 'number' ? event.deltaY : 0;
  }

  const maybeDelta = (event as { deltaY?: number }).deltaY;
  return typeof maybeDelta === 'number' ? maybeDelta : 0;
};

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
    galleryState,
    (state: GalleryState) => state.isOpen,
    { dependencies: state => [state.isOpen] }
  );

  // Phase 153: 통합 스크롤 상태 Signal
  const [scrollState, setScrollState] = createSignal<ScrollState>(INITIAL_SCROLL_STATE);

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

  const updateScrollState = (scrolling: boolean, delta?: number) => {
    const hasDelta = typeof delta === 'number';
    batch(() => {
      setScrollState(prev => ({
        ...prev,
        isScrolling: scrolling,
        lastScrollTime: scrolling ? Date.now() : prev.lastScrollTime,
        lastDelta: hasDelta ? (delta as number) : prev.lastDelta,
      }));
    });
  };

  const updateScrollDirection = (delta: number) => {
    if (!enableScrollDirectionAccessor()) {
      return;
    }

    const newDirection: ScrollDirection = delta > 0 ? 'down' : 'up';

    if (scrollState().direction !== newDirection) {
      setScrollState(prev => ({
        ...prev,
        direction: newDirection,
      }));
      onScrollDirectionChange?.(newDirection);

      logger.debug('useGalleryScroll: 스크롤 방향 변경', {
        direction: newDirection,
        delta,
      });
    }

    clearDirectionTimeout();
    directionTimeoutId = globalTimerManager.setTimeout(() => {
      if (scrollState().direction !== 'idle') {
        setScrollState(prev => ({
          ...prev,
          direction: 'idle',
        }));
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
    if (!blockTwitterScrollAccessor()) {
      return;
    }

    if (!scrollState().isScrolling) {
      return;
    }

    if (isGalleryInternalEvent(event)) {
      return;
    }

    const preventedDelta = extractWheelDelta(event);
    const preventedTarget = describeEventTarget(event.target ?? null);

    event.preventDefault();
    event.stopPropagation();

    setScrollState(prev => ({
      ...prev,
      lastPreventedAt: Date.now(),
      lastPreventedTarget: preventedTarget,
      lastPreventedDelta: preventedDelta,
    }));

    logger.debug('useGalleryScroll: 외부 스크롤 체이닝 차단', {
      preventedDelta,
      preventedTarget,
    });
  };

  const handleGalleryWheel = (event: WheelEvent) => {
    if (!isGalleryOpen()) {
      return;
    }

    if (!isGalleryInternalEvent(event)) {
      return;
    }

    const delta = extractWheelDelta(event);
    const targetElement = scrollTargetAccessor();
    updateScrollState(true, delta);
    updateScrollDirection(delta);

    // StabilityDetector에 스크롤 활동 기록
    stabilityDetector?.recordActivity('scroll');

    onScroll?.(delta, targetElement);

    handleScrollEnd();
  };

  createEffect(() => {
    const isEnabled = enabledAccessor();
    const containerElement = containerAccessor();
    const shouldBlockTwitterScroll = blockTwitterScrollAccessor();

    if (!isEnabled || !containerElement) {
      updateScrollState(false);
      clearScrollTimeout();
      clearDirectionTimeout();
      setScrollState(prev => ({
        ...prev,
        direction: 'idle',
        lastPreventedAt: 0,
        lastPreventedDelta: 0,
        lastPreventedTarget: null,
      }));
      return;
    }

    const eventManager = new EventManager();

    eventManager.addEventListener(document, 'wheel', handleGalleryWheel, {
      capture: true,
      passive: true,
    });

    let twitterContainer: HTMLElement | null = null;
    let mutationObserver: MutationObserver | null = null;

    const detachTwitterListener = () => {
      if (!twitterContainer) {
        return;
      }

      twitterContainer.removeEventListener(
        'wheel',
        preventTwitterScroll as EventListener,
        TWITTER_WHEEL_CAPTURE
      );
      twitterContainer = null;
    };

    const attachTwitterListener = (candidate: HTMLElement | null) => {
      if (!candidate) {
        detachTwitterListener();
        return;
      }

      if (twitterContainer === candidate) {
        return;
      }

      detachTwitterListener();

      twitterContainer = candidate;
      twitterContainer.addEventListener('wheel', preventTwitterScroll as EventListener, {
        capture: TWITTER_WHEEL_CAPTURE,
        passive: false,
      });

      logger.debug('useGalleryScroll: Twitter 컨테이너 wheel 차단 등록', {
        container: describeEventTarget(candidate),
      });
    };

    const refreshTwitterListener = () => {
      const candidate = findTwitterScrollContainer();
      attachTwitterListener(candidate);
    };

    if (shouldBlockTwitterScroll) {
      refreshTwitterListener();

      const body = document.body;
      if (body && typeof MutationObserver !== 'undefined') {
        mutationObserver = new MutationObserver(() => {
          refreshTwitterListener();
        });

        mutationObserver.observe(body, {
          childList: true,
          subtree: true,
        });
      }
    } else {
      detachTwitterListener();
    }

    logger.debug('useGalleryScroll: 이벤트 리스너 등록 완료', {
      hasContainer: !!containerElement,
      blockTwitterScroll: shouldBlockTwitterScroll,
      twitterTarget: describeEventTarget(twitterContainer),
    });

    onCleanup(() => {
      mutationObserver?.disconnect();
      detachTwitterListener();
      eventManager.cleanup();
      clearScrollTimeout();
      clearDirectionTimeout();
      setScrollState(() => ({
        ...INITIAL_SCROLL_STATE,
      }));
    });
  });

  onCleanup(() => {
    clearScrollTimeout();
    clearDirectionTimeout();
  });

  // Phase 153: 통합 State로부터 개별 Accessors 생성
  return {
    lastScrollTime: () => scrollState().lastScrollTime,
    isScrolling: () => scrollState().isScrolling,
    scrollDirection: () => scrollState().direction,
    state: () => scrollState(),
  };
}
