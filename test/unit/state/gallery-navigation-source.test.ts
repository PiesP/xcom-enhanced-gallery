/**
 * @fileoverview Phase 77: NavigationSource 추적 시스템 테스트 (RED)
 * 자동 포커스와 수동 네비게이션의 인덱스 불일치 문제 해결을 위한 소스 추적
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  openGallery,
  closeGallery,
  gallerySignals,
  setFocusedIndex,
  navigateToItem,
  navigateNext,
  navigatePrevious,
  getLastNavigationSource,
} from '../../../src/shared/state/signals/gallery.signals';
import type { MediaInfo } from '../../../src/shared/types/media.types';

describe('Phase 77: NavigationSource Tracking', () => {
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
    {
      type: 'image',
      url: 'https://example.com/image5.jpg',
      filename: 'image5.jpg',
      originalUrl: 'https://example.com/image5.jpg',
      downloadUrl: 'https://example.com/image5.jpg',
    },
  ];

  beforeEach(() => {
    closeGallery();
  });

  describe('버그 재현: focusedIndex/currentIndex 불일치', () => {
    it('스크롤로 focusedIndex=1 설정 후 Next 버튼 클릭 시 정상 네비게이션', () => {
      // Given: currentIndex=0, focusedIndex를 1로 설정 (스크롤 시뮬레이션)
      openGallery(mockMediaItems, 0);
      setFocusedIndex(1, 'auto-focus');

      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBe(1);

      // When: Next 버튼 클릭
      navigateNext('button');

      // Then: focusedIndex(1) 기준으로 다음(2)으로 이동
      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
      // ⚠️ "Already at index 0" 경고가 발생하지 않아야 함
    });

    it('같은 인덱스로 네비게이션 시에도 source 기반으로 동기화', () => {
      openGallery(mockMediaItems, 2);
      setFocusedIndex(1, 'auto-focus'); // 스크롤로 1로 변경

      // 다시 2로 네비게이션 (이미 currentIndex는 2)
      navigateToItem(2, 'button', 'button');

      // ✅ focusedIndex도 2로 동기화되어야 함
      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
    });

    it('자동 포커스 후 버튼 네비게이션이 정상 동작해야 함', () => {
      openGallery(mockMediaItems, 0);

      // 1. 자동 포커스로 인덱스 1로 설정
      setFocusedIndex(1, 'auto-focus');
      expect(gallerySignals.focusedIndex.value).toBe(1);
      expect(gallerySignals.currentIndex.value).toBe(0);

      // 2. Previous 버튼 클릭 (focusedIndex=1 기준으로 0으로 이동)
      navigatePrevious('button');

      // 3. 정상적으로 0으로 이동해야 함
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBe(0);
    });

    it('연속된 자동 포커스 변경이 정상 동작해야 함', () => {
      openGallery(mockMediaItems, 0);

      // 연속적으로 자동 포커스 변경
      setFocusedIndex(1, 'auto-focus');
      expect(gallerySignals.focusedIndex.value).toBe(1);

      setFocusedIndex(2, 'auto-focus');
      expect(gallerySignals.focusedIndex.value).toBe(2);

      setFocusedIndex(3, 'auto-focus');
      expect(gallerySignals.focusedIndex.value).toBe(3);

      // currentIndex는 여전히 초기값
      expect(gallerySignals.currentIndex.value).toBe(0);

      // 이제 버튼으로 다음(4)으로 이동
      navigateNext('button');

      // focusedIndex(3) 기준으로 4로 이동
      expect(gallerySignals.currentIndex.value).toBe(4);
      expect(gallerySignals.focusedIndex.value).toBe(4);
    });
  });

  describe('NavigationSource 추적', () => {
    it('getLastNavigationSource 함수가 존재해야 함', () => {
      expect(getLastNavigationSource).toBeDefined();
      expect(typeof getLastNavigationSource).toBe('function');
    });

    it('초기 상태는 auto-focus여야 함', () => {
      openGallery(mockMediaItems, 0);

      const source = getLastNavigationSource();
      expect(source).toBe('auto-focus');
    });

    it('버튼 네비게이션은 source="button"으로 기록', () => {
      openGallery(mockMediaItems, 0);

      navigateNext('button');

      // lastNavigationSource가 'button'으로 설정되어야 함
      expect(getLastNavigationSource()).toBe('button');
    });

    it('키보드 네비게이션은 source="keyboard"로 기록', () => {
      openGallery(mockMediaItems, 0);

      navigateNext('keyboard');

      // lastNavigationSource가 'keyboard'로 설정되어야 함
      expect(getLastNavigationSource()).toBe('keyboard');
    });

    it('자동 포커스는 source="auto-focus"로 기록', () => {
      openGallery(mockMediaItems, 0);

      setFocusedIndex(1, 'auto-focus');

      // lastNavigationSource가 'auto-focus'로 설정되어야 함
      expect(getLastNavigationSource()).toBe('auto-focus');
    });

    it('수동 네비게이션 후 자동 포커스가 개입해도 정상 동작', () => {
      openGallery(mockMediaItems, 0);

      // 1. 버튼으로 1로 이동
      navigateNext('button');
      expect(gallerySignals.currentIndex.value).toBe(1);
      expect(getLastNavigationSource()).toBe('button');

      // 2. 자동 포커스가 2로 설정 시도
      setFocusedIndex(2, 'auto-focus');
      expect(gallerySignals.focusedIndex.value).toBe(2);
      expect(getLastNavigationSource()).toBe('auto-focus');

      // 3. 다시 버튼으로 3으로 이동
      navigateNext('button');

      // ✅ focusedIndex(2) 기준으로 3으로 이동
      expect(gallerySignals.currentIndex.value).toBe(3);
      expect(gallerySignals.focusedIndex.value).toBe(3);
      expect(getLastNavigationSource()).toBe('button');
    });

    it('navigateToItem에 source 파라미터 전달 가능', () => {
      openGallery(mockMediaItems, 0);

      // 명시적으로 source 전달
      navigateToItem(2, 'button', 'button');

      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(getLastNavigationSource()).toBe('button');
    });

    it('navigatePrevious가 올바른 source를 전달', () => {
      openGallery(mockMediaItems, 2);

      navigatePrevious('keyboard');

      expect(gallerySignals.currentIndex.value).toBe(1);
      expect(getLastNavigationSource()).toBe('keyboard');
    });
  });

  describe('중복 검사 로직', () => {
    it('수동 네비게이션에서 같은 인덱스 이동 시 focusedIndex 동기화', () => {
      openGallery(mockMediaItems, 2);
      setFocusedIndex(1, 'auto-focus');

      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(1);

      // 버튼으로 다시 2로 이동
      navigateToItem(2, 'button', 'button');

      // currentIndex는 그대로지만 focusedIndex는 동기화되어야 함
      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
    });

    it('자동 포커스에서는 중복 검사 무시', () => {
      openGallery(mockMediaItems, 2);

      // 자동 포커스로 같은 인덱스 설정
      setFocusedIndex(2, 'auto-focus');

      // focusedIndex가 설정되어야 함
      expect(gallerySignals.focusedIndex.value).toBe(2);
      expect(gallerySignals.currentIndex.value).toBe(2);
    });

    it('자동 포커스 직후 수동 네비게이션은 정상 동작', () => {
      openGallery(mockMediaItems, 0);

      // 1. 자동 포커스로 1로 설정
      setFocusedIndex(1, 'auto-focus');
      expect(getLastNavigationSource()).toBe('auto-focus');

      // 2. 버튼으로 2로 이동 (자동 포커스 직후)
      navigateNext('button');

      // ✅ focusedIndex(1) 기준으로 2로 정상 이동
      expect(gallerySignals.currentIndex.value).toBe(2);
      expect(gallerySignals.focusedIndex.value).toBe(2);
      expect(getLastNavigationSource()).toBe('button');
    });
  });

  describe('경계 케이스', () => {
    it('빈 갤러리에서 네비게이션 시도 시 안전하게 처리', () => {
      openGallery([], 0);

      expect(() => navigateNext('button')).not.toThrow();
      expect(gallerySignals.currentIndex.value).toBe(0);
    });

    it('단일 아이템 갤러리에서 네비게이션', () => {
      openGallery([mockMediaItems[0]], 0);

      navigateNext('button');

      // 순환 네비게이션으로 0으로 돌아옴
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(getLastNavigationSource()).toBe('button');
    });

    it('마지막 인덱스에서 Next 버튼', () => {
      openGallery(mockMediaItems, 4);

      navigateNext('button');

      // 순환 네비게이션으로 0으로 이동
      expect(gallerySignals.currentIndex.value).toBe(0);
      expect(gallerySignals.focusedIndex.value).toBe(0);
    });

    it('첫 인덱스에서 Previous 버튼', () => {
      openGallery(mockMediaItems, 0);

      navigatePrevious('button');

      // 순환 네비게이션으로 마지막으로 이동
      expect(gallerySignals.currentIndex.value).toBe(4);
      expect(gallerySignals.focusedIndex.value).toBe(4);
    });

    it('null로 focusedIndex 설정 후 네비게이션', () => {
      openGallery(mockMediaItems, 2);

      setFocusedIndex(null);
      expect(gallerySignals.focusedIndex.value).toBeNull();

      // focusedIndex가 null일 때는 currentIndex 사용
      navigateNext('button');

      expect(gallerySignals.currentIndex.value).toBe(3);
      expect(gallerySignals.focusedIndex.value).toBe(3);
    });
  });
});
