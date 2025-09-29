/**
 * @fileoverview useVisibleIndex — 현재 뷰포트(컨테이너)에서 가장 많이 보이는 갤러리 아이템의 인덱스를 계산하는 훅
 * @description IntersectionObserver 우선 + DOM rect 폴백. TypeScript strict.
 */

import type { Accessor } from 'solid-js';

import { getSolidCore } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

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
  readonly visibleIndex: number;
  /** Solid 컴포넌트에서 직접 구독 가능한 accessor */
  readonly visibleIndexAccessor: Accessor<number>;
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
  containerRef: Accessor<HTMLElement | null> | { current: HTMLElement | null },
  itemCount: number,
  options: UseVisibleIndexOptions = {}
): UseVisibleIndexResult {
  const { createMemo, createSignal, createEffect, onCleanup } = getSolidCore();

  const thresholdsMemo = createMemo<number[]>(() =>
    options.thresholds ? [...options.thresholds] : [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]
  );
  const rootMargin = options.rootMargin ?? '0px';
  const rafCoalesce = options.rafCoalesce ?? true;

  const clampIndex = (candidate: number): number => {
    if (itemCount <= 0 || candidate < 0) {
      return -1;
    }
    return Math.min(candidate, itemCount - 1);
  };

  const [visibleIndexSignal, setVisibleIndex] = createSignal<number>(-1);

  let intersectionObserver: IntersectionObserver | null = null;
  const ratios = new Map<number, number>();
  let framePending = false;

  const resolveContainer = (): HTMLElement | null => {
    if (typeof containerRef === 'function') {
      return (containerRef as Accessor<HTMLElement | null>)();
    }
    return containerRef.current ?? null;
  };

  const updateVisibleIndex = (next: number) => {
    setVisibleIndex(prev => (prev !== next ? next : prev));
  };

  const updateByRects = () => {
    const container = resolveContainer();
    if (!container) {
      updateVisibleIndex(-1);
      return;
    }

    const items = queryGalleryItems(container);
    if (!items.length) {
      updateVisibleIndex(-1);
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

    updateVisibleIndex(clampIndex(pickBestIndex(scored)));
  };

  const scheduleRectUpdate = () => {
    if (!rafCoalesce) {
      updateByRects();
      return;
    }

    if (framePending) {
      return;
    }

    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      updateByRects();
    });
  };

  const disconnectObserver = () => {
    if (!intersectionObserver) {
      return;
    }
    try {
      intersectionObserver.disconnect();
    } catch {
      /* noop */
    }
    intersectionObserver = null;
    ratios.clear();
  };

  const observeWithIntersectionObserver = (
    container: HTMLElement,
    items: HTMLElement[],
    thresholds: readonly number[]
  ) => {
    disconnectObserver();

    intersectionObserver = new IntersectionObserver(
      entries => {
        const containerRect = container.getBoundingClientRect();

        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const idx = Number(target.getAttribute('data-index') ?? '-1');
          if (idx < 0) continue;

          const rect = target.getBoundingClientRect();
          const ratio = Math.max(
            entry.intersectionRatio ?? 0,
            computeVerticalIntersectionRatio(containerRect, rect)
          );
          ratios.set(idx, ratio);
        }

        const currentItems = queryGalleryItems(container);
        const scored: Array<{ index: number; ratio: number; dist: number }> = [];
        const currentContainerRect = container.getBoundingClientRect();

        for (const el of currentItems) {
          const idx = Number(el.getAttribute('data-index') ?? '-1');
          if (idx < 0) continue;
          const ratio = ratios.get(idx) ?? 0;
          const dist = distanceToViewportCenter(currentContainerRect, el.getBoundingClientRect());
          scored.push({ index: idx, ratio, dist });
        }

        updateVisibleIndex(clampIndex(pickBestIndex(scored)));
      },
      { root: container, rootMargin, threshold: [...thresholds] }
    );

    for (const el of items) {
      intersectionObserver.observe(el);
    }
  };

  createEffect(() => {
    const container = resolveContainer();
    const thresholds = thresholdsMemo();

    if (!container) {
      updateVisibleIndex(-1);
      return;
    }

    const items = queryGalleryItems(container);
    if (!items.length) {
      updateVisibleIndex(-1);
      return;
    }

    const hasIntersectionObserver =
      typeof window !== 'undefined' && 'IntersectionObserver' in window;

    if (!hasIntersectionObserver) {
      updateByRects();

      const onScroll = () => scheduleRectUpdate();
      const onResize = () => scheduleRectUpdate();

      container.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });

      onCleanup(() => {
        container.removeEventListener('scroll', onScroll as EventListener);
        window.removeEventListener('resize', onResize as EventListener);
      });
      return;
    }

    try {
      observeWithIntersectionObserver(container, items, thresholds);
    } catch (error) {
      logger.warn('useVisibleIndex: IntersectionObserver 설정 실패, 폴백 사용', error);
      updateByRects();
      const onScroll = () => scheduleRectUpdate();
      const onResize = () => scheduleRectUpdate();
      container.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      onCleanup(() => {
        container.removeEventListener('scroll', onScroll as EventListener);
        window.removeEventListener('resize', onResize as EventListener);
      });
      return;
    }

    onCleanup(() => {
      disconnectObserver();
    });
  });

  const recompute = () => {
    updateByRects();
  };

  onCleanup(() => {
    disconnectObserver();
  });

  return {
    get visibleIndex() {
      return visibleIndexSignal();
    },
    visibleIndexAccessor: visibleIndexSignal,
    recompute,
  };
}

export default useGalleryVisibleIndex;

/**
 * Legacy useVisibleIndex hook removed during Solid migration.
 */

export {};
