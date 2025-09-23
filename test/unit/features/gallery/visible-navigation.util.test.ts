import { describe, it, expect } from 'vitest';
import {
  getGalleryBaseIndex,
  nextGalleryIndexByVisible,
  previousGalleryIndexByVisible,
} from '@/features/gallery/utils/visible-navigation';

describe('visible-navigation utils', () => {
  it('getGalleryBaseIndex: prefers valid visibleIndex', () => {
    expect(getGalleryBaseIndex(2, 0, 5)).toBe(2);
  });
  it('getGalleryBaseIndex: falls back to clamped currentIndex', () => {
    expect(getGalleryBaseIndex(-1, 10, 3)).toBe(2);
    expect(getGalleryBaseIndex(-1, -5, 3)).toBe(0);
  });
  it('nextGalleryIndexByVisible: cycles from base', () => {
    expect(nextGalleryIndexByVisible(2, 0, 4)).toBe(3);
    expect(nextGalleryIndexByVisible(-1, 3, 4)).toBe(0);
  });
  it('previousGalleryIndexByVisible: wraps from base', () => {
    expect(previousGalleryIndexByVisible(0, 1, 3)).toBe(2);
    expect(previousGalleryIndexByVisible(1, 0, 3)).toBe(0);
  });
});
