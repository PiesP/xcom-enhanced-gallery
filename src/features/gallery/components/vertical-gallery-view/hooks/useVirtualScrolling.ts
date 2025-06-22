/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Virtual Scrolling Hook for Gallery
 * @description 대량의 미디어 아이템에 대한 가상 스크롤링을 제공하는 훅
 */

import { logger } from '@infrastructure/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';

const { useState, useEffect, useCallback, useRef, useMemo } = getPreactHooks();

export interface VirtualScrollItem {
  index: number;
  height: number;
  offset: number;
}

export interface UseVirtualScrollingOptions {
  itemCount: number;
  containerHeight: number;
  estimatedItemHeight: number;
  overscan?: number;
  enableVirtualization?: boolean;
  minItemsForVirtualization?: number;
}

export interface UseVirtualScrollingReturn {
  visibleItems: VirtualScrollItem[];
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  updateItemHeight: (index: number, height: number) => void;
  containerProps: {
    style: { height: string };
    onScroll: (event: Event) => void;
  };
  viewportProps: {
    style: { height: string; paddingTop: string };
  };
}

/**
 * 가상 스크롤링을 위한 커스텀 훅
 *
 * @param options - 가상 스크롤링 옵션
 * @returns 가상 스크롤링 관련 상태 및 메서드
 */
export function useVirtualScrolling({
  itemCount,
  containerHeight,
  estimatedItemHeight,
  overscan = 3,
  enableVirtualization = true,
  minItemsForVirtualization = 20,
}: UseVirtualScrollingOptions): UseVirtualScrollingReturn {
  // 스크롤 위치
  const [scrollTop, setScrollTop] = useState(0);

  // 아이템 높이 캐시
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLElement | null>(null);

  // 가상화 활성화 여부 결정
  const shouldVirtualize = useMemo(() => {
    return enableVirtualization && itemCount >= minItemsForVirtualization;
  }, [enableVirtualization, itemCount, minItemsForVirtualization]);

  // 아이템 위치 계산
  const itemPositions = useMemo(() => {
    const positions: VirtualScrollItem[] = [];
    let currentOffset = 0;

    for (let i = 0; i < itemCount; i++) {
      const height = itemHeightsRef.current.get(i) ?? estimatedItemHeight;
      positions.push({
        index: i,
        height,
        offset: currentOffset,
      });
      currentOffset += height;
    }

    return positions;
  }, [itemCount, estimatedItemHeight, scrollTop]); // scrollTop 추가로 높이 변경 시 재계산

  // 전체 높이 계산
  const totalHeight = useMemo(() => {
    if (itemPositions.length === 0) return 0;
    const lastItem = itemPositions[itemPositions.length - 1];
    if (!lastItem) return 0;
    return lastItem.offset + lastItem.height;
  }, [itemPositions]);

  // 보이는 아이템 계산
  const visibleItems = useMemo(() => {
    if (!shouldVirtualize) {
      return itemPositions;
    }

    const viewportStart = scrollTop;
    const viewportEnd = scrollTop + containerHeight;

    // 바이너리 서치로 시작/끝 인덱스 찾기
    const findStartIndex = (): number => {
      let left = 0;
      let right = itemPositions.length - 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const item = itemPositions[mid];

        if (item && item.offset + item.height >= viewportStart) {
          right = mid - 1;
        } else {
          left = mid + 1;
        }
      }

      return Math.max(0, left - overscan);
    };

    const findEndIndex = (): number => {
      let left = 0;
      let right = itemPositions.length - 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const item = itemPositions[mid];

        if (item && item.offset <= viewportEnd) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      return Math.min(itemPositions.length - 1, right + overscan);
    };

    const startIndex = findStartIndex();
    const endIndex = findEndIndex();

    return itemPositions.slice(startIndex, endIndex + 1);
  }, [itemPositions, scrollTop, containerHeight, shouldVirtualize, overscan]);

  // 스크롤 이벤트 처리
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (target) {
      setScrollTop(target.scrollTop);
    }
  }, []);

  // 특정 인덱스로 스크롤
  const scrollToIndex = useCallback(
    (index: number) => {
      if (!containerRef.current || index < 0 || index >= itemCount) {
        logger.warn('Invalid scroll index or container not found:', { index, itemCount });
        return;
      }

      const item = itemPositions[index];
      if (item) {
        containerRef.current.scrollTop = item.offset;
        logger.info('Scrolled to index:', { index, offset: item.offset });
      }
    },
    [itemPositions, itemCount]
  );

  // 아이템 높이 업데이트
  const updateItemHeight = useCallback((index: number, height: number) => {
    const currentHeight = itemHeightsRef.current.get(index);
    if (currentHeight !== height) {
      itemHeightsRef.current.set(index, height);
      logger.debug('Updated item height:', { index, height, previousHeight: currentHeight });
    }
  }, []);

  // 컨테이너 참조 업데이트
  useEffect(() => {
    const container = document.querySelector('.xeg-gallery-container') as HTMLElement;
    containerRef.current = container;
  }, []);

  // 컨테이너 속성
  const containerProps = useMemo(
    () => ({
      style: { height: `${containerHeight}px` },
      onScroll: handleScroll,
    }),
    [containerHeight, handleScroll]
  );

  // 뷰포트 속성 (가상화 시 패딩 적용)
  const viewportProps = useMemo(() => {
    if (!shouldVirtualize || visibleItems.length === 0) {
      return { style: { height: `${totalHeight}px`, paddingTop: '0px' } };
    }

    const firstVisibleItem = visibleItems[0];
    return {
      style: {
        height: `${totalHeight}px`,
        paddingTop: `${firstVisibleItem?.offset ?? 0}px`,
      },
    };
  }, [shouldVirtualize, visibleItems, totalHeight]);

  logger.debug('Virtual scrolling state:', {
    shouldVirtualize,
    itemCount,
    visibleItemsCount: visibleItems.length,
    scrollTop,
    totalHeight,
  });

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    updateItemHeight,
    containerProps,
    viewportProps,
  };
}
