/**
 * @fileoverview Computes the most suitable center-visible gallery item index.
 */
import { getPreactHooks, getPreactSignals } from '@shared/external/vendors';
import { computeCenterScore, resolveBestCenter } from '@/features/gallery/utils/center-scoring';
import { navigateToItem } from '@shared/state/signals/gallery.signals';
import {
  navigationIntentState,
  resetIntent,
} from '@shared/state/signals/navigation-intent.signals';

interface UseVisibleCenterItemOptions {
  containerRef: { current: HTMLElement | null };
  itemSelector?: string;
  enabled?: boolean;
}

interface UseVisibleCenterItemReturn {
  centerIndex: number;
  recompute: () => void;
}

export function useVisibleCenterItem({
  containerRef,
  itemSelector = '[data-xeg-role="gallery-item"]',
  enabled = true,
}: UseVisibleCenterItemOptions): UseVisibleCenterItemReturn {
  const { useState, useEffect, useCallback, useRef } = getPreactHooks();
  // 초기 렌더 시 동기적으로 center 후보 계산하여 첫 프레임에서 -1 깜빡임 최소화
  let initialIndex = -1;
  if (enabled && containerRef.current) {
    try {
      const container = containerRef.current;
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
      if (items.length > 0) {
        const viewportTop = container.scrollTop;
        const viewportHeight = container.clientHeight;
        const viewportCenter = viewportTop + viewportHeight / 2;
        for (let i = 0; i < items.length; i++) {
          const el = items[i];
          const rect = el.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const top = rect.top - containerRect.top + viewportTop;
          const bottom = top + rect.height;
          const visibleTop = Math.max(top, viewportTop);
          const visibleBottom = Math.min(bottom, viewportTop + viewportHeight);
          const visible = Math.max(0, visibleBottom - visibleTop);
          if (visible <= 0) continue;
          const visibilityRatio = visible / rect.height;
          const elementCenter = top + rect.height / 2;
          const dist = Math.abs(elementCenter - viewportCenter);
          const normDist = dist / (viewportHeight / 2);
          // 초기 루프에서는 상세 점수 비교 없이 첫 가시 아이템 선택 (정밀 점수는 recompute에서 처리)
          computeCenterScore({ visibilityRatio, normalizedDistance: normDist });
          // 첫 가시 아이템이 가장 중심일 확률이 높으므로 즉시 할당 후 루프 종료 (단순화)
          initialIndex = i;
          // 고도 점수 비교 로직은 전체 recompute 루틴에서 처리되므로 여기선 조기 종료
          break;
        }
      }
    } catch {
      // ignore sync init errors (jsdom metrics 등)
    }
  }
  const { effect } = getPreactSignals();
  const [centerIndex, setCenterIndex] = useState(initialIndex);
  const itemsRef = useRef<HTMLElement[]>([]);
  const rafIdRef = useRef<number | null>(null);

  const recompute = useCallback(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
    itemsRef.current = items;
    if (items.length === 0) {
      setCenterIndex(-1);
      return;
    }
    // viewportTop: container scroll offset
    const viewportTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const viewportCenter = viewportTop + viewportHeight / 2;
    const candidates: Array<{ index: number; score: number }> = [];
    items.forEach((el, idx) => {
      try {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        // Translate element rect into scroll-space coordinates (0 at scrollTop=0)
        const top = rect.top - containerRect.top + viewportTop;
        const bottom = top + rect.height;
        const visibleTop = Math.max(top, viewportTop);
        const visibleBottom = Math.min(bottom, viewportTop + viewportHeight);
        const visible = Math.max(0, visibleBottom - visibleTop);
        if (visible <= 0) return;
        const visibilityRatio = visible / rect.height;
        const elementCenter = top + rect.height / 2;
        const dist = Math.abs(elementCenter - viewportCenter);
        const normDist = dist / (viewportHeight / 2);
        const score = computeCenterScore({ visibilityRatio, normalizedDistance: normDist });
        candidates.push({ index: idx, score });
      } catch {
        /* ignore */
      }
    });
    const best = resolveBestCenter({ candidates, tieBreak: 'lower-index' });
    if (best.index === -1 && items.length > 0) {
      // Fallback: at least ensure first visible block is selected to avoid lingering -1
      setCenterIndex(0);
    } else {
      setCenterIndex(best.index);
    }
  }, [containerRef, itemSelector, enabled]);

  useEffect(() => {
    if (!enabled) return;
    recompute();
    return () => {
      if (rafIdRef.current != null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [recompute, enabled]);

  // v2: scroll / resize 이벤트 기반 즉시(rAF 보조) 재계산(이전 polling 제거)
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;
    let pending = false;
    const schedule = () => {
      if (pending) return;
      pending = true;
      // requestAnimationFrame 사용으로 레이아웃 안정 후 계산
      rafIdRef.current = requestAnimationFrame(() => {
        pending = false;
        recompute();
      });
    };
    const handleScroll = () => schedule();
    const handleResize = () => schedule();
    container.addEventListener('scroll', handleScroll, { passive: true });
    // window resize 는 viewport 변화에 따른 center 재계산 필요
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [enabled, containerRef, recompute]);

  effect(() => {
    // centerIndex 변화 시 user-scroll intent인 경우 galleryState.currentIndex 동기화
    const intent = navigationIntentState.value.intent;
    if (intent === 'user-scroll' && centerIndex >= 0) {
      // P14R4: 적응형 타이머 - 마지막 wheel 간격 기반 동적 지연
      const lastUserScrollAt = navigationIntentState.value.lastUserScrollAt;
      const timeSinceLastScroll = Date.now() - lastUserScrollAt;

      // 연속 스크롤 중(120ms 이내)이면 타이머 연장, 아니면 단축
      const adaptiveDelay = timeSinceLastScroll < 120 ? 300 : 160;

      const timeoutId = setTimeout(() => {
        if (navigationIntentState.value.intent === 'user-scroll') {
          navigateToItem(centerIndex);
          resetIntent(); // 동기화 후 intent 리셋
        }
      }, adaptiveDelay);

      return () => clearTimeout(timeoutId);
    }
  });

  return { centerIndex, recompute };
}
