/**
 * useVirtualWindow (Phase 2 - RED/GREEN 준비용 스켈레톤)
 * 아직 실제 virtualization 미적용: 테스트에서 실패(RED)를 유도할 계산 로직만 제공
 */
import { getPreactHooks, getPreactSignals } from '@shared/external/vendors';
import { FEATURE_VIRTUAL_SCROLL } from '@/constants';

export interface VirtualWindowOptions {
  total: number;
  itemHeightEstimate: number; // px 추정 (고정 높이 가정 초기)
  overscan: number; // 상/하 버퍼 아이템 수
  scrollContainer: HTMLElement | null;
}

export interface VirtualWindowState {
  start: number;
  end: number;
  offsetTop: number; // 상단 spacer 높이(px)
  virtualHeight: number; // 전체 가상 높이(px)
  renderedItems: number[]; // 현재 렌더링된 아이템 인덱스들
}

export const DEFAULT_VIRTUAL_WINDOW: VirtualWindowState = {
  start: 0,
  end: 0,
  offsetTop: 0,
  virtualHeight: 0,
  renderedItems: [],
};

/**
 * 단순 범위 계산 유틸 (후속 REFACTOR에서 분리 예정)
 */
export function calcWindowRange(
  scrollTop: number,
  viewportHeight: number,
  {
    total,
    itemHeightEstimate,
    overscan,
  }: Pick<VirtualWindowOptions, 'total' | 'itemHeightEstimate' | 'overscan'>
): VirtualWindowState {
  if (total <= 0 || itemHeightEstimate <= 0) return { ...DEFAULT_VIRTUAL_WINDOW };
  const itemsPerViewport = Math.ceil(viewportHeight / itemHeightEstimate);
  const start = Math.max(0, Math.floor(scrollTop / itemHeightEstimate) - overscan);
  const end = Math.min(total - 1, start + itemsPerViewport + overscan * 2);
  const offsetTop = start * itemHeightEstimate;
  const virtualHeight = total * itemHeightEstimate;
  const renderedItems = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return { start, end, offsetTop, virtualHeight, renderedItems };
}

/**
 * Hook 스켈레톤: 현재는 FEATURE_VIRTUAL_SCROLL 활성화 여부와 관계없이
 * 전체 아이템을 그대로 렌더하도록 (start=0, end=total-1) 설정하여
 * RED 테스트에서 실패(실제 DOM 축소 안됨)를 유도.
 */
export function useVirtualWindow(options: VirtualWindowOptions): VirtualWindowState {
  const { useEffect, useState, useCallback } = getPreactHooks();
  const { signal } = getPreactSignals();
  const rangeSignal = signal<VirtualWindowState>({ ...DEFAULT_VIRTUAL_WINDOW });
  const [state, setState] = useState<VirtualWindowState>(rangeSignal.value);

  const recalc = useCallback(
    (scrollTop: number, viewportHeight: number) => {
      if (!FEATURE_VIRTUAL_SCROLL) {
        // 플래그 비활성: 전체 범위
        const full: VirtualWindowState = {
          start: 0,
          end: options.total > 0 ? options.total - 1 : 0,
          offsetTop: 0,
          virtualHeight: options.total * (options.itemHeightEstimate || 1),
          renderedItems: Array.from({ length: options.total }, (_, i) => i),
        };
        rangeSignal.value = full;
        setState(full);
        return;
      }
      const next = calcWindowRange(scrollTop, viewportHeight, {
        total: options.total,
        itemHeightEstimate: options.itemHeightEstimate,
        overscan: options.overscan,
      });
      rangeSignal.value = next;
      setState(next);
    },
    [options.total, options.itemHeightEstimate, options.overscan]
  );

  useEffect(() => {
    const container = options.scrollContainer;
    if (!container) {
      // no container yet → 기본값 처리
      recalc(0, typeof window !== 'undefined' ? window.innerHeight : 0);
      return;
    }
    const handle = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight || window.innerHeight;
      recalc(scrollTop, viewportHeight);
    };
    handle(); // 초기 계산
    container.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    return () => {
      container.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, [options.scrollContainer, recalc]);

  // total 변경 시 재계산
  useEffect(() => {
    recalc(
      options.scrollContainer?.scrollTop ?? 0,
      options.scrollContainer?.clientHeight ??
        (typeof window !== 'undefined' ? window.innerHeight : 0)
    );
  }, [options.total, recalc]);

  return state;
}

/** 테스트에서 플래그 강제 토글을 위해 노출 (prod tree-shaking 무관) */
export function __debugForceVirtualFlag(on: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__XEG_FORCE_FLAGS__ = {
    ...(globalThis as unknown as { __XEG_FORCE_FLAGS__?: Record<string, unknown> })
      .__XEG_FORCE_FLAGS__,
    FEATURE_VIRTUAL_SCROLL: on,
  };
}
