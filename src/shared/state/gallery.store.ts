/**
 * Unified Gallery Store (Phase18)
 * 단일 읽기 스냅샷 + selector 집합 퍼사드
 */
import type { MediaInfo } from '@shared/types/media.types';
import {
  galleryState,
  isGalleryOpen,
  getCurrentIndex,
  getMediaItems,
  getMediaItemsCount,
  getViewMode,
} from '@shared/state/signals/gallery.signals';

export interface UnifiedGallerySnapshot {
  readonly isOpen: boolean;
  readonly mediaCount: number;
  readonly currentIndex: number;
  readonly viewMode: 'horizontal' | 'vertical';
}

/** 내부 캐시 (불변 객체 재사용으로 GC 줄이기) */
let lastCache: UnifiedGallerySnapshot | null = null;

function buildSnapshot(): UnifiedGallerySnapshot {
  const next: UnifiedGallerySnapshot = {
    isOpen: isGalleryOpen(),
    mediaCount: getMediaItemsCount(),
    currentIndex: getCurrentIndex(),
    viewMode: getViewMode(),
  } as const;
  if (
    lastCache &&
    lastCache.isOpen === next.isOpen &&
    lastCache.mediaCount === next.mediaCount &&
    lastCache.currentIndex === next.currentIndex &&
    lastCache.viewMode === next.viewMode
  ) {
    return lastCache;
  }
  lastCache = Object.freeze({ ...next });
  return lastCache;
}

export function getState(): UnifiedGallerySnapshot {
  return buildSnapshot();
}

export const selectors = {
  isOpen: (): boolean => isGalleryOpen(),
  mediaCount: (): number => getMediaItemsCount(),
  currentIndex: (): number => getCurrentIndex(),
  viewMode: (): 'horizontal' | 'vertical' => getViewMode(),
  items: (): readonly MediaInfo[] => getMediaItems(),
  hasItems: (): boolean => getMediaItemsCount() > 0,
  rawSignal: () => galleryState, // (선택) 저수준 접근 – 점진적 마이그레이션용
};

export default { getState, selectors };
