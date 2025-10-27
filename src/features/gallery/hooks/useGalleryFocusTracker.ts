import type { Accessor } from 'solid-js';
import { getSolid } from '@shared/external/vendors';
import { logger } from '@shared/logging';
import { globalTimerManager } from '@shared/utils/timer-management';
import { galleryIndexEvents, setFocusedIndex } from '@shared/state/signals/gallery.signals';
import {
  type FocusState,
  type FocusTracking,
  INITIAL_FOCUS_STATE,
  INITIAL_FOCUS_TRACKING,
  createFocusState,
  createFocusTracking,
  updateFocusTracking,
  createItemCache,
  createFocusTimerManager,
} from '@shared/state/focus';
import {
  createFocusObserverManager,
  createFocusApplicatorService,
  createFocusStateManagerService,
} from '@shared/services/focus';

type MaybeAccessor<T> = T | Accessor<T>;

const toAccessor = <T>(value: MaybeAccessor<T>): Accessor<T> =>
  typeof value === 'function' ? (value as Accessor<T>) : () => value;

/**
 * useGalleryFocusTracker 훅의 옵션 인터페이스
 *
 * IntersectionObserver를 이용한 자동 포커스 추적과 수동 포커스 관리를 지원합니다.
 */
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

/**
 * useGalleryFocusTracker 훅의 반환 값 인터페이스
 *
 * 자동 감지 및 수동 조정 가능한 포커스 관리 API를 제공합니다.
 */
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
  const [focusTracking, setFocusTracking] = createSignal<FocusTracking>(INITIAL_FOCUS_TRACKING);

  // Backward compat: getter 헬퍼
  const manualFocusIndex = (): number | null =>
    focusState().source === 'manual' ? focusState().index : null;
  const autoFocusIndex = (): number | null =>
    focusState().source === 'auto' ? focusState().index : null;

  // Service instances
  const itemCache = createItemCache();
  const focusTimerManager = createFocusTimerManager();
  const observerManager = createFocusObserverManager();
  const applicator = createFocusApplicatorService();
  const stateManager = createFocusStateManagerService();

  // Setup state sync debouncer
  stateManager.setupAutoFocusSync((index, source) => {
    const currentState = focusState();
    const fallbackIndex =
      (currentState.source === 'auto' ? currentState.index : null) ??
      (currentState.source === 'manual' ? currentState.index : null) ??
      focusTracking().lastAutoFocusedIndex ??
      getCurrentIndex();

    if (index === null && (fallbackIndex === null || Number.isNaN(fallbackIndex))) {
      setFocusState(createFocusState(null, source));
      setFocusedIndex(null);
      return;
    }

    const targetIndex = index ?? fallbackIndex;
    setFocusState(createFocusState(targetIndex, source));
    setFocusedIndex(targetIndex, 'auto-focus');
  }, 50);

  // Setup container sync debouncer
  stateManager.setupContainerSync((value, options) => {
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

  // Handle scroll settling and deferred sync
  createEffect(() => {
    const scrolling = isScrollingAccessor();
    const current = focusTracking();

    const updated = stateManager.handleScrollState(scrolling, current, recomputeFocus);
    if (updated !== current) {
      setFocusTracking(updated);
    }
  });

  // Apply auto focus with service
  const applyAutoFocus = (index: number, reason: string) => {
    const current = focusTracking();
    const updated = applicator.applyAutoFocus(index, itemCache, current, reason);
    if (updated) {
      setFocusTracking(updated);
    }
  };

  // Evaluate and schedule auto focus with service
  const evaluateAutoFocus = (reason: string) => {
    const targetIndex = autoFocusIndex();
    const current = focusTracking();
    const updated = applicator.evaluateAndScheduleAutoFocus(
      targetIndex,
      manualFocusIndex(),
      itemCache,
      current,
      focusTimerManager,
      shouldAutoFocusAccessor(),
      Math.max(0, autoFocusDelayAccessor()),
      applyAutoFocus,
      reason
    );
    if (updated !== current) {
      setFocusTracking(updated);
    }
  };

  /**
   * 현재 가시적인 아이템들 중 가장 중앙에 위치한 아이템의 인덱스를 재계산합니다.
   *
   * IntersectionObserver로부터 수집된 데이터를 기반으로:
   * 1. 중앙으로부터의 거리 순서로 정렬
   * 2. 가시 비율로 2차 정렬
   * 3. 시간 순서로 3차 정렬
   *
   * 아이템 없음 시 현재 인덱스(currentIndex)로 fallback합니다.
   */
  const recomputeFocus = () => {
    const enabled = isEnabledAccessor();
    if (!enabled) {
      stateManager.syncAutoFocus(null, { forceClear: true });
      stateManager.syncContainer(null, { forceClear: true });
      evaluateAutoFocus('disabled');
      return;
    }

    const containerElement = containerAccessor();
    if (!containerElement) {
      stateManager.syncContainer(autoFocusIndex());
      return;
    }

    const containerRect = containerElement.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    const candidates: Array<{
      index: number;
      centerDistance: number;
      intersectionRatio: number;
      time: number;
    }> = [];

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
        time: entry?.time ?? Date.now(),
      });
    });

    if (candidates.length === 0) {
      const fallbackIndex = getCurrentIndex();
      stateManager.syncAutoFocus(fallbackIndex);
      stateManager.syncContainer(fallbackIndex);
      evaluateAutoFocus(itemCache.size === 0 ? 'itemCache-empty' : 'fallback');
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
    stateManager.syncAutoFocus(nextIndex);
    stateManager.syncContainer(nextIndex);
    evaluateAutoFocus('recompute');
  };

  // Observer entry handler
  const handleEntries = (_candidates: Array<{ index: number }>) => {
    untrack(() => {
      // Schedule recompute after entries are processed
      recomputeFocus();
    });
  };

  /**
   * 갤러리 아이템 요소를 포커스 추적 대상으로 등록하거나 해제합니다.
   *
   * @param index 갤러리 아이템의 인덱스
   * @param element 등록할 DOM 요소 (null인 경우 해제)
   *
   * 호출 시마다 recomputeFocus()를 수행하여 현재 포커스를 재평가합니다.
   */
  const registerItem = (index: number, element: HTMLElement | null) => {
    const prev = itemCache.getItem(index);
    if (prev?.element) {
      observerManager.unobserveItem(prev.element);
    }

    if (!element) {
      itemCache.deleteItem(index);
      recomputeFocus();
      evaluateAutoFocus('register-remove');
      return;
    }

    itemCache.setItem(index, element);
    observerManager.observeItem(element);
    recomputeFocus();
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
      stateManager.syncContainer(index);
      applicator.clearAutoFocusTimer(focusTimerManager);
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
        recomputeFocus();
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
    // Ensure evaluateAutoFocus runs after state updates
    Promise.resolve().then(() => {
      evaluateAutoFocus('force');
    });
  };

  // Explicit manual focus setting (clears auto-focus timer)
  const setManualFocus = (index: number | null) => {
    applicator.clearAutoFocusTimer(focusTimerManager);
    setFocusState(createFocusState(index, 'manual'));

    if (index !== null) {
      logger.debug('useGalleryFocusTracker: manual focus set', { index });
      stateManager.syncContainer(index);
      const current2 = focusTracking();
      setFocusTracking(
        updateFocusTracking(current2, { lastAutoFocusedIndex: index, lastAppliedIndex: index })
      );
    } else {
      logger.debug('useGalleryFocusTracker: manual focus cleared');
      recomputeFocus();
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
      applicator.clearAutoFocusTimer(focusTimerManager);

      // Update focus state immediately
      const { batch: solidBatch } = getSolid();
      solidBatch(() => {
        setFocusState(createFocusState(index, 'auto'));
        stateManager.syncContainer(index);
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
          stateManager.syncAutoFocus(currentIdx);
        }
      },
      { defer: true }
    )
  );

  // Manage IntersectionObserver lifecycle with explicit dependencies
  createEffect(
    on([isEnabledAccessor, containerAccessor], ([enabled, containerElement]) => {
      observerManager.cleanupObserver();

      if (!enabled) {
        stateManager.syncAutoFocus(null, { forceClear: true });
        return;
      }

      if (!containerElement) {
        return;
      }

      observerManager.setupObserver(
        containerElement,
        itemCache,
        handleEntries,
        threshold as number | number[],
        rootMargin
      );

      logger.debug('useGalleryFocusTracker: observer initialized', {
        itemCount: itemCache.size,
        threshold,
        rootMargin,
      });

      onCleanup(() => {
        observerManager.cleanupObserver();
        applicator.clearAutoFocusTimer(focusTimerManager);
        setFocusTracking(updateFocusTracking(focusTracking(), { lastAutoFocusedIndex: null }));
      });
    })
  );

  onCleanup(() => {
    observerManager.cleanupObserver();
    stateManager.dispose();
    batch(() => {
      setFocusState(createFocusState(null, 'manual'));
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
