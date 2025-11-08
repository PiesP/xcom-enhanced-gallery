import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import type { MediaInfo } from '@/shared/types/media.types';
import {
  closeGallery,
  gallerySignals,
  navigateNext,
  navigatePrevious,
  openGallery,
  setFocusedIndex,
} from '@/shared/state/signals/gallery.signals';

/**
 * Phase 64 Step 2: navigateNext/navigatePrevious를 focusedIndex 기준으로 변경
 *
 * 목표:
 * - 사용자가 스크롤하여 2/4로 이동 (focusedIndex=2, currentIndex=1)
 * - "다음" 버튼 클릭 시 3/4로 이동 (currentIndex=1 기준이 아님)
 * - focusedIndex가 null이면 currentIndex를 fallback으로 사용
 */

describe('Phase 64 Step 2: navigateNext/navigatePrevious with focusedIndex', () => {
  setupGlobalTestIsolation();

  const mockMediaItems: MediaInfo[] = [
    {
      id: '1',
      type: 'image',
      url: 'https://example.com/1.jpg',
      filename: '1.jpg',
      originalUrl: 'https://example.com/1.jpg',
    },
    {
      id: '2',
      type: 'image',
      url: 'https://example.com/2.jpg',
      filename: '2.jpg',
      originalUrl: 'https://example.com/2.jpg',
    },
    {
      id: '3',
      type: 'image',
      url: 'https://example.com/3.jpg',
      filename: '3.jpg',
      originalUrl: 'https://example.com/3.jpg',
    },
    {
      id: '4',
      type: 'image',
      url: 'https://example.com/4.jpg',
      filename: '4.jpg',
      originalUrl: 'https://example.com/4.jpg',
    },
  ];

  beforeEach(() => {
    // 갤러리를 열고 첫 번째 미디어로 초기화
    openGallery(mockMediaItems, 0);
  });

  afterEach(() => {
    closeGallery();
    vi.clearAllMocks();
  });

  describe('navigateNext: focusedIndex 우선 사용', () => {
    test('focusedIndex가 설정된 경우, focusedIndex 기준으로 다음 미디어로 이동', () => {
      // Given: currentIndex=0, focusedIndex를 2로 설정 (스크롤로 2/4로 이동한 상황)
      setFocusedIndex(2);
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBe(2);

      // When: "다음" 버튼 클릭
      navigateNext('button');

      // Then: focusedIndex(2) 기준으로 다음(3)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(3);
      expect(gallerySignals.focusedIndex.value).toBe(3);
    });

    test('focusedIndex가 null인 경우, currentIndex를 fallback으로 사용', () => {
      // Given: currentIndex=0, focusedIndex=null
      setFocusedIndex(null);
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBeNull();

      // When: "다음" 버튼 클릭
      navigateNext('button');

      // Then: currentIndex(0) 기준으로 다음(1)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(1);
      expect(gallerySignals.focusedIndex.value).toBe(1);
    });

    test('focusedIndex가 마지막(3)일 때, 순환하여 첫 번째(0)로 이동', () => {
      // Given: currentIndex를 1로 설정 (순환 시 0으로 이동이 실제로 발생하도록)
      closeGallery();
      openGallery(mockMediaItems, 1);
      setFocusedIndex(3);

      // When: "다음" 버튼 클릭
      navigateNext('button');

      // Then: 순환하여 첫 번째(0)로 이동
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBe(0);
    });

    test('focusedIndex가 중간(1)일 때, 다음(2)으로 이동', () => {
      // Given: focusedIndex=1
      setFocusedIndex(1);

      // When: "다음" 버튼 클릭
      navigateNext('button');

      // Then: 다음(2)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
    });
  });

  describe('navigatePrevious: focusedIndex 우선 사용', () => {
    test('focusedIndex가 설정된 경우, focusedIndex 기준으로 이전 미디어로 이동', () => {
      // Given: currentIndex=0, focusedIndex를 2로 설정
      setFocusedIndex(2);
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBe(2);

      // When: "이전" 버튼 클릭
      navigatePrevious('button');

      // Then: focusedIndex(2) 기준으로 이전(1)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(1);
      expect(gallerySignals.focusedIndex.value).toBe(1);
    });

    test('focusedIndex가 null인 경우, currentIndex를 fallback으로 사용', () => {
      // Given: currentIndex=0, focusedIndex=null
      setFocusedIndex(null);
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBeNull();

      // When: "이전" 버튼 클릭
      navigatePrevious('button');

      // Then: currentIndex(0) 기준으로 순환하여 마지막(3)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(3);
      expect(gallerySignals.focusedIndex.value).toBe(3);
    });

    test('focusedIndex가 첫 번째(0)일 때, 순환하여 마지막(3)으로 이동', () => {
      // Given: focusedIndex=0
      setFocusedIndex(0);

      // When: "이전" 버튼 클릭
      navigatePrevious('button');

      // Then: 순환하여 마지막(3)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(3);
      expect(gallerySignals.focusedIndex.value).toBe(3);
    });

    test('focusedIndex가 중간(2)일 때, 이전(1)으로 이동', () => {
      // Given: focusedIndex=2
      setFocusedIndex(2);

      // When: "이전" 버튼 클릭
      navigatePrevious('button');

      // Then: 이전(1)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(1);
      expect(gallerySignals.focusedIndex.value).toBe(1);
    });
  });

  describe('경계 케이스: 단일 미디어', () => {
    beforeEach(() => {
      closeGallery();
      openGallery([mockMediaItems[0]], 0);
    });

    test('navigateNext: 단일 미디어일 때, 순환하여 자기 자신(0)으로 이동', () => {
      // Given: focusedIndex=0, 미디어가 1개만 있음
      setFocusedIndex(0);

      // When: "다음" 버튼 클릭
      navigateNext('button');

      // Then: 순환하여 자기 자신(0)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBe(0);
    });

    test('navigatePrevious: 단일 미디어일 때, 순환하여 자기 자신(0)으로 이동', () => {
      // Given: focusedIndex=0, 미디어가 1개만 있음
      setFocusedIndex(0);

      // When: "이전" 버튼 클릭
      navigatePrevious('button');

      // Then: 순환하여 자기 자신(0)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBe(0);
    });
  });

  describe('실제 버그 시나리오 재현', () => {
    test('스크롤로 2/4 이동 후 "다음" 버튼 클릭 시 3/4로 이동 (버그 수정 검증)', () => {
      // Given: 갤러리를 열고 1/4에 있음 (currentIndex=0)
      expect(gallerySignals.currentIndex.value).toBe(0);

      // Given: 사용자가 스크롤하여 2/4로 이동 (focusedIndex=1)
      setFocusedIndex(1);
      expect(gallerySignals.focusedIndex.value).toBe(1);

      // When: "다음" 버튼 클릭
      navigateNext('button');

      // Then: focusedIndex(1) 기준으로 다음(2)으로 이동 (2/4가 아님!)
      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
    });

    test('스크롤로 3/4 이동 후 "이전" 버튼 클릭 시 2/4로 이동', () => {
      // Given: currentIndex=0
      expect(gallerySignals.currentIndex.value).toBe(0);

      // Given: 사용자가 스크롤하여 3/4로 이동 (focusedIndex=2)
      setFocusedIndex(2);

      // When: "이전" 버튼 클릭
      navigatePrevious('button');

      // Then: focusedIndex(2) 기준으로 이전(1)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(1);
      expect(gallerySignals.focusedIndex.value).toBe(1);
    });
  });
});
