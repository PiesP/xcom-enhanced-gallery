import type { Accessor } from 'solid-js';
import { getSolid } from '../../../shared/external/vendors';
import { logger } from '../../../shared/logging/logger';
import { globalTimerManager } from '../../../shared/utils/timer-management';

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
const { createSignal, createEffect, createMemo, onCleanup, batch } = solid;

export function useGalleryFocusTracker({
  container,
  isEnabled,
  getCurrentIndex,
  threshold = DEFAULT_THRESHOLD,
  rootMargin = '0px',
  minimumVisibleRatio = DEFAULT_MIN_VISIBLE_RATIO,
  shouldAutoFocus = false,
  autoFocusDebounce = DEFAULT_AUTO_FOCUS_DELAY,
}: UseGalleryFocusTrackerOptions): UseGalleryFocusTrackerReturn {
  const containerAccessor = toAccessor(container);
  const isEnabledAccessor = toAccessor(isEnabled);
  const shouldAutoFocusAccessor = toAccessor(shouldAutoFocus);
  const autoFocusDelayAccessor = toAccessor(autoFocusDebounce);

  const [manualFocusIndex, setManualFocusIndex] = createSignal<number | null>(null);
  const [autoFocusIndex, setAutoFocusIndex] = createSignal<number | null>(null);

  const itemElements = new Map<number, HTMLElement>();
  const elementToIndex = new WeakMap<HTMLElement, number>();
  const entryCache = new Map<number, IntersectionObserverEntry>();

  let observer: IntersectionObserver | null = null;
  let autoFocusTimerId: number | null = null;
  let lastAutoFocusedIndex: number | null = null;

  const updateContainerFocusAttribute = (value: number | null) => {
    const containerElement = containerAccessor();
    if (!containerElement) {
      return;
    }

    const fallback = getCurrentIndex();
    const normalized = value ?? fallback ?? -1;
    containerElement.setAttribute('data-focused', String(normalized));
    containerElement.setAttribute('data-focused-index', String(normalized));
  };

  const scheduleSync = () => {
    recomputeFocus();
  };

  const clearAutoFocusTimer = () => {
    if (autoFocusTimerId !== null) {
      globalTimerManager.clearTimeout(autoFocusTimerId);
      autoFocusTimerId = null;
    }
  };

  const applyAutoFocus = (index: number, reason: string) => {
    const element = itemElements.get(index);
    if (!element?.isConnected) {
      return;
    }

    if (document.activeElement === element) {
      lastAutoFocusedIndex = index;
      return;
    }

    try {
      element.focus({ preventScroll: true });
      lastAutoFocusedIndex = index;
      logger.debug('useGalleryFocusTracker: auto focus applied', { index, reason });
    } catch (error) {
      try {
        element.focus();
        lastAutoFocusedIndex = index;
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

    const targetElement = itemElements.get(targetIndex);
    if (!targetElement?.isConnected) {
      return;
    }

    if (document.activeElement === targetElement && lastAutoFocusedIndex === targetIndex) {
      return;
    }

    const delay = Math.max(0, autoFocusDelayAccessor());

    autoFocusTimerId = globalTimerManager.setTimeout(() => {
      applyAutoFocus(targetIndex, reason);
      autoFocusTimerId = null;
    }, delay);
  };

  const cleanupObserver = () => {
    observer?.disconnect();
    observer = null;
    entryCache.clear();
  };

  const handleEntries: IntersectionObserverCallback = entries => {
    entries.forEach(entry => {
      const targetIndex = elementToIndex.get(entry.target as HTMLElement);
      if (typeof targetIndex !== 'number') {
        return;
      }

      entryCache.set(targetIndex, entry);
    });

    scheduleSync();
  };

  const recomputeFocus = () => {
    const containerElement = containerAccessor();
    if (!containerElement || !isEnabledAccessor()) {
      setAutoFocusIndex(null);
      updateContainerFocusAttribute(null);
      evaluateAutoFocus('disabled');
      return;
    }

    const containerRect = containerElement.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    const candidates: CandidateScore[] = [];
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    itemElements.forEach((element, index) => {
      if (!element?.isConnected) {
        return;
      }

      const entry = entryCache.get(index);
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
      if (entryCache.size === 0) {
        const previousIndex = autoFocusIndex();
        const resolvedIndex = previousIndex ?? getCurrentIndex();
        updateContainerFocusAttribute(resolvedIndex);
        return;
      }

      const fallbackIndex = getCurrentIndex();
      setAutoFocusIndex(fallbackIndex);
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
    setAutoFocusIndex(nextIndex);
    updateContainerFocusAttribute(nextIndex);
    evaluateAutoFocus('recompute');
  };

  const registerItem = (index: number, element: HTMLElement | null) => {
    const prev = itemElements.get(index);
    if (prev && observer) {
      observer.unobserve(prev);
    }

    if (prev && prev !== element) {
      elementToIndex.delete(prev);
    }

    if (!element) {
      if (prev) {
        elementToIndex.delete(prev);
      }
      itemElements.delete(index);
      entryCache.delete(index);
      scheduleSync();
      evaluateAutoFocus('register-remove');
      return;
    }

    itemElements.set(index, element);
    elementToIndex.set(element, index);
    entryCache.delete(index);

    if (observer) {
      observer.observe(element);
    }

    scheduleSync();
    evaluateAutoFocus('register');
  };

  const handleItemFocus = (index: number) => {
    setManualFocusIndex(index);
    logger.debug('useGalleryFocusTracker: manual focus applied', { index });
    updateContainerFocusAttribute(index);
    clearAutoFocusTimer();
    lastAutoFocusedIndex = index;
  };

  const handleItemBlur = (index: number) => {
    if (manualFocusIndex() === index) {
      setManualFocusIndex(null);
      logger.debug('useGalleryFocusTracker: manual focus cleared', { index });
      scheduleSync();
      evaluateAutoFocus('manual-blur');
    }
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
    evaluateAutoFocus('force');
  };

  createEffect(() => {
    evaluateAutoFocus('effect');
  });

  // currentIndex 변경 시 autoFocusIndex와 동기화
  createEffect(() => {
    const currentIdx = getCurrentIndex();
    const autoIdx = autoFocusIndex();
    const manualIdx = manualFocusIndex();

    // 수동 포커스가 없고, autoFocusIndex가 currentIndex와 크게 차이나는 경우 동기화
    if (manualIdx === null && autoIdx !== null && Math.abs(autoIdx - currentIdx) > 1) {
      logger.debug('useGalleryFocusTracker: syncing autoFocusIndex with currentIndex', {
        autoIdx,
        currentIdx,
        diff: Math.abs(autoIdx - currentIdx),
      });
      setAutoFocusIndex(currentIdx);
      updateContainerFocusAttribute(currentIdx);
    }
  });

  createEffect(() => {
    const enabled = isEnabledAccessor();
    const containerElement = containerAccessor();

    cleanupObserver();

    if (!enabled || !containerElement) {
      setAutoFocusIndex(null);
      return;
    }

    observer = new IntersectionObserver(handleEntries, {
      root: containerElement,
      threshold,
      rootMargin,
    });

    itemElements.forEach(element => {
      if (!element) {
        return;
      }
      observer?.observe(element);
    });

    logger.debug('useGalleryFocusTracker: observer initialized', {
      itemCount: itemElements.size,
      threshold,
      rootMargin,
    });

    scheduleSync();

    onCleanup(() => {
      cleanupObserver();
      clearAutoFocusTimer();
      lastAutoFocusedIndex = null;
    });
  });

  onCleanup(() => {
    cleanupObserver();
    batch(() => {
      setManualFocusIndex(null);
      setAutoFocusIndex(null);
    });
    itemElements.clear();
    clearAutoFocusTimer();
    lastAutoFocusedIndex = null;
  });

  return {
    focusedIndex,
    registerItem,
    handleItemFocus,
    handleItemBlur,
    forceSync,
  };
}
