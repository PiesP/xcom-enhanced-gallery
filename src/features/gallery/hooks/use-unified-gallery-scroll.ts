/**
 * Unified Gallery Scroll Hook
 * 기존 useGalleryScroll (휠/방향) + useGalleryItemScroll (아이템 내비게이션) 기능을 옵션 기반으로 통합
 * Phase 1: 기존 훅 재사용 어댑터 (중복 로직 최소) → 추후 Phase 2 직접 통합 리팩토링 예정
 */
import { useGalleryScroll } from './use-gallery-scroll';
import { useGalleryItemScroll } from './use-gallery-item-scroll';
import { ComponentManager } from '@shared/components/component-manager';

const { useMemo } = ComponentManager.getHookManager();

export interface UseUnifiedGalleryScrollOptions {
  container: HTMLElement | null;
  onScroll?: (delta: number) => void;
  enableScrollDirection?: boolean;
  onScrollDirectionChange?: (direction: 'up' | 'down' | 'idle') => void;
  // 아이템 내비게이션
  enableItemNavigation?: boolean;
  currentIndex?: number;
  totalItems?: number;
  itemNav?: {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    debounceDelay?: number;
    offset?: number;
    alignToCenter?: boolean;
    respectReducedMotion?: boolean;
  };
}

export interface UseUnifiedGalleryScrollReturn {
  lastScrollTime: number;
  isScrolling: boolean;
  scrollDirection?: 'up' | 'down' | 'idle';
  scrollToItem?: (index: number) => Promise<void>;
  scrollToCurrentItem?: () => Promise<void>;
}

export function useUnifiedGalleryScroll(
  options: UseUnifiedGalleryScrollOptions
): UseUnifiedGalleryScrollReturn {
  const {
    container,
    onScroll,
    enableScrollDirection,
    onScrollDirectionChange,
    enableItemNavigation = false,
    currentIndex = -1,
    totalItems = 0,
    itemNav,
  } = options;

  // exactOptionalPropertyTypes 대응: undefined 속성은 객체에 넣지 않음
  interface BaseOpts {
    container: HTMLElement | null;
    enableScrollDirection: boolean;
    onScroll?: (delta: number) => void;
    onScrollDirectionChange?: (direction: 'up' | 'down' | 'idle') => void;
  }
  const baseOptions: BaseOpts = {
    container,
    enableScrollDirection: enableScrollDirection ?? false,
  };
  if (onScroll) baseOptions.onScroll = onScroll;
  if (onScrollDirectionChange) baseOptions.onScrollDirectionChange = onScrollDirectionChange;
  const base = useGalleryScroll(baseOptions);

  const itemNavApi = useMemo(() => {
    if (!enableItemNavigation) return undefined;
    const refObj = { current: container } as { current: HTMLElement | null };
    return useGalleryItemScroll(refObj, currentIndex, totalItems, itemNav);
  }, [
    enableItemNavigation,
    container,
    currentIndex,
    totalItems,
    itemNav?.behavior,
    itemNav?.block,
    itemNav?.debounceDelay,
    itemNav?.offset,
    itemNav?.alignToCenter,
    itemNav?.respectReducedMotion,
  ]);

  return {
    lastScrollTime: base.lastScrollTime,
    isScrolling: base.isScrolling,
    ...(base.scrollDirection ? { scrollDirection: base.scrollDirection } : {}),
    ...(enableItemNavigation && itemNavApi
      ? {
          scrollToItem: itemNavApi.scrollToItem,
          scrollToCurrentItem: itemNavApi.scrollToCurrentItem,
        }
      : {}),
  };
}

export default useUnifiedGalleryScroll;
