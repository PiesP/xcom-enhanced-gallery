/**
 * @fileoverview Phase 64 Step 1: focusedIndex signal 테스트 (RED)
 * 스크롤 기반 포커스와 버튼 네비게이션 동기화를 위한 전역 focusedIndex signal
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  openGallery,
  closeGallery,
  gallerySignals,
  setFocusedIndex,
  navigateToItem,
} from '../../../src/shared/state/signals/gallery.signals';
import type { MediaInfo } from '../../../src/shared/types/media.types';

describe('Phase 64: focusedIndex Signal', () => {
  const mockMediaItems: MediaInfo[] = [
    {
      type: 'image',
      url: 'https://example.com/image1.jpg',
      filename: 'image1.jpg',
      originalUrl: 'https://example.com/image1.jpg',
      downloadUrl: 'https://example.com/image1.jpg',
    },
    {
      type: 'image',
      url: 'https://example.com/image2.jpg',
      filename: 'image2.jpg',
      originalUrl: 'https://example.com/image2.jpg',
      downloadUrl: 'https://example.com/image2.jpg',
    },
    {
      type: 'image',
      url: 'https://example.com/image3.jpg',
      filename: 'image3.jpg',
      originalUrl: 'https://example.com/image3.jpg',
      downloadUrl: 'https://example.com/image3.jpg',
    },
    {
      type: 'image',
      url: 'https://example.com/image4.jpg',
      filename: 'image4.jpg',
      originalUrl: 'https://example.com/image4.jpg',
      downloadUrl: 'https://example.com/image4.jpg',
    },
  ];

  beforeEach(() => {
    closeGallery();
  });

  describe('Signal 생성 및 접근', () => {
    it('focusedIndex signal이 존재해야 함', () => {
      expect(gallerySignals.focusedIndex).toBeDefined();
    });

    it('초기값은 null이어야 함', () => {
      expect(gallerySignals.focusedIndex.value).toBeNull();
    });

    it('갤러리 열 때 focusedIndex가 startIndex로 설정되어야 함', () => {
      openGallery(mockMediaItems, 2);

      expect(gallerySignals.focusedIndex.value).toBe(2);
    });
  });

  describe('setFocusedIndex 함수', () => {
    beforeEach(() => {
      openGallery(mockMediaItems, 0);
    });

    it('setFocusedIndex가 존재해야 함', () => {
      expect(setFocusedIndex).toBeDefined();
      expect(typeof setFocusedIndex).toBe('function');
    });

    it('유효한 인덱스로 focusedIndex를 설정할 수 있어야 함', () => {
      setFocusedIndex(2);

      expect(gallerySignals.focusedIndex.value).toBe(2);
    });

    it('null로 focusedIndex를 설정할 수 있어야 함', () => {
      setFocusedIndex(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);

      setFocusedIndex(null);
      expect(gallerySignals.focusedIndex.value).toBeNull();
    });

    it('범위를 벗어난 인덱스는 정규화되어야 함', () => {
      // 음수는 0으로
      setFocusedIndex(-1);
      expect(gallerySignals.focusedIndex.value).toBe(0);

      // 최대값 초과는 마지막 인덱스로
      setFocusedIndex(10);
      expect(gallerySignals.focusedIndex.value).toBe(3); // mockMediaItems.length - 1
    });
  });

  describe('navigateToItem과 focusedIndex 동기화', () => {
    beforeEach(() => {
      openGallery(mockMediaItems, 0);
    });

    it('navigateToItem 호출 시 focusedIndex도 동기화되어야 함', () => {
      navigateToItem(2, 'button');

      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
    });

    it('여러 번 네비게이션 시 focusedIndex가 계속 동기화되어야 함', () => {
      navigateToItem(1, 'button');
      expect(gallerySignals.focusedIndex.value).toBe(1);

      navigateToItem(2, 'keyboard');
      expect(gallerySignals.focusedIndex.value).toBe(2);

      navigateToItem(0, 'click');
      expect(gallerySignals.focusedIndex.value).toBe(0);
    });
  });

  describe('갤러리 닫기 시 focusedIndex 초기화', () => {
    it('갤러리 닫을 때 focusedIndex가 null로 초기화되어야 함', () => {
      openGallery(mockMediaItems, 2);
      expect(gallerySignals.focusedIndex.value).toBe(2);

      setFocusedIndex(3);
      expect(gallerySignals.focusedIndex.value).toBe(3);

      closeGallery();
      expect(gallerySignals.focusedIndex.value).toBeNull();
    });
  });
});
