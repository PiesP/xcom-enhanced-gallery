/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 개선된 갤러리 스크롤 관리 훅
 * @description 마우스 움직임에 의존하지 않는 안정적인 스크롤 처리를 제공
 */

import { isGalleryInternalEvent } from "@shared/dom/utils";
import { getSolid } from "@shared/external/vendors";
import { logger } from "@shared/logging";
import { EventManager } from "@shared/services/event-manager";
import type { GalleryState } from "@shared/state/signals/gallery.signals";
import { galleryState } from "@shared/state/signals/gallery.signals";
import type {
    ScrollDirection,
    ScrollState,
} from "@shared/state/signals/scroll.signals";
import { INITIAL_SCROLL_STATE } from "@shared/state/signals/scroll.signals";
import { useSelector } from "@shared/utils/signal-selector";
import { toAccessor } from "@shared/utils/solid-helpers";
import { globalTimerManager } from "@shared/utils/timer-management";

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
  /** 스크롤 방향 감지 활성화 여부 */
  enableScrollDirection?: MaybeAccessor<boolean>;
  /** 스크롤 방향 변경 콜백 */
  onScrollDirectionChange?: (direction: ScrollDirection) => void;
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

const extractWheelDelta = (event: Event): number => {
  if (event instanceof WheelEvent) {
    return typeof event.deltaY === "number" ? event.deltaY : 0;
  }

  const maybeDelta = (event as { deltaY?: number }).deltaY;
  return typeof maybeDelta === "number" ? maybeDelta : 0;
};

export function useGalleryScroll({
  container,
  scrollTarget,
  onScroll,
  enabled = true,
  enableScrollDirection = false,
  onScrollDirectionChange,
}: UseGalleryScrollOptions): UseGalleryScrollReturn {
  const containerAccessor = toAccessor(container);
  const scrollTargetAccessor = toAccessor(scrollTarget ?? containerAccessor);
  const enabledAccessor = toAccessor(enabled);
  const enableScrollDirectionAccessor = toAccessor(enableScrollDirection);

  const isGalleryOpen = useSelector<GalleryState, boolean>(
    galleryState,
    (state: GalleryState) => state.isOpen,
    { dependencies: (state) => [state.isOpen] },
  );

  // Phase 153: 통합 스크롤 상태 Signal
  const [scrollState, setScrollState] =
    createSignal<ScrollState>(INITIAL_SCROLL_STATE);

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
    const hasDelta = typeof delta === "number";
    batch(() => {
      setScrollState((prev) => ({
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

    const newDirection: ScrollDirection = delta > 0 ? "down" : "up";

    if (scrollState().direction !== newDirection) {
      setScrollState((prev) => ({
        ...prev,
        direction: newDirection,
      }));
      onScrollDirectionChange?.(newDirection);

      logger.debug("useGalleryScroll: Scroll direction changed", {
        direction: newDirection,
        delta,
      });
    }

    clearDirectionTimeout();
    directionTimeoutId = globalTimerManager.setTimeout(() => {
      if (scrollState().direction !== "idle") {
        setScrollState((prev) => ({
          ...prev,
          direction: "idle",
        }));
        onScrollDirectionChange?.("idle");
      }
    }, SCROLL_IDLE_TIMEOUT);
  };

  const handleScrollEnd = () => {
    clearScrollTimeout();
    scrollTimeoutId = globalTimerManager.setTimeout(() => {
      updateScrollState(false);
      logger.debug("useGalleryScroll: Scroll ended");
    }, SCROLL_IDLE_TIMEOUT);
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

    onScroll?.(delta, targetElement);

    handleScrollEnd();
  };

  createEffect(() => {
    const isEnabled = enabledAccessor();
    const containerElement = containerAccessor();
    const scrollElement = scrollTargetAccessor();
    const eventTarget = scrollElement ?? containerElement;

    if (!isEnabled || !eventTarget) {
      updateScrollState(false);
      clearScrollTimeout();
      clearDirectionTimeout();
      setScrollState((prev) => ({
        ...prev,
        direction: "idle",
      }));
      return;
    }

    const eventManager = new EventManager();

    eventManager.addEventListener(eventTarget, "wheel", handleGalleryWheel, {
      passive: true,
    });

    logger.debug("useGalleryScroll: Event listeners registered", {
      hasContainer: !!containerElement,
      hasScrollTarget: !!scrollElement,
    });

    onCleanup(() => {
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
