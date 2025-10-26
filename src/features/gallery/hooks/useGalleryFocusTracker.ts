import type { Accessor } from 'solid-js';
import { getSolid } from '../../../shared/external/vendors';
import { logger } from '@shared/logging';
import { globalTimerManager } from '../../../shared/utils/timer-management';
import { createDebouncer } from '../../../shared/utils/performance/performance-utils';
import { galleryIndexEvents, setFocusedIndex } from '../../../shared/state/signals/gallery.signals';
import type { FocusState } from '../../../shared/state/focus/focus-state';
import { INITIAL_FOCUS_STATE, createFocusState } from '../../../shared/state/focus/focus-state';
import { createItemCache } from '../../../shared/state/focus/focus-cache';
import { createFocusTimerManager } from '../../../shared/state/focus/focus-timer-manager';
import type { FocusTracking } from '../../../shared/state/focus/focus-tracking';
import {
  createFocusTracking,
  INITIAL_FOCUS_TRACKING,
  updateFocusTracking,
} from '../../../shared/state/focus/focus-tracking';

type MaybeAccessor<T> = T | Accessor<T>;

const toAccessor = <T>(value: MaybeAccessor<T>): Accessor<T> =>
  typeof value === 'function' ? (value as Accessor<T>) : () => value;

export interface UseGalleryFocusTrackerOptions {
  /** 갤러리 컨테이너 요소 */
  container: MaybeAccessor<HTMLElement | null>;
  /** 자동 감지 활성화 여부 */
  isEnabled: MaybeAccessor<boolean>;
  /** 현재 인덱스 accessor (fallback 용도) */
  getCurrentIndex: Accessor<number>;
  /** 스크롤 중 여부 (settling 기반 최적화) */
  isScrolling?: MaybeAccessor<boolean>;
  /** IntersectionObserver threshold 설정 */
  threshold?: number | number[];
  /** IntersectionObserver rootMargin 설정 */
  rootMargin?: string;
  /** 후보로 고려할 최소 가시 비율 */
  minimumVisibleRatio?: number;
  /** 스크롤 idle 시 자동 포커스를 수행할지 여부 */
  shouldAutoFocus?: MaybeAccessor<boolean>;
  /** 자동 포커스 지연(ms) */
  autoFocusDebounce?: MaybeAccessor<number>;
}

export interface UseGalleryFocusTrackerReturn {
  /** 자동/수동 감지된 포커스 인덱스 */
  focusedIndex: Accessor<number | null>;
  /** 아이템 요소 등록 */
  registerItem: (index: number, element: HTMLElement | null) => void;
  /** 수동 포커스 진입 처리 */
  handleItemFocus: (index: number) => void;
  /** 수동 포커스 종료 처리 */
  handleItemBlur: (index: number) => void;
  /** 외부 강제 동기화 */
  forceSync: () => void;
  /** 수동 포커스 명시적 설정 */
  setManualFocus: (index: number | null) => void;
}

interface CandidateScore {
  index: number;
  centerDistance: number;
  intersectionRatio: number;
  time: number;
}

const DEFAULT_THRESHOLD = [0.25, 0.5, 0.75];
const DEFAULT_MIN_VISIBLE_RATIO = 0.05;
const DEFAULT_AUTO_FOCUS_DELAY = 150;

const solid = getSolid();
const { createSignal, createEffect, createMemo, onCleanup, batch, untrack, on } = solid;

export function useGalleryFocusTracker({
  container,
  isEnabled,
  getCurrentIndex,
  isScrolling = false,
  threshold = DEFAULT_THRESHOLD,
  rootMargin = '0px',
  minimumVisibleRatio = DEFAULT_MIN_VISIBLE_RATIO,
  shouldAutoFocus = false,
  autoFocusDebounce = DEFAULT_AUTO_FOCUS_DELAY,
}: UseGalleryFocusTrackerOptions): UseGalleryFocusTrackerReturn {
  const containerAccessor = toAccessor(container);
  const isEnabledAccessor = toAccessor(isEnabled);
  const isScrollingAccessor = toAccessor(isScrolling);
  const shouldAutoFocusAccessor = toAccessor(shouldAutoFocus);
  const autoFocusDelayAccessor = toAccessor(autoFocusDebounce);

  const [focusState, setFocusState] = createSignal<FocusState>(INITIAL_FOCUS_STATE);

  // Backward compat: getter 헬퍼
  const manualFocusIndex = (): number | null =>
    focusState().source === 'manual' ? focusState().index : null;
  const autoFocusIndex = (): number | null =>
    focusState().source === 'auto' ? focusState().index : null;

  const itemCache = createItemCache();

  let observer: IntersectionObserver | null = null;

  const focusTimerManager = createFocusTimerManager();

  const [focusTracking, setFocusTracking] = createSignal<FocusTracking>(INITIAL_FOCUS_TRACKING);
  const debouncedSetAutoFocusIndex = createDebouncer<[number | null, { forceClear?: boolean }?]>(
    (index, options) => {
      const shouldForceClear = options?.forceClear ?? false;

      if (index === null && !shouldForceClear) {
        const currentState = focusState();
        const fallbackIndex =
          (currentState.source === 'auto' ? currentState.index : null) ??
          (currentState.source === 'manual' ? currentState.index : null) ??
          focusTracking().lastAutoFocusedIndex ??
          getCurrentIndex();

        if (fallbackIndex === null || Number.isNaN(fallbackIndex)) {
          setFocusState(createFocusState(null, 'auto'));
          setFocusedIndex(null);
          return;
        }

        setFocusState(createFocusState(fallbackIndex, 'auto'));
        setFocusedIndex(fallbackIndex, 'auto-focus');
        return;
      }

      setFocusState(createFocusState(index, 'auto'));
      setFocusedIndex(index, 'auto-focus');
    },
    50
  );

  // Debouncer for updating container focus attribute
  const debouncedUpdateContainerFocusAttribute = createDebouncer<
    [number | null, { forceClear?: boolean }?]
  >((value, options) => {
    const containerElement = containerAccessor();
    if (!containerElement) {
      return;
    }

    const shouldForceClear = options?.forceClear ?? false;

    const resolveCandidate = (candidate: number | null): candidate is number => {
      return candidate !== null && !Number.isNaN(candidate);
    };

    let finalValue: number | null = null;

    if (resolveCandidate(value)) {
      finalValue = value;
    } else if (!shouldForceClear) {
      const fallbackCandidates: Array<number | null> = [
        autoFocusIndex(),
        manualFocusIndex(),
        focusTracking().lastAutoFocusedIndex,
        getCurrentIndex(),
      ];
      finalValue = fallbackCandidates.find(resolveCandidate) ?? null;
    }

    const normalized = finalValue ?? -1;
    containerElement.setAttribute('data-focused', String(normalized));
    containerElement.setAttribute('data-focused-index', String(normalized));
  }, 50);

  const updateContainerFocusAttribute = (
    value: number | null,
    options?: { forceClear?: boolean }
  ) => {
    debouncedUpdateContainerFocusAttribute.execute(value, options);
  };

  // Debouncer for scheduling focus sync
  const debouncedScheduleSync = createDebouncer<[]>(() => {
    // Skip recompute if scrolling; defer until settled
    if (isScrollingAccessor()) {
      const current = focusTracking();
      setFocusTracking(updateFocusTracking(current, { hasPendingRecompute: true }));
      return;
    }

    // Perform recompute when settled
    recomputeFocus();
    const current = focusTracking();
    setFocusTracking(updateFocusTracking(current, { hasPendingRecompute: false }));
  }, 100);

  const scheduleSync = () => {
    debouncedScheduleSync.execute();
  };

  // Process deferred recompute after scroll settles
  createEffect(() => {
    const scrolling = isScrollingAccessor();
    const current = focusTracking();

    if (!scrolling && current.hasPendingRecompute) {
      logger.debug('useGalleryFocusTracker: processing deferred recompute after settling');

      recomputeFocus();
      setFocusTracking(updateFocusTracking(current, { hasPendingRecompute: false }));
    }
  });

  const clearAutoFocusTimer = () => {
    focusTimerManager.clearTimer('auto-focus');
  };

  const applyAutoFocus = (index: number, reason: string) => {
    // Guard against duplicate focus application
    const current = focusTracking();
    if (current.lastAppliedIndex === index) {
      return;
    }

    const item = itemCache.getItem(index);
    const element = item?.element;
    if (!element?.isConnected) {
      return;
    }

    if (document.activeElement === element) {
      setFocusTracking(
        updateFocusTracking(current, { lastAutoFocusedIndex: index, lastAppliedIndex: index })
      );
      return;
    }

    try {
      element.focus({ preventScroll: true });
      setFocusTracking(
        updateFocusTracking(current, { lastAutoFocusedIndex: index, lastAppliedIndex: index })
      );
      logger.debug('useGalleryFocusTracker: auto focus applied', { index, reason });
    } catch (error) {
      try {
        element.focus();
        setFocusTracking(
          updateFocusTracking(current, { lastAutoFocusedIndex: index, lastAppliedIndex: index })
        );
        logger.debug('useGalleryFocusTracker: auto focus applied (fallback)', {
          index,
          reason,
        });
      } catch (fallbackError) {
        logger.warn('useGalleryFocusTracker: auto focus failed', {
          index,
          reason,
          error,
          fallbackError,
        });
      }
    }
  };

  const evaluateAutoFocus = (reason: string) => {
    clearAutoFocusTimer();

    if (!shouldAutoFocusAccessor()) {
      return;
    }

    if (manualFocusIndex() !== null) {
      return;
    }

    const targetIndex = autoFocusIndex();
    if (targetIndex === null || Number.isNaN(targetIndex)) {
      return;
    }

    const targetItem = itemCache.getItem(targetIndex);
    const targetElement = targetItem?.element;
    if (!targetElement?.isConnected) {
      return;
    }

    if (
      document.activeElement === targetElement &&
      focusTracking().lastAutoFocusedIndex === targetIndex
    ) {
      return;
    }
    // Reset lastAppliedIndex when target index changes
    const current = focusTracking();
    if (current.lastAppliedIndex !== null && current.lastAppliedIndex !== targetIndex) {
      setFocusTracking(updateFocusTracking(current, { lastAppliedIndex: null }));
    }

    const delay = Math.max(0, autoFocusDelayAccessor());

    focusTimerManager.setTimer(
      'auto-focus',
      () => {
        applyAutoFocus(targetIndex, reason);
      },
      delay
    );
  };

  const cleanupObserver = () => {
    observer?.disconnect();
    observer = null;
    itemCache.clear();
  };

  const handleEntries: IntersectionObserverCallback = entries => {
    // Break reactivity chain to avoid signal dependency tracking issues
    untrack(() => {
      entries.forEach(entry => {
        itemCache.setEntry(entry.target as HTMLElement, entry);
      });

      scheduleSync();
    });
  };

  const recomputeFocus = () => {
    const enabled = isEnabledAccessor();
    if (!enabled) {
      debouncedSetAutoFocusIndex.execute(null, { forceClear: true });
      updateContainerFocusAttribute(null, { forceClear: true });
      evaluateAutoFocus('disabled');
      return;
    }

    const containerElement = containerAccessor();
    if (!containerElement) {
      updateContainerFocusAttribute(autoFocusIndex());
      return;
    }

    const containerRect = containerElement.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    const candidates: CandidateScore[] = [];
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    itemCache.forEach(item => {
      const { element, index, entry } = item;
      if (!element?.isConnected) {
        return;
      }

      const ratio = entry?.intersectionRatio ?? 0;

      if (ratio < minimumVisibleRatio) {
        return;
      }

      const rect = entry?.intersectionRect ?? element.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - containerCenter);

      candidates.push({
        index,
        centerDistance: distance,
        intersectionRatio: ratio,
        time: entry?.time ?? now,
      });
    });

    if (candidates.length === 0) {
      if (itemCache.size === 0) {
        // Use fallback when itemCache is empty (initial state or during tests)
        const fallbackIndex = getCurrentIndex();
        debouncedSetAutoFocusIndex.execute(fallbackIndex);
        updateContainerFocusAttribute(fallbackIndex);
        evaluateAutoFocus('itemCache-empty');
        return;
      }

      const fallbackIndex = getCurrentIndex();
      debouncedSetAutoFocusIndex.execute(fallbackIndex);
      updateContainerFocusAttribute(fallbackIndex);
      evaluateAutoFocus('fallback');
      return;
    }

    candidates.sort((a, b) => {
      if (a.centerDistance !== b.centerDistance) {
        return a.centerDistance - b.centerDistance;
      }

      if (a.intersectionRatio !== b.intersectionRatio) {
        return b.intersectionRatio - a.intersectionRatio;
      }

      return a.time - b.time;
    });

    const nextIndex = candidates[0]?.index ?? null;
    debouncedSetAutoFocusIndex.execute(nextIndex);
    updateContainerFocusAttribute(nextIndex);
    evaluateAutoFocus('recompute');
  };

  const registerItem = (index: number, element: HTMLElement | null) => {
    const prev = itemCache.getItem(index);
    if (prev?.element && observer) {
      observer.unobserve(prev.element);
    }

    if (!element) {
      if (prev?.element) {
        // 요소 제거 시 캐시에서만 삭제 (WeakMap은 자동 정리)
      }
      itemCache.deleteItem(index);
      scheduleSync();
      evaluateAutoFocus('register-remove');
      return;
    }

    itemCache.setItem(index, element);

    if (observer) {
      observer.observe(element);
    }

    scheduleSync();
    evaluateAutoFocus('register');
  };

  // Batch focus/blur operations to prevent rapid state updates
  let pendingFocusIndex: number | null = null;
  let pendingBlurIndex: number | null = null;
  let focusBatchScheduled = false;

  const flushFocusBatch = () => {
    focusBatchScheduled = false;

    if (pendingFocusIndex !== null) {
      const index = pendingFocusIndex;
      pendingFocusIndex = null;
      setFocusState(createFocusState(index, 'manual'));
      logger.debug('useGalleryFocusTracker: manual focus applied', { index });
      updateContainerFocusAttribute(index);
      clearAutoFocusTimer();
      const current1 = focusTracking();
      setFocusTracking(
        updateFocusTracking(current1, { lastAutoFocusedIndex: index, lastAppliedIndex: index })
      );
    }

    if (pendingBlurIndex !== null) {
      const index = pendingBlurIndex;
      pendingBlurIndex = null;
      if (manualFocusIndex() === index) {
        setFocusState(createFocusState(null, 'manual'));
        logger.debug('useGalleryFocusTracker: manual focus cleared', { index });
        scheduleSync();
        evaluateAutoFocus('manual-blur');
      }
    }
  };

  const scheduleFocusBatch = () => {
    if (focusBatchScheduled) {
      return;
    }
    focusBatchScheduled = true;
    globalTimerManager.setTimeout(flushFocusBatch, 0); // microtask 대체
  };

  const handleItemFocus = (index: number) => {
    pendingFocusIndex = index;
    scheduleFocusBatch();
  };

  const handleItemBlur = (index: number) => {
    pendingBlurIndex = index;
    scheduleFocusBatch();
  };

  const focusedIndex = createMemo(() => {
    const manual = manualFocusIndex();
    if (manual !== null) {
      return manual;
    }

    return autoFocusIndex();
  });

  const forceSync = () => {
    recomputeFocus();
    debouncedSetAutoFocusIndex.flush();
    debouncedUpdateContainerFocusAttribute.flush();
    // Ensure evaluateAutoFocus runs after state updates
    Promise.resolve().then(() => {
      evaluateAutoFocus('force');
    });
  };

  // Explicit manual focus setting (clears auto-focus timer)
  const setManualFocus = (index: number | null) => {
    clearAutoFocusTimer();
    setFocusState(createFocusState(index, 'manual'));

    if (index !== null) {
      logger.debug('useGalleryFocusTracker: manual focus set', { index });
      updateContainerFocusAttribute(index);
      const current2 = focusTracking();
      setFocusTracking(
        updateFocusTracking(current2, { lastAutoFocusedIndex: index, lastAppliedIndex: index })
      );
    } else {
      logger.debug('useGalleryFocusTracker: manual focus cleared');
      scheduleSync();
      evaluateAutoFocus('manual-focus-cleared');
    }
  };

  // Track auto-focus and manual focus state with explicit dependencies
  createEffect(
    on(
      [shouldAutoFocusAccessor, manualFocusIndex, autoFocusIndex],
      () => {
        evaluateAutoFocus('effect');
      },
      { defer: true }
    )
  );

  // Subscribe to gallery navigation events for immediate focus sync
  createEffect(() => {
    const enabled = isEnabledAccessor();

    if (!enabled) {
      return;
    }

    const unsubNavigate = galleryIndexEvents.on('navigate:complete', ({ index, trigger }) => {
      // Only sync focus on intentional navigation
      if (trigger !== 'button' && trigger !== 'click' && trigger !== 'keyboard') {
        return;
      }

      logger.debug('useGalleryFocusTracker: navigation event received', {
        index,
        trigger,
      });

      // Cancel pending auto-focus timer to prevent conflicts
      clearAutoFocusTimer();

      // Update focus state immediately
      const { batch: solidBatch } = getSolid();
      solidBatch(() => {
        setFocusState(createFocusState(index, 'auto'));
        updateContainerFocusAttribute(index);
      });

      // Apply focus after scroll completes
      const delay = autoFocusDelayAccessor();
      globalTimerManager.setTimeout(() => {
        applyAutoFocus(index, `navigation:${trigger}`);
      }, delay + 100);
    });

    onCleanup(() => {
      unsubNavigate();
    });
  });

  // Sync currentIndex with autoFocusIndex when they diverge
  createEffect(
    on(
      [getCurrentIndex, autoFocusIndex, manualFocusIndex],
      ([currentIdx, autoIdx, manualIdx]) => {
        // Resync if autoFocusIndex drifts too far from currentIndex
        if (manualIdx === null && autoIdx !== null && Math.abs(autoIdx - currentIdx) > 1) {
          logger.debug('useGalleryFocusTracker: syncing autoFocusIndex with currentIndex', {
            autoIdx,
            currentIdx,
            diff: Math.abs(autoIdx - currentIdx),
          });
          debouncedSetAutoFocusIndex.execute(currentIdx);
        }
      },
      { defer: true }
    )
  );

  // Manage IntersectionObserver lifecycle with explicit dependencies
  createEffect(
    on([isEnabledAccessor, containerAccessor], ([enabled, containerElement]) => {
      cleanupObserver();

      if (!enabled) {
        debouncedSetAutoFocusIndex.execute(null, { forceClear: true });
        return;
      }

      if (!containerElement) {
        return;
      }

      observer = new IntersectionObserver(handleEntries, {
        root: containerElement,
        threshold,
        rootMargin,
      });

      itemCache.forEach(item => {
        if (!item?.element) {
          return;
        }
        observer?.observe(item.element);
      });

      logger.debug('useGalleryFocusTracker: observer initialized', {
        itemCount: itemCache.size,
        threshold,
        rootMargin,
      });

      onCleanup(() => {
        cleanupObserver();
        clearAutoFocusTimer();
        setFocusTracking(updateFocusTracking(focusTracking(), { lastAutoFocusedIndex: null }));
      });
    })
  );

  onCleanup(() => {
    cleanupObserver();
    debouncedSetAutoFocusIndex.cancel();
    debouncedScheduleSync.cancel(); // Phase 69.2
    debouncedUpdateContainerFocusAttribute.cancel(); // Phase 69.2
    batch(() => {
      setFocusState(createFocusState(null, 'manual'));
      debouncedSetAutoFocusIndex.flush(); // 대기 중인 업데이트를 즉시 실행
      setFocusState(createFocusState(null, 'auto'));
    });
    itemCache.clear();
    focusTimerManager.clearAll();
    setFocusTracking(createFocusTracking()); // 추적 상태 리셋
  });

  return {
    focusedIndex,
    registerItem,
    handleItemFocus,
    handleItemBlur,
    forceSync,
    setManualFocus,
  };
}
