/**
 * Gallery State Management
 * @version 3.0.0 - Simplified State Management with Preact Signals
 */

import { getPreactSignals } from '@core/external/vendors';
import { MediaItem, GalleryConfig } from '../types/core.types';

const { signal, computed } = getPreactSignals();

// Signals
export const isGalleryOpen = signal(false);
export const currentMediaItems = signal<MediaItem[]>([]);
export const currentIndex = signal(0);
export const galleryConfig = signal<GalleryConfig>({
  autoPlay: false,
  showThumbnails: true,
  downloadEnabled: true,
  keyboardNavigation: true,
  fullscreenEnabled: true,
  zoomEnabled: false,
});

// Computed values
export const currentMediaItem = computed(() => {
  const items = currentMediaItems.value;
  const index = currentIndex.value;
  return items[index] || null;
});

export const hasMultipleItems = computed(() => {
  return currentMediaItems.value.length > 1;
});

export const canNavigatePrevious = computed(() => {
  return currentIndex.value > 0;
});

export const canNavigateNext = computed(() => {
  const items = currentMediaItems.value;
  const index = currentIndex.value;
  return index < items.length - 1;
});

// Actions
export function openGallery(items: MediaItem[], startIndex: number = 0) {
  currentMediaItems.value = items;
  currentIndex.value = Math.max(0, Math.min(startIndex, items.length - 1));
  isGalleryOpen.value = true;
}

export function closeGallery() {
  isGalleryOpen.value = false;
  currentMediaItems.value = [];
  currentIndex.value = 0;
}

export function navigateToIndex(index: number) {
  const items = currentMediaItems.value;
  if (index >= 0 && index < items.length) {
    currentIndex.value = index;
  }
}

export function navigateNext() {
  const items = currentMediaItems.value;
  const current = currentIndex.value;
  if (current < items.length - 1) {
    currentIndex.value = current + 1;
  } else if (galleryConfig.value.autoPlay) {
    currentIndex.value = 0; // 순환
  }
}

export function navigatePrevious() {
  const items = currentMediaItems.value;
  const current = currentIndex.value;
  if (current > 0) {
    currentIndex.value = current - 1;
  } else if (galleryConfig.value.autoPlay) {
    currentIndex.value = items.length - 1; // 순환
  }
}

export function updateConfig(config: Partial<GalleryConfig>) {
  galleryConfig.value = { ...galleryConfig.value, ...config };
}

export function addMediaItem(item: MediaItem) {
  currentMediaItems.value = [...currentMediaItems.value, item];
}

export function removeMediaItem(itemId: string) {
  const items = currentMediaItems.value;
  const newItems = items.filter(item => item.id !== itemId);
  currentMediaItems.value = newItems;

  // 현재 인덱스 조정
  if (currentIndex.value >= newItems.length) {
    currentIndex.value = Math.max(0, newItems.length - 1);
  }
}
