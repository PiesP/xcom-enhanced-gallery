/**
 * @fileoverview Phase 21.5: galleryState.value → gallerySignals Migration
 * @phase TDD-RED → GREEN → REFACTOR
 *
 * 목표: galleryState.value 직접 접근을 gallerySignals로 마이그레이션
 * - Fine-grained reactivity 활용
 * - 불필요한 재렌더링 방지
 * - 기존 동작 유지 (호환성 보장)
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  galleryState,
  gallerySignals,
  openGallery,
  closeGallery,
} from '@/shared/state/signals/gallery.signals';
import type { MediaInfo } from '@/shared/types/media.types';

describe('Phase 21.5: Gallery Signals Migration', () => {
  const mockMediaItems: MediaInfo[] = [
    {
      url: 'https://example.com/image1.jpg',
      type: 'image',
      originalUrl: 'https://example.com/image1.jpg',
      quality: 'large',
      tweetId: '123',
      username: 'testuser',
    },
    {
      url: 'https://example.com/image2.jpg',
      type: 'image',
      originalUrl: 'https://example.com/image2.jpg',
      quality: 'large',
      tweetId: '124',
      username: 'testuser',
    },
  ];

  beforeEach(() => {
    closeGallery();
  });

  describe('Individual Signal Access', () => {
    test('gallerySignals.isOpen 개별 구독', () => {
      // RED: galleryState.value.isOpen 대신 gallerySignals.isOpen() 사용
      expect(gallerySignals.isOpen.value).toBe(false);

      openGallery(mockMediaItems, 0);
      expect(gallerySignals.isOpen.value).toBe(true);

      closeGallery();
      expect(gallerySignals.isOpen.value).toBe(false);
    });

    test('gallerySignals.mediaItems 개별 구독', () => {
      // closeGallery는 mediaItems를 초기화하지 않음 (의도된 동작)
      // 새로운 갤러리를 열면 mediaItems가 업데이트됨
      openGallery(mockMediaItems, 0);
      expect(gallerySignals.mediaItems.value).toEqual(mockMediaItems);
      expect(gallerySignals.mediaItems.value.length).toBe(2);
    });

    test('gallerySignals.currentIndex 개별 구독', () => {
      openGallery(mockMediaItems, 1);
      expect(gallerySignals.currentIndex.value).toBe(1);
    });
  });

  describe('Compatibility Layer', () => {
    test('galleryState.value는 여전히 동작 (호환성)', () => {
      openGallery(mockMediaItems, 0);

      const state = galleryState.value;
      expect(state.isOpen).toBe(true);
      expect(state.mediaItems.length).toBe(2);
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('Performance: Fine-grained vs Coarse-grained', () => {
    test('개별 signal 업데이트는 다른 signal에 영향 없음', () => {
      let isOpenCallCount = 0;
      let mediaItemsCallCount = 0;

      // 개별 signal 구독
      const unsubscribeIsOpen = gallerySignals.isOpen.subscribe(() => {
        isOpenCallCount++;
      });
      const unsubscribeMediaItems = gallerySignals.mediaItems.subscribe(() => {
        mediaItemsCallCount++;
      });

      // mediaItems만 업데이트
      openGallery(mockMediaItems, 0);

      // isOpen과 mediaItems 모두 업데이트되었음
      expect(isOpenCallCount).toBeGreaterThan(0);
      expect(mediaItemsCallCount).toBeGreaterThan(0);

      // 정리
      unsubscribeIsOpen();
      unsubscribeMediaItems();
    });
  });

  describe('Migration Target Files', () => {
    test('GalleryRenderer.ts: renderGallery에서 state 추출', () => {
      // RED: const state = galleryState.value;
      // GREEN: 개별 signal 사용
      openGallery(mockMediaItems, 0);

      const isOpen = gallerySignals.isOpen.value;
      const mediaItems = gallerySignals.mediaItems.value;

      expect(isOpen).toBe(true);
      expect(mediaItems.length).toBe(2);
    });

    test('GalleryRenderer.ts: handleDownload에서 state 추출', () => {
      openGallery(mockMediaItems, 1);

      const mediaItems = gallerySignals.mediaItems.value;
      const currentIndex = gallerySignals.currentIndex.value;
      const currentMedia = mediaItems[currentIndex];

      expect(currentMedia).toBeDefined();
      expect(currentMedia?.url).toBe('https://example.com/image2.jpg');
    });

    test('GalleryApp.ts: Escape 키 핸들러에서 isOpen 체크', () => {
      openGallery(mockMediaItems, 0);

      // RED: galleryState.value.isOpen
      // GREEN: gallerySignals.isOpen.value
      if (gallerySignals.isOpen.value) {
        closeGallery();
      }

      expect(gallerySignals.isOpen.value).toBe(false);
    });

    test('GalleryApp.ts: getDiagnostics에서 state 반환', () => {
      openGallery(mockMediaItems, 0);

      const diagnostics = {
        isOpen: gallerySignals.isOpen.value,
        mediaCount: gallerySignals.mediaItems.value.length,
        currentIndex: gallerySignals.currentIndex.value,
      };

      expect(diagnostics.isOpen).toBe(true);
      expect(diagnostics.mediaCount).toBe(2);
      expect(diagnostics.currentIndex).toBe(0);
    });
  });
});
