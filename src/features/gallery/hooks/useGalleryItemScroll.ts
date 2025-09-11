/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 통합된 갤러리 아이템 스크롤 훅
 * @description 갤러리 아이템들 간의 스크롤을 관리하는 단순하고 신뢰할 수 있는 훅
 * @version 1.0.0 - 초기 구현
 */

import { getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

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
  }: UseGalleryItemScrollOptions = {}
): UseGalleryItemScrollReturn {
  const lastScrolledIndexRef = useRef<number>(-1);
  const scrollTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);

  /**
   * 특정 인덱스의 아이템으로 스크롤
   */
  const scrollToItem = useCallback(
    async (index: number): Promise<void> => {
      if (!enabled || !containerRef.current || index < 0 || index >= totalItems) {
        logger.debug('useGalleryItemScroll: 스크롤 조건 불충족', {
          enabled,
          hasContainer: !!containerRef.current,
          index,
          totalItems,
        });
        return;
      }

      try {
        const container = containerRef.current;

        // itemsList 컨테이너 찾기
        const itemsList = container.querySelector('[data-xeg-role="items-list"]') as HTMLElement;
        if (!itemsList) {
          logger.warn('useGalleryItemScroll: items-list 컨테이너를 찾을 수 없음');
          return;
        }

        const targetElement = itemsList.children[index] as HTMLElement;

        if (!targetElement) {
          logger.warn('useGalleryItemScroll: 타겟 요소를 찾을 수 없음', {
            index,
            totalItems,
            itemsListChildrenCount: itemsList.children.length,
          });
          return;
        }

        // prefers-reduced-motion 확인
        const actualBehavior =
          respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : behavior;

        // scrollIntoView 사용 - 미디어 요소 의존성 없음
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
        retryCountRef.current = 0; // reset retry counter on success

        logger.debug('useGalleryItemScroll: 스크롤 완료', {
          index,
          behavior: actualBehavior,
          block: alignToCenter ? 'center' : block,
          offset,
          timestamp: Date.now(),
        });

        // smooth scroll의 경우 애니메이션 완료 대기
        if (actualBehavior === 'smooth') {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        logger.error('useGalleryItemScroll: 스크롤 실패', { index, error });

        // Retry logic (max 1)
        if (retryCountRef.current < 1) {
          retryCountRef.current++;
          logger.debug('useGalleryItemScroll: retry attempt', {
            index,
            retryCount: retryCountRef.current,
          });

          // Retry after confirming visibility via IntersectionObserver
          const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                observer.disconnect();
                setTimeout(() => scrollToItem(index), 50);
              }
            });
          });

          const targetElement = containerRef.current?.querySelector('[data-xeg-role="items-list"]')
            ?.children[index] as HTMLElement;
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
      logger.debug('useGalleryItemScroll: 이미 스크롤한 인덱스로 건너뜀', {
        currentIndex,
        lastScrolledIndex: lastScrolledIndexRef.current,
      });
      return;
    }

    // 이전 타이머 취소
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 디바운스 적용
    scrollTimeoutRef.current = window.setTimeout(() => {
      logger.debug('useGalleryItemScroll: 자동 스크롤 실행', {
        currentIndex,
        lastScrolledIndex: lastScrolledIndexRef.current,
      });
      scrollToCurrentItem();
    }, debounceDelay);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
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
