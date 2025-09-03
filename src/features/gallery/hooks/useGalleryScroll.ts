/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 개선된 갤러리 스크롤 관리 훅
 * @description 마우스 움직임에 의존하지 않는 안정적인 스크롤 처리를 제공
 */

import { getPreactHooks } from '@shared/external/vendors';
import { normalizeWheelDelta } from '@shared/utils/scroll/wheel-normalize';
import { isHTMLElement } from '@shared/utils/dom-guards';
import { createWheelDeltaAccumulator } from '@shared/utils/scroll/wheel-delta-accumulator';
import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/EventManager';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { findTwitterScrollContainer } from '@shared/utils';
import { FEATURE_INERTIA_CONDITIONAL_PREVENT } from '@/constants';
import { getInertiaExperimentVariant } from '@shared/experiments/inertia-experiment';
import { decideInertiaPrevent } from './inertia-prevent-decision';

// NOTE: document 존재 여부는 정적으로 캐시하지 않고, 매 접근 시 동적으로 확인한다.
// JSDOM 테스트 환경 teardown 이후 지연된 타이머/이펙트가 실행될 수 있으므로
// typeof document === 'undefined' 검사 또는 try/catch 로 안전하게 보호한다.

const { useEffect, useRef, useCallback } = getPreactHooks();

interface UseGalleryScrollOptions {
  /** 갤러리 컨테이너 참조 */
  container: HTMLElement | null;
  /** (옵션) 실제 스크롤이 적용될 내부 스크롤 요소 (scrollArea 등). 제공 시 container 대신 우선 사용 */
  scrollElement?: HTMLElement | null;
  /** 스크롤 콜백 함수 */
  onScroll?: (delta: number) => void;
  /** 스크롤 처리 활성화 여부 */
  enabled?: boolean;
  /** 트위터 페이지 스크롤 차단 여부 */
  blockTwitterScroll?: boolean;
  /** 스크롤 방향 감지 활성화 여부 */
  enableScrollDirection?: boolean;
  /** 스크롤 방향 변경 콜백 */
  onScrollDirectionChange?: (direction: 'up' | 'down' | 'idle') => void;
  /** 이미지 크기 정보 (조건적 처리용) */
  imageSize?: { width: number; height: number };
  /** 뷰포트 크기 정보 (조건적 처리용) */
  viewportSize?: { width: number; height: number };
  /** 이미지 네비게이션 콜백 (작은 이미지일 때) */
  onImageNavigation?: (direction: 'next' | 'prev') => void;
}

interface UseGalleryScrollReturn {
  /** 마지막 스크롤 시간 */
  lastScrollTime: number;
  /** 현재 스크롤 중인지 여부 */
  isScrolling: boolean;
  /** 현재 스크롤 방향 (옵션) */
  scrollDirection?: 'up' | 'down' | 'idle';
}

/**
 * 갤러리 스크롤 처리를 위한 개선된 커스텀 훅
 *
 * @description
 * - 갤러리 열림 상태 기반 스크롤 감지 (event.target 의존성 제거)
 * - 가상 스크롤링과 DOM 재배치에 안정적으로 대응
 * - 트위터 페이지와의 이벤트 충돌 방지
 * - 안정적인 이벤트 리스너 관리
 * - 메모리 누수 방지
 *
 * @version 2.0.0 - DOM 재배치 대응 개선
 */
export function useGalleryScroll({
  container,
  scrollElement,
  onScroll,
  enabled = true,
  blockTwitterScroll = true,
  enableScrollDirection = false,
  onScrollDirectionChange,
  imageSize,
  viewportSize,
  onImageNavigation,
}: UseGalleryScrollOptions): UseGalleryScrollReturn {
  const eventManagerRef = useRef(new EventManager());
  // 최신 container 요소 추적 (ref 변경은 리렌더 트리거 X → wheel handler 에서 항상 최신 사용)
  const activeContainerRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  // Phase 14: fractional wheel delta accumulation (소수 누적 후 정수 스텝 소비)
  const accumulatorRef = useRef(createWheelDeltaAccumulator());

  // 스크롤 방향 감지 관련 상태 (옵션)
  const scrollDirectionRef = useRef<'up' | 'down' | 'idle'>('idle');
  const directionTimeoutRef = useRef<number | null>(null);

  // 스크롤 상태 업데이트
  const updateScrollState = useCallback((isScrolling: boolean) => {
    isScrollingRef.current = isScrolling;
    if (isScrolling) {
      lastScrollTimeRef.current = Date.now();
    }
  }, []);

  // 스크롤 방향 업데이트 (옵션)
  const updateScrollDirection = useCallback(
    (delta: number) => {
      if (!enableScrollDirection) return;

      const newDirection: 'up' | 'down' | 'idle' = delta > 0 ? 'down' : 'up';

      if (scrollDirectionRef.current !== newDirection) {
        scrollDirectionRef.current = newDirection;
        onScrollDirectionChange?.(newDirection);

        logger.debug('useGalleryScroll: 스크롤 방향 변경', {
          direction: newDirection,
          delta,
        });
      }

      // 스크롤 방향 idle 상태로 전환 타이머
      if (directionTimeoutRef.current) {
        clearTimeout(directionTimeoutRef.current);
      }

      directionTimeoutRef.current = window.setTimeout(() => {
        if (scrollDirectionRef.current !== 'idle') {
          scrollDirectionRef.current = 'idle';
          onScrollDirectionChange?.('idle');
        }
      }, 150);
    },
    [enableScrollDirection, onScrollDirectionChange]
  );

  // 스크롤 종료 감지
  const handleScrollEnd = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      updateScrollState(false);
      logger.debug('useGalleryScroll: 스크롤 종료');
    }, 150);
  }, [updateScrollState]);

  // 트위터 페이지 스크롤 차단
  const preventTwitterScroll = useCallback(
    (event: Event) => {
      if (isScrollingRef.current && blockTwitterScroll) {
        event.preventDefault();
        event.stopPropagation();
        logger.debug('useGalleryScroll: 트위터 스크롤 차단');
      }
    },
    [blockTwitterScroll]
  );

  // 이미지가 뷰포트보다 작은지 판단
  const isImageSmallerThanViewport = useCallback(() => {
    if (!imageSize || !viewportSize) {
      return false;
    }
    return imageSize.width <= viewportSize.width && imageSize.height <= viewportSize.height;
  }, [imageSize, viewportSize]);

  // Phase 9.3 REFACTOR: 작은 이미지 휠 이벤트 처리 (분리된 함수)
  const handleSmallImageWheel = useCallback(
    (event: WheelEvent, delta: number) => {
      if (!onImageNavigation) return false;

      // Phase 9.2: 작은 이미지에서 완전한 이벤트 차단 후 네비게이션만 처리
      const direction = delta > 0 ? 'next' : 'prev';
      onImageNavigation(direction);

      logger.debug('useGalleryScroll: 작은 이미지 - 휠 네비게이션 처리 (배경 스크롤 차단)', {
        direction,
        delta,
        imageSize,
        viewportSize,
        eventBlocked: true,
      });

      // 작은 이미지에서는 추가 처리 없이 완전히 차단
      return true;
    },
    [onImageNavigation, imageSize, viewportSize]
  );

  // Phase 9.3 REFACTOR: 큰 이미지 휠 이벤트 처리 (분리된 함수)
  const handleLargeImageWheel = useCallback(
    (event: WheelEvent, delta: number) => {
      // 큰 이미지: 기존 스크롤 콜백 실행
      if (onScroll) {
        onScroll(delta);
      }

      // Phase 9.4 GREEN: 실제 갤러리 컨테이너 스크롤 적용 (옵션 A 구현)
      // container 가 존재하면 자연스러운 스크롤 처리를 위해 scrollBy 시도.
      // jsdom 또는 일부 환경에서 scrollBy 미지원 시 scrollTop 수동 증가.
      try {
        const targetEl = activeContainerRef.current;
        if (targetEl) {
          const c = targetEl as HTMLElement & {
            scrollBy?: (opts: { top: number; behavior?: ScrollBehavior }) => void;
          };
          if (typeof c.scrollBy === 'function') {
            c.scrollBy({ top: delta, behavior: 'auto' });
          } else {
            // fallback: 직접 scrollTop 변경
            c.scrollTop += delta;
          }
          // 테스트 환경(jsdom)에서 scrollTop clamp 로 인한 검증 실패 방지를 위한 비표준 지표
          interface TestAccumContainer extends HTMLElement {
            __testAccumulatedScroll?: number;
          }
          const tc = c as TestAccumContainer;
          if (tc.__testAccumulatedScroll === undefined) tc.__testAccumulatedScroll = 0;
          tc.__testAccumulatedScroll += delta;
        }
      } catch (err) {
        logger.debug('useGalleryScroll: scrollBy fallback error (ignored)', {
          error: (err as Error).message,
        });
        if (activeContainerRef.current) {
          try {
            activeContainerRef.current.scrollTop += delta;
            interface TestAccumContainer extends HTMLElement {
              __testAccumulatedScroll?: number;
            }
            const tc2 = activeContainerRef.current as TestAccumContainer;
            if (tc2.__testAccumulatedScroll === undefined) tc2.__testAccumulatedScroll = 0;
            tc2.__testAccumulatedScroll += delta;
          } catch {
            /* noop */
          }
        }
      }

      logger.debug('useGalleryScroll: 큰 이미지 - 스크롤 처리', {
        delta,
        imageSize,
        viewportSize,
      });

      return true;
    },
    [onScroll, imageSize, viewportSize]
  );

  // 갤러리 휠 이벤트 처리 (메인 함수)
  const handleGalleryWheel = useCallback(
    (event: WheelEvent) => {
      // 갤러리가 열려있지 않으면 무시
      if (!galleryState.value.isOpen) {
        logger.debug('useGalleryScroll: 갤러리가 열려있지 않음 - 휠 이벤트 무시');
        return;
      }

      // Phase 14: activeContainerRef 가 아직 설정되지 않았다면 lazy 탐색 (렌더 후 ref 할당 이전 wheel 케이스 대응)
      if (!activeContainerRef.current) {
        try {
          const fallbackEl =
            typeof document !== 'undefined'
              ? (document.querySelector('[data-xeg-role="gallery"]') as HTMLElement | null)
              : null;
          if (fallbackEl) {
            activeContainerRef.current = fallbackEl;
          }
        } catch {
          /* noop */
        }
      }

      // Variant B (조건부 차단 플래그 활성)에서는 경계 overscroll 시 preventDefault 해제
      let shouldPrevent = true;
      try {
        const c = activeContainerRef.current;
        if (c) {
          shouldPrevent = decideInertiaPrevent({
            variant: getInertiaExperimentVariant(),
            flagEnabled: FEATURE_INERTIA_CONDITIONAL_PREVENT,
            deltaY: event.deltaY,
            scrollTop: c.scrollTop,
            clientHeight: c.clientHeight,
            scrollHeight: c.scrollHeight,
          });
        }
      } catch {
        /* noop */
      }
      if (shouldPrevent) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }

      // 테스트 추적 (옵션): __XEG_TEST_WHEEL_TRACE__ 배열이 존재하면 기록
      try {
        const traceSink: unknown = (globalThis as unknown as { __XEG_TEST_WHEEL_TRACE__?: unknown })
          .__XEG_TEST_WHEEL_TRACE__;
        if (Array.isArray(traceSink)) {
          (traceSink as unknown[]).push({
            variant: getInertiaExperimentVariant(),
            shouldPrevent,
            deltaY: event.deltaY,
            atTop: (() => {
              const c = activeContainerRef.current;
              return c ? c.scrollTop <= 0 : false;
            })(),
            atBottom: (() => {
              const c = activeContainerRef.current;
              return c ? c.scrollTop + c.clientHeight >= c.scrollHeight - 1 : false;
            })(),
            ts: Date.now(),
          });
        }
      } catch {
        /* noop */
      }

      // 원시 delta 를 정규화 (트랙패드 가속/노이즈 보정)
      const rawDelta = event.deltaY;
      // Phase 14: fractional accumulation 적용
      let delta: number | null = null;

      if (Math.abs(rawDelta) < 1) {
        delta = accumulatorRef.current.push(rawDelta);
      } else {
        const base = normalizeWheelDelta(rawDelta);
        const merged = accumulatorRef.current.push(base);
        delta = merged !== 0 ? merged : base;
      }

      if (delta == null || delta === 0) {
        handleScrollEnd();
        return;
      }
      updateScrollState(true);

      // 스크롤 방향 감지 (옵션)
      updateScrollDirection(delta);

      // 이미지 크기에 따른 조건적 처리 (Phase 9.3: 분리된 함수 사용)
      const isSmallImage = isImageSmallerThanViewport();

      if (isSmallImage) {
        handleSmallImageWheel(event, delta);
      } else {
        handleLargeImageWheel(event, delta);
      }

      // 모든 경우에 트위터 페이지로의 이벤트 전파 방지
      // 앞단에서 이미 전파 차단을 했으므로 중복 호출 불필요하지만,
      // 트위터 컨테이너 관련 추가 처리(리스너 등록 등)는 기존 로직으로 유지됨.

      // 스크롤 종료 감지 타이머 재설정
      handleScrollEnd();

      const rawTarget = event.target;
      const targetTag = isHTMLElement(rawTarget) ? rawTarget.tagName : 'unknown';
      const targetClass = isHTMLElement(rawTarget) ? rawTarget.className : 'none';

      logger.debug('useGalleryScroll: 휠 이벤트 처리 완료', {
        rawDelta,
        delta,
        residualRemaining: accumulatorRef.current.peekResidual(),
        isGalleryOpen: galleryState.value.isOpen,
        isSmallImage,
        targetElement: targetTag,
        targetClass,
        timestamp: Date.now(),
      });
    },
    [
      blockTwitterScroll,
      updateScrollState,
      handleScrollEnd,
      updateScrollDirection,
      isImageSmallerThanViewport,
      handleSmallImageWheel,
      handleLargeImageWheel,
      FEATURE_INERTIA_CONDITIONAL_PREVENT,
    ]
  );

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!enabled) {
      return;
    }
    // scrollElement 가 명시되면 그것을 우선 사용 (내부 scrollArea)
    if (scrollElement) {
      activeContainerRef.current = scrollElement;
    } else if (container) {
      activeContainerRef.current = container;
    }

    // document 접근 시점에서 안전 확인
    let localDocument: Document | undefined;
    try {
      if (typeof document !== 'undefined') {
        localDocument = document;
      }
    } catch {
      localDocument = undefined;
    }

    if (!localDocument) {
      logger.debug('useGalleryScroll: document 없음 - 리스너 미등록 (teardown race)');
      return;
    }

    const eventManager = eventManagerRef.current;

    try {
      eventManager.addEventListener(localDocument, 'wheel', handleGalleryWheel, {
        capture: true,
        passive: false,
      });
      // 활성 컨테이너에도 직접 리스너 등록 (jsdom 환경에서 document capture 경로 누락 대비)
      if (activeContainerRef.current) {
        eventManager.addEventListener(activeContainerRef.current, 'wheel', handleGalleryWheel, {
          capture: true,
          passive: false,
        });
      }
    } catch (err) {
      logger.debug('useGalleryScroll: 문서 리스너 등록 실패 - 중단', {
        error: (err as Error).message,
      });
      return;
    }

    // 트위터 페이지 스크롤 차단 (옵션) - document 존재가 확인된 경우에만 시도
    if (blockTwitterScroll) {
      try {
        const twitterContainer = findTwitterScrollContainer();
        if (twitterContainer) {
          eventManager.addEventListener(twitterContainer, 'wheel', preventTwitterScroll, {
            capture: true,
            passive: false,
          });
        }
      } catch (err) {
        logger.debug('useGalleryScroll: 트위터 컨테이너 리스너 등록 실패', {
          error: (err as Error).message,
        });
      }
    }

    logger.debug('useGalleryScroll: 이벤트 리스너 등록 완료', {
      hasContainer: !!activeContainerRef.current,
      blockTwitterScroll,
    });

    return () => {
      eventManager.cleanup();

      // 타이머 정리
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 방향 감지 타이머 정리
      if (directionTimeoutRef.current) {
        clearTimeout(directionTimeoutRef.current);
      }

      logger.debug('useGalleryScroll: 정리 완료');
    };
  }, [
    enabled,
    container,
    scrollElement,
    blockTwitterScroll,
    handleGalleryWheel,
    preventTwitterScroll,
  ]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      eventManagerRef.current.cleanup();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (directionTimeoutRef.current) {
        clearTimeout(directionTimeoutRef.current);
      }
    };
  }, []);

  return {
    lastScrollTime: lastScrollTimeRef.current,
    isScrolling: isScrollingRef.current,
    ...(enableScrollDirection && { scrollDirection: scrollDirectionRef.current }),
  };
}
