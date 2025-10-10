/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 통합된 갤러리 아이템 스크롤 훅
 * @description Solid.js 기반으로 갤러리 아이템 간 스크롤을 안정적으로 관리하는 훅
 */

import { getSolid } from '../../../shared/external/vendors';
// NOTE: Vitest(vite-node) Windows alias 해석 이슈 회피 — 내부 의존성은 상대 경로 사용
import { logger } from '../../../shared/logging/logger';
import { globalTimerManager } from '@shared/utils/timer-management';

const { onCleanup } = getSolid();

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

const toAccessor = <T>(value: MaybeAccessor<T>): Accessor<T> =>
  typeof value === 'function' ? (value as Accessor<T>) : () => value;

const INDEX_WATCH_INTERVAL = 32; // ~30fps 폴링으로 signal 비연동 환경에서도 안정 지원

export interface UseGalleryItemScrollOptions {
  /** 스크롤 활성화 여부 */
  enabled?: MaybeAccessor<boolean>;
  /** 스크롤 동작 방식 */
  behavior?: MaybeAccessor<ScrollBehavior>;
  /** 스크롤 블록 위치 */
  block?: MaybeAccessor<ScrollLogicalPosition>;
  /** 디바운스 지연 시간 (ms) */
  debounceDelay?: MaybeAccessor<number>;
  /** 스크롤 오프셋 (px) */
  offset?: MaybeAccessor<number>;
  /** 중앙 정렬 여부 */
  alignToCenter?: MaybeAccessor<boolean>;
  /** motion 선호도 고려 여부 */
  respectReducedMotion?: MaybeAccessor<boolean>;
}

export interface UseGalleryItemScrollReturn {
  /** 특정 인덱스로 스크롤 */
  scrollToItem: (index: number) => Promise<void>;
  /** 현재 인덱스로 스크롤 (자동 호출용) */
  scrollToCurrentItem: () => Promise<void>;
}

export function useGalleryItemScroll(
  containerRef: { current: HTMLElement | null } | Accessor<HTMLElement | null>,
  currentIndex: MaybeAccessor<number>,
  totalItems: MaybeAccessor<number>,
  options: UseGalleryItemScrollOptions = {}
): UseGalleryItemScrollReturn {
  const containerAccessor: Accessor<HTMLElement | null> =
    typeof containerRef === 'function'
      ? (containerRef as Accessor<HTMLElement | null>)
      : () => containerRef.current;

  const enabled = toAccessor(options.enabled ?? true);
  const behavior = toAccessor(options.behavior ?? 'smooth');
  const block = toAccessor(options.block ?? 'start');
  const debounceDelay = toAccessor(options.debounceDelay ?? 100);
  const offset = toAccessor(options.offset ?? 0);
  const alignToCenter = toAccessor(options.alignToCenter ?? false);
  const respectReducedMotion = toAccessor(options.respectReducedMotion ?? true);

  const currentIndexAccessor = toAccessor(currentIndex);
  const totalItemsAccessor = toAccessor(totalItems);

  let lastScrolledIndex = -1;
  let pendingIndex: number | null = null;
  let scrollTimeoutId: number | null = null;
  let indexWatcherId: number | null = null;
  let retryCount = 0;

  const clearScrollTimeout = () => {
    if (scrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(scrollTimeoutId);
      scrollTimeoutId = null;
    }
  };

  const stopIndexWatcher = () => {
    if (indexWatcherId !== null) {
      globalTimerManager.clearInterval(indexWatcherId);
      indexWatcherId = null;
    }
  };

  const resolveBehavior = (): ScrollBehavior => {
    if (!respectReducedMotion()) {
      return behavior();
    }

    try {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
          return 'auto';
        }
      }
    } catch {
      // matchMedia 미지원 환경에서는 기본 동작을 유지
    }

    return behavior();
  };

  const scrollToItem = async (index: number): Promise<void> => {
    const container = containerAccessor();
    const isEnabled = enabled();
    const total = totalItemsAccessor();

    if (!isEnabled || !container || index < 0 || index >= total) {
      logger.debug('useGalleryItemScroll: 스크롤 조건 불충족', {
        enabled: isEnabled,
        hasContainer: !!container,
        index,
        totalItems: total,
      });
      pendingIndex = null;
      return;
    }

    try {
      const itemsRoot = container.querySelector(
        '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
      ) as HTMLElement | null;

      if (!itemsRoot) {
        logger.warn('useGalleryItemScroll: 아이템 컨테이너를 찾을 수 없음', {
          selectors: '[data-xeg-role="items-list"], [data-xeg-role="items-container"]',
        });
        pendingIndex = null;
        return;
      }

      const targetElement = itemsRoot.children[index] as HTMLElement | undefined;
      if (!targetElement) {
        logger.warn('useGalleryItemScroll: 타겟 요소를 찾을 수 없음', {
          index,
          totalItems: total,
          itemsContainerChildrenCount: itemsRoot.children.length,
        });
        pendingIndex = null;
        return;
      }

      const actualBehavior = resolveBehavior();

      targetElement.scrollIntoView({
        behavior: actualBehavior,
        block: alignToCenter() ? 'center' : block(),
        inline: 'nearest',
      });

      const offsetValue = offset();
      if (offsetValue !== 0) {
        container.scrollTo({
          top: container.scrollTop - offsetValue,
          behavior: actualBehavior,
        });
      }

      lastScrolledIndex = index;
      pendingIndex = null;
      retryCount = 0;

      logger.debug('useGalleryItemScroll: 스크롤 완료', {
        index,
        behavior: actualBehavior,
        block: alignToCenter() ? 'center' : block(),
        offset: offsetValue,
        timestamp: Date.now(),
      });

      if (actualBehavior === 'smooth') {
        await new Promise<void>(resolve => {
          globalTimerManager.setTimeout(resolve, 300);
        });
      }
    } catch (error) {
      logger.error('useGalleryItemScroll: 스크롤 실패', { index, error });
      pendingIndex = null;

      if (retryCount < 1) {
        retryCount += 1;
        logger.debug('useGalleryItemScroll: retry attempt', {
          index,
          retryCount,
        });

        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              observer.disconnect();
              globalTimerManager.setTimeout(() => {
                void scrollToItem(index);
              }, 50);
            }
          });
        });

        const itemsList = container?.querySelector('[data-xeg-role="items-list"]');
        const candidate = itemsList?.children[index] as HTMLElement | undefined;

        if (candidate) {
          observer.observe(candidate);
          globalTimerManager.setTimeout(() => observer.disconnect(), 1000);
        }
      }
    }
  };

  const scheduleScrollToIndex = (index: number): void => {
    clearScrollTimeout();

    const delay = debounceDelay();
    pendingIndex = index;

    logger.debug('useGalleryItemScroll: 자동 스크롤 예약', {
      currentIndex: index,
      lastScrolledIndex,
      delay,
    });

    scrollTimeoutId = globalTimerManager.setTimeout(() => {
      logger.debug('useGalleryItemScroll: 자동 스크롤 실행', {
        currentIndex: index,
        lastScrolledIndex,
      });
      void scrollToItem(index);
    }, delay);
  };

  const checkIndexChanges = () => {
    const container = containerAccessor();
    const isEnabled = enabled();

    if (!isEnabled || !container) {
      lastScrolledIndex = -1;
      pendingIndex = null;
      clearScrollTimeout();
      return;
    }

    const index = currentIndexAccessor();
    const total = totalItemsAccessor();

    if (index < 0 || index >= total) {
      pendingIndex = null;
      clearScrollTimeout();
      return;
    }

    if (index === lastScrolledIndex || index === pendingIndex) {
      return;
    }

    scheduleScrollToIndex(index);
  };

  indexWatcherId = globalTimerManager.setInterval(checkIndexChanges, INDEX_WATCH_INTERVAL);

  const scrollToCurrentItem = (): Promise<void> => {
    return scrollToItem(currentIndexAccessor());
  };

  onCleanup(() => {
    clearScrollTimeout();
    stopIndexWatcher();
  });

  return {
    scrollToItem,
    scrollToCurrentItem,
  };
}
