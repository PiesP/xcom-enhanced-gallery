/**
 * @fileoverview Phase 62: 순환 네비게이션 테스트 (RED)
 * @description 갤러리 이전/다음 네비게이션이 순환하는지 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  galleryState,
  openGallery,
  closeGallery,
  navigatePrevious,
  navigateNext,
  navigateToItem,
} from '@/shared/state/signals/gallery.signals';
import type { MediaInfo } from '@/shared/types/media.types';

describe('Phase 62: Gallery Circular Navigation', () => {
  const mockMediaItems: MediaInfo[] = [
    {
      id: '1',
      url: 'https://example.com/image1.jpg',
      type: 'image',
      filename: 'image1.jpg',
    },
    {
      id: '2',
      url: 'https://example.com/image2.jpg',
      type: 'image',
      filename: 'image2.jpg',
    },
    {
      id: '3',
      url: 'https://example.com/image3.jpg',
      type: 'image',
      filename: 'image3.jpg',
    },
  ];

  beforeEach(() => {
    closeGallery();
  });

  describe('RED: navigatePrevious() 순환 동작', () => {
    it('첫 번째 이미지(index=0)에서 이전 버튼 클릭 시 마지막 이미지로 순환해야 함', () => {
      // Arrange
      openGallery(mockMediaItems, 0);
      expect(galleryState.value.currentIndex).toBe(0);

      // Act
      navigatePrevious();

      // Assert - RED: 현재는 0에서 멈추지만, 2로 순환해야 함
      expect(galleryState.value.currentIndex).toBe(2);
    });

    it('중간 이미지(index=1)에서 이전 버튼 클릭 시 정상적으로 이전 이미지로 이동해야 함', () => {
      // Arrange
      openGallery(mockMediaItems, 1);
      expect(galleryState.value.currentIndex).toBe(1);

      // Act
      navigatePrevious();

      // Assert - 이 케이스는 기존 동작과 동일
      expect(galleryState.value.currentIndex).toBe(0);
    });
  });

  describe('RED: navigateNext() 순환 동작', () => {
    it('마지막 이미지(index=2)에서 다음 버튼 클릭 시 첫 번째 이미지로 순환해야 함', () => {
      // Arrange
      openGallery(mockMediaItems, 2);
      expect(galleryState.value.currentIndex).toBe(2);

      // Act
      navigateNext();

      // Assert - RED: 현재는 2에서 멈추지만, 0으로 순환해야 함
      expect(galleryState.value.currentIndex).toBe(0);
    });

    it('중간 이미지(index=1)에서 다음 버튼 클릭 시 정상적으로 다음 이미지로 이동해야 함', () => {
      // Arrange
      openGallery(mockMediaItems, 1);
      expect(galleryState.value.currentIndex).toBe(1);

      // Act
      navigateNext();

      // Assert - 이 케이스는 기존 동작과 동일
      expect(galleryState.value.currentIndex).toBe(2);
    });
  });

  describe('RED: 단일 이미지 예외 처리', () => {
    it('단일 이미지(totalCount=1)에서는 순환하지 않아야 함', () => {
      // Arrange
      const singleItem: MediaInfo[] = [
        {
          id: 'single',
          url: 'https://example.com/single.jpg',
          type: 'image',
          filename: 'single.jpg',
        },
      ];
      openGallery(singleItem, 0);
      expect(galleryState.value.currentIndex).toBe(0);

      // Act & Assert - 이전/다음 모두 변화 없음
      navigatePrevious();
      expect(galleryState.value.currentIndex).toBe(0);

      navigateNext();
      expect(galleryState.value.currentIndex).toBe(0);
    });
  });

  describe('RED: 빈 갤러리 예외 처리', () => {
    it('빈 갤러리(totalCount=0)에서는 네비게이션이 동작하지 않아야 함', () => {
      // Arrange
      openGallery([], 0);
      expect(galleryState.value.currentIndex).toBe(0);

      // Act & Assert
      navigatePrevious();
      expect(galleryState.value.currentIndex).toBe(0);

      navigateNext();
      expect(galleryState.value.currentIndex).toBe(0);
    });
  });

  describe('RED: 연속 순환 동작', () => {
    it('마지막 → 첫 번째 → 마지막으로 연속 순환할 수 있어야 함', () => {
      // Arrange
      openGallery(mockMediaItems, 2);

      // Act: 다음(2→0) → 이전(0→2) → 다음(2→0)
      navigateNext();
      expect(galleryState.value.currentIndex).toBe(0);

      navigatePrevious();
      expect(galleryState.value.currentIndex).toBe(2);

      navigateNext();
      expect(galleryState.value.currentIndex).toBe(0);
    });

    it('첫 번째 → 마지막 → 첫 번째로 연속 순환할 수 있어야 함', () => {
      // Arrange
      openGallery(mockMediaItems, 0);

      // Act: 이전(0→2) → 다음(2→0) → 이전(0→2)
      navigatePrevious();
      expect(galleryState.value.currentIndex).toBe(2);

      navigateNext();
      expect(galleryState.value.currentIndex).toBe(0);

      navigatePrevious();
      expect(galleryState.value.currentIndex).toBe(2);
    });
  });
});
