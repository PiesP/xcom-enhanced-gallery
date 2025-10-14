import type { Accessor } from 'solid-js';
import { getSolid } from '../../../shared/external/vendors';
import { logger } from '../../../shared/logging/logger';
import { globalTimerManager } from '../../../shared/utils/timer-management';
import { createDebouncer } from '../../../shared/utils/performance/performance-utils';
import { galleryIndexEvents, setFocusedIndex } from '../../../shared/state/signals/gallery.signals';

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
const { createSignal, createEffect, createMemo, onCleanup, batch, untrack, on } = solid;

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
  let lastAppliedIndex: number | null = null; // Phase 69.2: 중복 applyAutoFocus 방지

  // ✅ Phase 21.1: debounced setAutoFocusIndex로 signal 업데이트 제한
  // ✅ Phase 64 Step 3: 전역 setFocusedIndex도 함께 호출하여 버튼 네비게이션과 동기화
  const debouncedSetAutoFocusIndex = createDebouncer<[number | null, { forceClear?: boolean }?]>(
    (index, options) => {
      const shouldForceClear = options?.forceClear ?? false;

      if (index === null && !shouldForceClear) {
        const fallbackIndex =
          autoFocusIndex() ?? manualFocusIndex() ?? lastAutoFocusedIndex ?? getCurrentIndex();

        if (fallbackIndex === null || Number.isNaN(fallbackIndex)) {
          setAutoFocusIndex(null);
          setFocusedIndex(null);
          return;
        }

        setAutoFocusIndex(fallbackIndex);
        setFocusedIndex(fallbackIndex);
        return;
      }

      setAutoFocusIndex(index);
      setFocusedIndex(index); // Phase 64 Step 3: 전역 동기화
    },
    50
  );

  // ✅ Phase 69.2: updateContainerFocusAttribute를 50ms debounce
  // DOM 업데이트 빈도를 제한하여 렌더링 최적화
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

    // ✅ Phase 68.1: 명시적 값이 주어진 경우 즉시 사용
    // fallback은 value가 invalid한 경우에만 사용
    let finalValue: number | null = null;

    if (resolveCandidate(value)) {
      // 명시적으로 전달된 유효한 값 사용
      finalValue = value;
    } else if (!shouldForceClear) {
      // value가 invalid하고 forceClear가 아닌 경우 fallback 시도
      const fallbackCandidates: Array<number | null> = [
        autoFocusIndex(),
        manualFocusIndex(),
        lastAutoFocusedIndex,
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

  // ✅ Phase 69.2: scheduleSync를 100ms debounce하여 호출 빈도 제한
  // 빠른 연속 호출(아이템 등록/해제)을 배칭하여 불필요한 recompute 방지
  const debouncedScheduleSync = createDebouncer<[]>(() => {
    recomputeFocus();
  }, 100);

  const scheduleSync = () => {
    debouncedScheduleSync.execute();
  };

  const clearAutoFocusTimer = () => {
    if (autoFocusTimerId !== null) {
      globalTimerManager.clearTimeout(autoFocusTimerId);
      autoFocusTimerId = null;
    }
  };

  const applyAutoFocus = (index: number, reason: string) => {
    // ✅ Phase 69.2: lastAppliedIndex guard로 동일 인덱스 중복 방지
    // 동일한 인덱스에 대해 이미 포커스가 적용되었다면 스킵
    if (lastAppliedIndex === index) {
      return;
    }

    const element = itemElements.get(index);
    if (!element?.isConnected) {
      return;
    }

    if (document.activeElement === element) {
      lastAutoFocusedIndex = index;
      lastAppliedIndex = index;
      return;
    }

    try {
      element.focus({ preventScroll: true });
      lastAutoFocusedIndex = index;
      lastAppliedIndex = index;
      logger.debug('useGalleryFocusTracker: auto focus applied', { index, reason });
    } catch (error) {
      try {
        element.focus();
        lastAutoFocusedIndex = index;
        lastAppliedIndex = index;
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
    // ✅ Phase 21.1: untrack으로 반응성 체인 끊기
    untrack(() => {
      entries.forEach(entry => {
        const targetIndex = elementToIndex.get(entry.target as HTMLElement);
        if (typeof targetIndex !== 'number') {
          return;
        }

        entryCache.set(targetIndex, entry);
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

  // ✅ Phase 69.2: handleItemFocus/Blur microtask 배칭
  // 빠른 연속 포커스 변경을 microtask로 배칭하여 불필요한 업데이트 방지
  let pendingFocusIndex: number | null = null;
  let pendingBlurIndex: number | null = null;
  let focusBatchScheduled = false;

  const flushFocusBatch = () => {
    focusBatchScheduled = false;

    if (pendingFocusIndex !== null) {
      const index = pendingFocusIndex;
      pendingFocusIndex = null;
      setManualFocusIndex(index);
      logger.debug('useGalleryFocusTracker: manual focus applied', { index });
      updateContainerFocusAttribute(index);
      clearAutoFocusTimer();
      lastAutoFocusedIndex = index;
      lastAppliedIndex = index;
    }

    if (pendingBlurIndex !== null) {
      const index = pendingBlurIndex;
      pendingBlurIndex = null;
      if (manualFocusIndex() === index) {
        setManualFocusIndex(null);
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
    evaluateAutoFocus('force');
  };

  // ✅ Phase 21.1: on()으로 명시적 의존성 지정 (evaluateAutoFocus는 직접 signal 읽지 않음)
  createEffect(
    on(
      [shouldAutoFocusAccessor, manualFocusIndex, autoFocusIndex],
      () => {
        evaluateAutoFocus('effect');
      },
      { defer: true }
    )
  );

  // ✅ Phase 63: galleryIndexEvents 구독 - 명시적 네비게이션 시 즉시 동기화
  createEffect(() => {
    const enabled = isEnabledAccessor();

    if (!enabled) {
      return;
    }

    const unsubNavigate = galleryIndexEvents.on('navigate:complete', ({ index, trigger }) => {
      // 버튼/클릭/키보드 네비게이션은 즉시 동기화
      if (trigger !== 'button' && trigger !== 'click' && trigger !== 'keyboard') {
        return;
      }

      logger.debug('useGalleryFocusTracker: navigation event received', {
        index,
        trigger,
      });

      // manualFocusIndex를 우회하고 autoFocusIndex를 즉시 업데이트
      const { batch: solidBatch } = getSolid();
      solidBatch(() => {
        setAutoFocusIndex(index);
        updateContainerFocusAttribute(index);
      });

      // 포커스 적용 (스크롤 완료 후)
      const delay = autoFocusDelayAccessor();
      globalTimerManager.setTimeout(() => {
        applyAutoFocus(index, `navigation:${trigger}`);
      }, delay + 100); // 스크롤 완료 대기
    });

    onCleanup(() => {
      unsubNavigate();
    });
  });

  // ✅ Phase 21.1: currentIndex 동기화 effect - on()으로 필요한 의존성만 추적
  // ✅ Phase 68.1: updateContainerFocusAttribute 제거 - 이벤트 핸들러가 처리
  createEffect(
    on(
      [getCurrentIndex, autoFocusIndex, manualFocusIndex],
      ([currentIdx, autoIdx, manualIdx]) => {
        // 수동 포커스가 없고, autoFocusIndex가 currentIndex와 크게 차이나는 경우 동기화
        if (manualIdx === null && autoIdx !== null && Math.abs(autoIdx - currentIdx) > 1) {
          logger.debug('useGalleryFocusTracker: syncing autoFocusIndex with currentIndex', {
            autoIdx,
            currentIdx,
            diff: Math.abs(autoIdx - currentIdx),
          });
          debouncedSetAutoFocusIndex.execute(currentIdx);
          // updateContainerFocusAttribute는 이벤트 핸들러에서 이미 처리됨
        }
      },
      { defer: true }
    )
  );

  // ✅ Phase 68.1: Observer 생명주기 최적화
  // Effect는 enabled/container 변경 시에만 실행되도록 명시적 의존성 지정
  // scheduleSync() 제거로 순환 의존성 방지
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

      // ✅ Phase 68.1: scheduleSync() 제거 - observer 초기화와 focus 계산 분리
      // 초기 동기화는 불필요 - IntersectionObserver가 자동으로 entries를 발생시키고
      // galleryIndexEvents 구독이 이벤트 기반 동기화를 처리함

      onCleanup(() => {
        cleanupObserver();
        clearAutoFocusTimer();
        lastAutoFocusedIndex = null;
      });
    })
  );

  onCleanup(() => {
    cleanupObserver();
    debouncedSetAutoFocusIndex.cancel();
    debouncedScheduleSync.cancel(); // Phase 69.2
    debouncedUpdateContainerFocusAttribute.cancel(); // Phase 69.2
    batch(() => {
      setManualFocusIndex(null);
      debouncedSetAutoFocusIndex.flush(); // 대기 중인 업데이트를 즉시 실행
      setAutoFocusIndex(null);
    });
    itemElements.clear();
    clearAutoFocusTimer();
    lastAutoFocusedIndex = null;
    lastAppliedIndex = null; // Phase 69.2
  });

  return {
    focusedIndex,
    registerItem,
    handleItemFocus,
    handleItemBlur,
    forceSync,
  };
}
