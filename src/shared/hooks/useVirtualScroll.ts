/**
 * @fileoverview 가상 스크롤링 커스텀 훅
 * @description 가상 스크롤링 기능을 위한 React 훅
 */

import { logger } from '@shared/logging';
import { getPreactHooks } from '@shared/external/vendors';
import type { MediaInfo } from '@shared/types';
import { ScrollHelper, type RenderRange } from '../utils/virtual-scroll';

/**
 * 가상 스크롤 훅 옵션
 */
export interface UseVirtualScrollOptions {
  /** 각 아이템의 높이 (px) */
  itemHeight: number;
  /** 뷰포트 높이 (px) */
  viewportHeight: number;
  /** 렌더링 버퍼 크기 (아이템 개수) */
  bufferSize: number;
  /** 가상 스크롤링 활성화 임계값 */
  threshold?: number;
  /** 아이템 배열 */
  items: MediaInfo[];
  /** 스크롤 컨테이너 참조 */
  containerRef: { current: HTMLElement | null };
  /** 가상 스크롤링 활성화 여부 */
  enabled?: boolean;
}

/**
 * 가상 스크롤 훅 반환 타입
 */
export interface UseVirtualScrollReturn {
  /** 렌더링할 아이템들 */
  visibleItems: MediaInfo[];
  /** 렌더링 범위 정보 */
  renderRange: RenderRange;
  /** 가상 스크롤링 활성화 여부 */
  isVirtualScrolling: boolean;
  /** 스크롤 컨테이너 스타일 */
  containerStyle: {
    height: string;
    overflow: string;
  };
  /** 아이템 리스트 스타일 */
  listStyle: {
    height: string;
    paddingTop: string;
    position: string;
  };
  /** 스크롤 이벤트 핸들러 */
  onScroll: (event: Event) => void;
}

/**
 * 가상 스크롤링 커스텀 훅
 * 대용량 리스트의 성능 최적화를 위한 가상 스크롤링을 제공합니다.
 *
 * @param options 가상 스크롤 옵션
 * @returns 가상 스크롤 상태 및 핸들러
 */
export function useVirtualScroll(options: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const { useState, useEffect, useCallback, useMemo, useRef } = getPreactHooks();

  const {
    items,
    containerRef,
    enabled = true,
    itemHeight,
    viewportHeight,
    bufferSize,
    threshold = 50,
  } = options;

  // 가상 스크롤 매니저 초기화
  const manager = useMemo(
    () =>
      new ScrollHelper({
        itemHeight,
        viewportHeight,
        bufferSize,
        threshold,
      }),
    [itemHeight, viewportHeight, bufferSize, threshold]
  );

  // 스크롤 상태
  const [scrollTop, setScrollTop] = useState(0);
  const [renderRange, setRenderRange] = useState<RenderRange>({
    start: 0,
    end: Math.min(items.length, Math.ceil(viewportHeight / itemHeight) + bufferSize * 2),
    totalHeight: items.length * itemHeight,
    offsetTop: 0,
  });

  // 스크롤 이벤트 처리용 throttle 참조
  const scrollTimeoutRef = useRef<number | null>(null);

  // 가상 스크롤링 사용 여부
  const isVirtualScrolling = useMemo(() => {
    return enabled && manager.shouldUseVirtualScrolling(items.length);
  }, [enabled, manager, items.length]);

  // 렌더링 범위 업데이트
  const updateRenderRange = useCallback(
    (newScrollTop: number) => {
      if (!isVirtualScrolling) {
        // 가상 스크롤링이 비활성화된 경우 모든 아이템 렌더링
        setRenderRange({
          start: 0,
          end: items.length,
          totalHeight: items.length * itemHeight,
          offsetTop: 0,
        });
        return;
      }

      const visibleRange = manager.getVisibleRange(newScrollTop, items.length);
      const newRenderRange = manager.getRenderRange(newScrollTop, items.length);

      setRenderRange(newRenderRange);

      logger.debug('가상 스크롤 범위 업데이트', {
        scrollTop: newScrollTop,
        visibleRange,
        renderRange: newRenderRange,
      });
    },
    [isVirtualScrolling, manager, items.length, itemHeight]
  );

  // 스크롤 이벤트 핸들러
  const onScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      const newScrollTop = target.scrollTop;

      setScrollTop(newScrollTop);

      // Throttle 적용
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        updateRenderRange(newScrollTop);
      }, 16); // ~60fps
    },
    [updateRenderRange]
  );

  // 초기 렌더링 범위 설정
  useEffect(() => {
    updateRenderRange(0);
  }, [updateRenderRange]);

  // 컨테이너 크기 변경 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const newViewportHeight = container.clientHeight;
      manager.updateConfig({ viewportHeight: newViewportHeight });
      updateRenderRange(scrollTop);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, manager, scrollTop, updateRenderRange]);

  // 정리
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 보이는 아이템들
  const visibleItems = useMemo(() => {
    if (!isVirtualScrolling) {
      return items;
    }
    return items.slice(renderRange.start, renderRange.end);
  }, [isVirtualScrolling, items, renderRange.start, renderRange.end]);

  // 스타일 객체들
  const containerStyle = useMemo(
    () => ({
      height: `${viewportHeight}px`,
      overflow: 'auto' as const,
    }),
    [viewportHeight]
  );

  const listStyle = useMemo(
    () => ({
      height: `${renderRange.totalHeight}px`,
      paddingTop: `${renderRange.offsetTop}px`,
      position: 'relative' as const,
    }),
    [renderRange.totalHeight, renderRange.offsetTop]
  );

  return {
    visibleItems,
    renderRange,
    isVirtualScrolling,
    containerStyle,
    listStyle,
    onScroll,
  };
}
