/**
 * @fileoverview useVisibleIndex — 현재 뷰포트(컨테이너)에서 가장 많이 보이는 갤러리 아이템의 인덱스를 계산하는 훅
 * @description IntersectionObserver 우선 + DOM rect 폴백. TypeScript strict.
 */

import { getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

const { useCallback, useEffect, useMemo, useRef, useState } = getPreactHooks();

export interface UseVisibleIndexOptions {
  /** 관측 임계값들. 기본값은 0~1 사이 간격 값 */
  thresholds?: number[];
  /** rootMargin 설정 (IntersectionObserver) */
  rootMargin?: string;
  /** 업데이트를 requestAnimationFrame으로 코얼레싱 */
  rafCoalesce?: boolean;
}

export interface UseVisibleIndexResult {
  /** 가시성 기준으로 선택된 인덱스. 없으면 -1 */
  visibleIndex: number;
  /** 강제 재계산 트리거 (테스트/희귀 케이스 용) */
  recompute: () => void;
}

/**
 * 주어진 컨테이너 내부의 갤러리 아이템(NodeList)을 조회
 */
function queryGalleryItems(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const root = container.querySelector(
    '[data-xeg-role="items-container"], [data-xeg-role="items-list"]'
  );
  if (!root) return [];
  const nodes = Array.from(
    (root as HTMLElement).querySelectorAll('[data-xeg-role="gallery-item"]')
  ) as HTMLElement[];
  return nodes;
}

/**
 * rect 기반 교차 비율 계산 (폴백)
 * containerRect와 itemRect의 세로 교차 비율(0~1)을 반환
 */
function computeVerticalIntersectionRatio(containerRect: DOMRect, itemRect: DOMRect): number {
  const top = Math.max(containerRect.top, itemRect.top);
  const bottom = Math.min(containerRect.bottom, itemRect.bottom);
  const visible = Math.max(0, bottom - top);
  const height = Math.max(1, itemRect.height || 1);
  return Math.max(0, Math.min(1, visible / height));
}

/**
 * tie-breaker: 뷰포트(컨테이너) 중앙에 더 가까운 아이템 우선
 */
function distanceToViewportCenter(containerRect: DOMRect, itemRect: DOMRect): number {
  const viewportCenter = containerRect.top + containerRect.height / 2;
  const itemCenter = itemRect.top + itemRect.height / 2;
  return Math.abs(itemCenter - viewportCenter);
}

/**
 * 보이는 아이템 인덱스를 선택하는 규칙
 * 1) intersectionRatio가 큰 순
 * 2) 동률이면 컨테이너 중앙과의 거리 작은 순
 */
function pickBestIndex(entries: Array<{ index: number; ratio: number; dist: number }>): number {
  if (!entries.length) return -1;
  entries.sort((a, b) => {
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    return a.dist - b.dist;
  });
  return entries[0]?.index ?? -1;
}

/**
 * useVisibleIndex 훅 구현
 */
export function useGalleryVisibleIndex(
  containerRef: { current: HTMLElement | null },
  itemCount: number,
  options: UseVisibleIndexOptions = {}
): UseVisibleIndexResult {
  const thresholds = useMemo(
    () => options.thresholds ?? [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1],
    [options.thresholds]
  );
  const rootMargin = options.rootMargin ?? '0px';
  const rafCoalesce = options.rafCoalesce ?? true;

  const [visibleIndex, setVisibleIndex] = useState<number>(-1);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const ratiosRef = useRef<Map<number, number>>(new Map());
  const framePendingRef = useRef(false);

  const updateByRects = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = queryGalleryItems(container);
    if (!items.length) {
      setVisibleIndex(-1);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const scored: Array<{ index: number; ratio: number; dist: number }> = [];
    for (const el of items) {
      const idxAttr = el.getAttribute('data-index');
      const idx = Number(idxAttr ?? '-1');
      if (idx < 0) continue;
      const rect = el.getBoundingClientRect();
      const ratio = computeVerticalIntersectionRatio(containerRect, rect);
      const dist = distanceToViewportCenter(containerRect, rect);
      scored.push({ index: idx, ratio, dist });
    }
    const best = pickBestIndex(scored);
    setVisibleIndex(prev => (prev !== best ? best : prev));
  }, [containerRef]);

  const scheduleRectUpdate = useCallback(() => {
    if (!rafCoalesce) {
      updateByRects();
      return;
    }
    if (framePendingRef.current) return;
    framePendingRef.current = true;
    requestAnimationFrame(() => {
      framePendingRef.current = false;
      updateByRects();
    });
  }, [rafCoalesce, updateByRects]);

  // IntersectionObserver 기반 업데이트
  useEffect(() => {
    const container = containerRef.current;
    const hasIO = typeof window !== 'undefined' && 'IntersectionObserver' in window;
    if (!container) return;

    const items = queryGalleryItems(container);
    if (!items.length) {
      setVisibleIndex(-1);
      return;
    }

    // IO 미지원 시 폴백으로 전환
    if (!hasIO) {
      // 초기 1회 + 스크롤/리사이즈에 반응
      updateByRects();
      const onScroll = () => scheduleRectUpdate();
      const onResize = () => scheduleRectUpdate();
      container.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      return () => {
        container.removeEventListener('scroll', onScroll as EventListener);
        window.removeEventListener('resize', onResize as EventListener);
      };
    }

    // IO 지원 경로
    ratiosRef.current.clear();
    const rootEl = container;
    try {
      ioRef.current = new IntersectionObserver(
        entries => {
          const containerRect = rootEl.getBoundingClientRect();
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            const idxAttr = target.getAttribute('data-index');
            const idx = Number(idxAttr ?? '-1');
            if (idx < 0) continue;
            // 일부 브라우저/폴리필은 intersectionRatio 대신 rect 비교가 더 안정적
            const rect = target.getBoundingClientRect();
            const ratio = Math.max(
              entry.intersectionRatio ?? 0,
              computeVerticalIntersectionRatio(containerRect, rect)
            );
            ratiosRef.current.set(idx, ratio);
          }

          // best pick
          const scored: Array<{ index: number; ratio: number; dist: number }> = [];
          const itemsNow = queryGalleryItems(containerRef.current);
          const containerNow = rootEl.getBoundingClientRect();
          for (const el of itemsNow) {
            const idx = Number(el.getAttribute('data-index') ?? '-1');
            if (idx < 0) continue;
            const ratio = ratiosRef.current.get(idx) ?? 0;
            const dist = distanceToViewportCenter(containerNow, el.getBoundingClientRect());
            scored.push({ index: idx, ratio, dist });
          }
          const best = pickBestIndex(scored);
          setVisibleIndex(prev => (prev !== best ? best : prev));
        },
        { root: rootEl, rootMargin, threshold: thresholds }
      );

      for (const el of items) {
        ioRef.current.observe(el);
      }
    } catch (err) {
      logger.warn('useVisibleIndex: IntersectionObserver 설정 실패, 폴백 사용', err);
      updateByRects();
      const onScroll = () => scheduleRectUpdate();
      const onResize = () => scheduleRectUpdate();
      container.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      return () => {
        container.removeEventListener('scroll', onScroll as EventListener);
        window.removeEventListener('resize', onResize as EventListener);
      };
    }

    return () => {
      try {
        ioRef.current?.disconnect();
      } catch {
        // ignore cleanup errors in test environments
      }
      ioRef.current = null;
      ratiosRef.current.clear();
    };
  }, [
    containerRef,
    itemCount,
    thresholds,
    rootMargin,
    rafCoalesce,
    updateByRects,
    scheduleRectUpdate,
  ]);

  // itemCount 변화 등으로 인한 강제 재계산 진입점
  const recompute = useCallback(() => {
    // 강제 재계산은 항상 rect 기반으로 수행하여 테스트에서도 결정론적으로 동작
    updateByRects();
  }, [updateByRects]);

  return { visibleIndex, recompute };
}

export default useGalleryVisibleIndex;
