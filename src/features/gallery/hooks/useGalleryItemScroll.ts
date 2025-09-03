/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 통합된 갤러리 아이템 스크롤 훅
 * @description 갤러리 아이템들 간의 스크롤을 관리하는 단순하고 신뢰할 수 있는 훅
 * @version 1.0.0 - 초기 구현
 */

import { getPreactHooks, getPreactSignals } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';
import { getNavigationIntent, resetIntent } from '@shared/state/signals/navigation-intent.signals';

const { useCallback, useEffect, useRef } = getPreactHooks();

export interface UseGalleryItemScrollOptions {
  /** 스크롤 활성화 여부 */
  enabled?: boolean;
  /** 스크롤 동작 방식 */
  behavior?: ScrollBehavior;
  /** 스크롤 블록 위치 */
  block?: ScrollLogicalPosition;
  /** 디바운스 지연 시간 (ms) */
  debounceDelay?: number;
  /** 스크롤 오프셋 (px) */
  offset?: number;
  /** 중앙 정렬 여부 */
  alignToCenter?: boolean;
  /** motion 선호도 고려 여부 */
  respectReducedMotion?: boolean;
  /** 테스트/주입용: auto scroll 실행 직전 콜백 */
  onAutoScrollStart?: (index: number) => void;
  /** (v2 Step4) 예약된 auto-scroll 이 intent 변화(user-scroll 등)로 취소될 때 호출 */
  onAutoScrollCancelled?: (
    index: number,
    reason: 'intent-changed' | 'disabled' | 'user-scroll'
  ) => void;
  /** (v2) 평탄화 전 중간 wrapper 보존 구조에서 실제 아이템 루트 (item 들이 직접 자식) */
  itemsRootRef?: { current: HTMLElement | null };
}

export interface UseGalleryItemScrollReturn {
  /** 특정 인덱스로 스크롤 */
  scrollToItem: (index: number) => Promise<void>;
  /** 현재 인덱스로 스크롤 (자동 호출용) */
  scrollToCurrentItem: () => Promise<void>;
}

/**
 * 갤러리 아이템 스크롤 관리를 위한 통합 훅
 *
 * @description
 * - 미디어 요소 의존성 제거
 * - 컨테이너 기반 scrollIntoView 사용
 * - 단순하고 신뢰할 수 있는 스크롤 로직
 * - 디바운스 적용으로 성능 최적화
 *
 * @param containerRef 갤러리 컨테이너 참조
 * @param currentIndex 현재 선택된 아이템 인덱스
 * @param totalItems 전체 아이템 개수
 * @param options 스크롤 옵션
 */
export function useGalleryItemScroll(
  containerRef: { current: HTMLElement | null },
  currentIndex: number,
  totalItems: number,
  {
    enabled = true,
    behavior = 'smooth',
    block = 'start',
    debounceDelay = 100,
    offset = 0,
    alignToCenter = false,
    respectReducedMotion = true,
    onAutoScrollStart,
    onAutoScrollCancelled,
    itemsRootRef,
  }: UseGalleryItemScrollOptions = {}
): UseGalleryItemScrollReturn {
  const lastScrolledIndexRef = useRef<number>(-1);
  const scrollTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  // Step4: 예약 시 intent 스냅샷 저장하여 실행 시 재검증
  const scheduledIntentRef = useRef<string | null>(null);
  const scheduledIndexRef = useRef<number | null>(null);
  // smooth 진행중 플래그 + 취소 처리용
  const activeSmoothRef = useRef<{ index: number; startTime: number } | null>(null);
  // 최근 동일 키 로그 억제 (noise 감소)
  const lastLogRef = useRef<{ key: string; ts: number } | null>(null);

  const dedupLog = useCallback(
    (
      level: 'debug' | 'warn' | 'error',
      key: string,
      msg: string,
      data?: Record<string, unknown>
    ) => {
      const now = Date.now();
      const last = lastLogRef.current;
      if (last && last.key === key && now - last.ts < 40) return; // 40ms 내 중복 suppress
      lastLogRef.current = { key, ts: now };
      const payload = { ...data, key, t: now };
      if (level === 'debug') logger.debug(msg, payload);
      else if (level === 'warn') logger.warn(msg, payload);
      else logger.error(msg, payload);
    },
    []
  );

  /**
   * 특정 인덱스의 아이템으로 스크롤
   */
  const scrollToItem = useCallback(
    async (index: number): Promise<void> => {
      if (!enabled || !containerRef.current || index < 0 || index >= totalItems) {
        dedupLog('debug', 'skip-preconditions', 'FocusSync.ItemScroll: 스크롤 조건 불충족', {
          enabled,
          hasContainer: !!containerRef.current,
          index,
          totalItems,
        });
        return;
      }

      // intent 검사: user-scroll 인 경우 강제 스킵 (테스트 가독성 향상)
      const intent = getNavigationIntent();
      if (intent === 'user-scroll') {
        dedupLog(
          'debug',
          'skip-user-scroll-intent',
          'FocusSync.ItemScroll: intent=user-scroll → auto scroll skip',
          { index }
        );
        return;
      }

      try {
        const container = containerRef.current;
        // v2: itemsRootRef 가 전달되었다면 해당 요소의 children 을 우선 사용
        const root = itemsRootRef?.current ?? container;

        // P14R1: 안정적인 요소 탐색 - children index 방식 + querySelector fallback
        let targetElement: HTMLElement | null = null;

        // 1차: children[index] 방식 (기존)
        if (root?.children[index]) {
          targetElement = root.children[index] as HTMLElement;
        }

        // 2차: data-index 기반 querySelector fallback (display: contents 대응)
        if (!targetElement && container) {
          try {
            targetElement = container.querySelector(
              `[data-xeg-role="gallery-item"][data-index="${index}"]`
            ) as HTMLElement;
          } catch {
            // querySelector 실패 시 일반 role 셀렉터로 재시도
            const items = Array.from(
              container.querySelectorAll('[data-xeg-role="gallery-item"]')
            ) as HTMLElement[];
            if (items[index]) {
              targetElement = items[index];
            }
          }
        }

        if (!targetElement) {
          dedupLog('warn', 'missing-target', 'FocusSync.ItemScroll: 타겟 요소를 찾을 수 없음', {
            index,
            totalItems,
            childCount: container?.children.length || 0,
            rootChildCount: root?.children.length || 0,
            hasDataIndex: !!container?.querySelector(`[data-index="${index}"]`),
          });
          return;
        }

        // prefers-reduced-motion 확인
        const actualBehavior =
          respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : behavior;

        // scrollIntoView 사용 - 미디어 요소 의존성 없음
        onAutoScrollStart?.(index);
        targetElement.scrollIntoView({
          behavior: actualBehavior,
          block: alignToCenter ? 'center' : block,
          inline: 'nearest',
        });

        // 오프셋 보정 (헤더나 툴바 높이 보정)
        if (offset !== 0) {
          const scrollTop = container.scrollTop - offset;
          container.scrollTo({
            top: scrollTop,
            behavior: actualBehavior,
          });
        }

        lastScrolledIndexRef.current = index;
        retryCountRef.current = 0; // 성공 시 재시도 카운터 리셋

        dedupLog('debug', 'scroll-complete', 'FocusSync.ItemScroll: 스크롤 완료', {
          index,
          behavior: actualBehavior,
          block: alignToCenter ? 'center' : block,
          offset,
          timestamp: Date.now(),
        });

        // smooth scroll의 경우 애니메이션 완료 대기 + intent 기반 취소 감시
        if (actualBehavior === 'smooth') {
          activeSmoothRef.current = { index, startTime: performance.now() };
          const { effect } = getPreactSignals();
          let cancelled = false;
          await new Promise(resolve => {
            const timer = setTimeout(() => {
              dispose();
              resolve(null);
            }, 320); // 약간 여유
            const dispose = effect(() => {
              if (getNavigationIntent() === 'user-scroll') {
                cancelled = true;
                clearTimeout(timer);
                dispose();
                // 즉시 애니메이션 중단 (브라우저 기본도 중단하지만 확실히) -> 현재 위치로 강제 flush
                try {
                  container.scrollTo({ top: container.scrollTop, behavior: 'auto' });
                } catch {
                  /* noop */
                }
                resolve(null);
              }
            });
          });
          if (cancelled) {
            onAutoScrollCancelled?.(index, 'user-scroll');
            dedupLog(
              'debug',
              'smooth-cancelled',
              'FocusSync.ItemScroll: smooth auto-scroll cancelled by user intent',
              { index }
            );
            // P14R3: 취소 시에는 resetIntent 하지 않음 (user-scroll 유지)
          } else {
            // P14R3: 정상 완료 시에만 resetIntent
            resetIntent();
          }
          activeSmoothRef.current = null;
        } else {
          // P14R3: auto behavior 완료 시에도 resetIntent
          resetIntent();
        }
      } catch (error) {
        dedupLog('error', 'scroll-failed', 'FocusSync.ItemScroll: 스크롤 실패', { index, error });

        // 재시도 로직 (최대 1회)
        if (retryCountRef.current < 1) {
          retryCountRef.current++;
          dedupLog('debug', 'retry-attempt', 'FocusSync.ItemScroll: 재시도 시도', {
            index,
            retryCount: retryCountRef.current,
          });

          // IntersectionObserver로 요소 가시성 확인 후 재시도
          const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                observer.disconnect();
                setTimeout(() => scrollToItem(index), 50);
              }
            });
          });

          const targetElement = containerRef.current?.children[index] as HTMLElement;
          if (targetElement) {
            observer.observe(targetElement);
            setTimeout(() => observer.disconnect(), 1000); // 1초 후 정리
          }
        }
      }
    },
    [
      enabled,
      containerRef,
      totalItems,
      behavior,
      block,
      offset,
      alignToCenter,
      respectReducedMotion,
      onAutoScrollStart,
      onAutoScrollCancelled,
      itemsRootRef,
    ]
  );

  /**
   * 현재 인덱스로 스크롤
   */
  const scrollToCurrentItem = useCallback(async (): Promise<void> => {
    await scrollToItem(currentIndex);
  }, [scrollToItem, currentIndex]);

  /**
   * currentIndex 변경 시 자동 스크롤 (디바운스 적용)
   */
  useEffect(() => {
    if (!enabled || currentIndex < 0) {
      return;
    }

    // 이미 스크롤한 인덱스와 같으면 건너뜀
    if (lastScrolledIndexRef.current === currentIndex) {
      dedupLog('debug', 'skip-same-index', 'FocusSync.ItemScroll: 이미 스크롤한 인덱스로 건너뜀', {
        currentIndex,
        lastScrolledIndex: lastScrolledIndexRef.current,
      });
      return;
    }

    // 동일 인덱스에 대한 기존 디바운스 예약이 아직 살아있다면 재예약으로 타이머 누적 방지
    if (scrollTimeoutRef.current && scheduledIndexRef.current === currentIndex) {
      dedupLog(
        'debug',
        'skip-reschedule',
        'FocusSync.ItemScroll: 동일 인덱스 pending 예약 존재 → 재예약 생략',
        {
          currentIndex,
        }
      );
      return;
    }

    // 이전 타이머 취소
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // intent 검사: user-scroll 인 경우 자동 스크롤 자체를 건너뜀
    const intent = getNavigationIntent();
    if (intent === 'user-scroll') {
      dedupLog(
        'debug',
        'effect-skip-user-scroll',
        'FocusSync.ItemScroll: intent-user-scroll → effect auto-scroll skip',
        {
          currentIndex,
        }
      );
      return;
    }

    // P14R2: toolbar intent는 즉시 실행, 기타는 debounce 적용
    const isToolbarIntent = intent === 'toolbar-prev' || intent === 'toolbar-next';
    const delay = isToolbarIntent ? 0 : debounceDelay;

    // 디바운스 적용 (toolbar는 0ms, auto intent는 기본값)
    scrollTimeoutRef.current = window.setTimeout(() => {
      const execIntent = getNavigationIntent();
      const scheduledIntent = scheduledIntentRef.current;
      const scheduledIndex = scheduledIndexRef.current;

      const cleanupScheduled = () => {
        // 타이머 콜백 실행 후 참조 정리 (GC 유도 & 중복 실행 방지)
        scrollTimeoutRef.current = null;
        scheduledIntentRef.current = null;
        scheduledIndexRef.current = null;
      };

      // 안전 가드: 컨테이너가 사라졌거나 비활성화되었다면 즉시 정리
      if (!enabled || !containerRef.current) {
        dedupLog(
          'debug',
          'cancel-disabled',
          'FocusSync.ItemScroll: 실행 시 비활성/컨테이너 소실로 취소',
          {
            currentIndex,
            enabled,
            hasContainer: !!containerRef.current,
          }
        );
        onAutoScrollCancelled?.(currentIndex, 'disabled');
        cleanupScheduled();
        return;
      }

      // P14R3: user-scroll만 auto-scroll 취소 (기타 intent 전이는 허용)
      if (execIntent === 'user-scroll') {
        dedupLog(
          'debug',
          'cancel-user-scroll',
          'FocusSync.ItemScroll: auto-scroll 취소 (user-scroll 감지)',
          {
            scheduledIntent,
            execIntent,
            currentIndex,
          }
        );
        onAutoScrollCancelled?.(currentIndex, 'user-scroll');
        cleanupScheduled();
        return;
      }

      dedupLog('debug', 'auto-scroll-run', 'FocusSync.ItemScroll: 자동 스크롤 실행', {
        currentIndex,
        lastScrolledIndex: lastScrolledIndexRef.current,
        intent: execIntent,
        scheduledIntent,
        scheduledIndex,
      });
      scrollToCurrentItem().finally(() => {
        // 정상 실행 후에도 즉시 정리 (추가 재예약 루프 차단)
        cleanupScheduled();
      });
    }, delay);
    // 예약 시 intent 스냅샷 저장
    scheduledIntentRef.current = intent;
    scheduledIndexRef.current = currentIndex;

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scheduledIntentRef.current = null;
      scheduledIndexRef.current = null;
    };
  }, [enabled, currentIndex, debounceDelay, scrollToCurrentItem]);

  /**
   * 컴포넌트 언마운트 시 타이머 정리
   */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    scrollToItem,
    scrollToCurrentItem,
  };
}
