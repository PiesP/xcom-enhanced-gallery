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
import { toAccessor } from '../../../shared/utils/solid-helpers';
import { globalTimerManager } from '@shared/utils/timer-management';

const { onCleanup, createEffect } = getSolid();

type Accessor<T> = () => T;
type MaybeAccessor<T> = T | Accessor<T>;

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
  // Phase 141.3: toAccessor 헬퍼로 타입 단언 제거
  const containerAccessor: Accessor<HTMLElement | null> =
    typeof containerRef === 'function' ? containerRef : () => containerRef.current;

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

  // Phase 28: 사용자 스크롤 감지 플래그
  let userScrollDetected = false;
  let userScrollTimeoutId: number | null = null;
  let isAutoScrolling = false;

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

  // Phase 28: 사용자 스크롤 타임아웃 정리
  const clearUserScrollTimeout = () => {
    if (userScrollTimeoutId !== null) {
      globalTimerManager.clearTimeout(userScrollTimeoutId);
      userScrollTimeoutId = null;
    }
  };

  // Phase 28: 사용자 스크롤 감지 핸들러
  const handleUserScroll = () => {
    // 자동 스크롤 중에 발생한 스크롤 이벤트는 무시
    if (isAutoScrolling) {
      return;
    }

    userScrollDetected = true;
    logger.debug('useGalleryItemScroll: 사용자 스크롤 감지', {
      timestamp: Date.now(),
    });

    // 기존 타이머 정리
    clearUserScrollTimeout();
    clearScrollTimeout();

    // 500ms 후 사용자 스크롤 플래그 해제
    userScrollTimeoutId = globalTimerManager.setTimeout(() => {
      userScrollDetected = false;
      logger.debug('useGalleryItemScroll: 사용자 스크롤 종료, 자동 스크롤 재개', {
        timestamp: Date.now(),
      });
    }, 500);
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
      // Phase 28: 자동 스크롤 플래그 설정
      isAutoScrolling = true;

      const itemsRoot = container.querySelector(
        '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
      ) as HTMLElement | null;

      if (!itemsRoot) {
        logger.warn('useGalleryItemScroll: 아이템 컨테이너를 찾을 수 없음', {
          selectors: '[data-xeg-role="items-list"], [data-xeg-role="items-container"]',
        });
        pendingIndex = null;
        isAutoScrolling = false;
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
        isAutoScrolling = false;
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

      // Phase 28: 자동 스크롤 완료 후 플래그 해제
      // 다음 틱에서 해제하여 스크롤 이벤트가 완전히 처리되도록 함
      globalTimerManager.setTimeout(() => {
        isAutoScrolling = false;
      }, 50);
    } catch (error) {
      logger.error('useGalleryItemScroll: 스크롤 실패', { index, error });
      pendingIndex = null;
      isAutoScrolling = false;

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

    // Phase 28: 사용자 스크롤 중에는 자동 스크롤 차단
    if (userScrollDetected) {
      logger.debug('useGalleryItemScroll: 사용자 스크롤 중 - 자동 스크롤 차단', {
        currentIndex: index,
        userScrollDetected,
      });
      return;
    }

    scheduleScrollToIndex(index);
  };

  indexWatcherId = globalTimerManager.setInterval(checkIndexChanges, INDEX_WATCH_INTERVAL);

  // Phase 28: 컨테이너 스크롤 이벤트 리스너 등록 (createEffect로 안전하게)
  createEffect(() => {
    const container = containerAccessor();
    if (!container) {
      return;
    }

    container.addEventListener('scroll', handleUserScroll, { passive: true });

    onCleanup(() => {
      container.removeEventListener('scroll', handleUserScroll);
    });
  });

  const scrollToCurrentItem = (): Promise<void> => {
    return scrollToItem(currentIndexAccessor());
  };

  onCleanup(() => {
    clearScrollTimeout();
    stopIndexWatcher();
    clearUserScrollTimeout();
  });

  return {
    scrollToItem,
    scrollToCurrentItem,
  };
}
