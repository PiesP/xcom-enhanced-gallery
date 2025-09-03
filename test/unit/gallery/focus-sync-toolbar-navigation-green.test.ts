/**
 * Phase 2: 툴바 버튼 클릭 시 실제 네비게이션 동작 확인 (GREEN)
 * 수정된 동작: setToolbarIntent + navigateToItem 조합 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { galleryState, openGallery, navigateToItem } from '@shared/state/signals/gallery.signals';
import {
  navigationIntentState,
  resetIntent,
  setToolbarIntent,
} from '@shared/state/signals/navigation-intent.signals';

describe('Phase 2: 툴바 네비게이션 동작 확인 (GREEN)', () => {
  const mockMedia = Array.from({ length: 5 }).map((_, i) => ({
    id: `media-${i}`,
    url: `https://example.com/image-${i}.jpg`,
    type: 'image' as const,
    filename: `image-${i}.jpg`,
    width: 800,
    height: 600,
    size: 100000,
    mediaType: 'image' as const,
  }));

  beforeEach(() => {
    // 각 테스트 전에 상태 초기화
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
    resetIntent();
    vi.clearAllMocks();
  });

  it('[GREEN] setToolbarIntent + navigateToItem 조합으로 Previous 네비게이션 동작', () => {
    // Given: 갤러리가 인덱스 2에서 열려있음
    openGallery(mockMedia, 2);
    const initialIndex = galleryState.value.currentIndex;
    expect(initialIndex).toBe(2);

    // When: 툴바 Previous 버튼 클릭 시뮬레이션 (새로운 방식)
    setToolbarIntent('prev');
    const nextIndex = Math.max(0, initialIndex - 1);
    navigateToItem(nextIndex);

    // Then: 성공 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-prev'); // intent 올바르게 설정됨
    expect(galleryState.value.currentIndex).toBe(1); // currentIndex 올바르게 업데이트됨
  });

  it('[GREEN] setToolbarIntent + navigateToItem 조합으로 Next 네비게이션 동작', () => {
    // Given: 갤러리가 인덱스 1에서 열려있음
    openGallery(mockMedia, 1);
    const initialIndex = galleryState.value.currentIndex;
    expect(initialIndex).toBe(1);

    // When: 툴바 Next 버튼 클릭 시뮬레이션 (새로운 방식)
    setToolbarIntent('next');
    const nextIndex = Math.min(mockMedia.length - 1, initialIndex + 1);
    navigateToItem(nextIndex);

    // Then: 성공 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-next'); // intent 올바르게 설정됨
    expect(galleryState.value.currentIndex).toBe(2); // currentIndex 올바르게 업데이트됨
  });

  it('[GREEN] 경계값에서 툴바 버튼 동작 - 첫 번째 아이템에서 Previous', () => {
    // Given: 갤러리가 첫 번째 아이템에서 열려있음
    openGallery(mockMedia, 0);

    // When: Previous 버튼 클릭 (경계값)
    setToolbarIntent('prev');
    const nextIndex = Math.max(0, 0 - 1); // Math.max(0, -1) = 0
    navigateToItem(nextIndex);

    // Then: 경계값 처리 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-prev'); // intent는 설정됨
    expect(galleryState.value.currentIndex).toBe(0); // 여전히 0 (경계값 처리)
  });

  it('[GREEN] 경계값에서 툴바 버튼 동작 - 마지막 아이템에서 Next', () => {
    // Given: 갤러리가 마지막 아이템에서 열려있음
    const lastIndex = mockMedia.length - 1;
    openGallery(mockMedia, lastIndex);

    // When: Next 버튼 클릭 (경계값)
    setToolbarIntent('next');
    const nextIndex = Math.min(mockMedia.length - 1, lastIndex + 1); // Math.min(4, 5) = 4
    navigateToItem(nextIndex);

    // Then: 경계값 처리 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-next'); // intent는 설정됨
    expect(galleryState.value.currentIndex).toBe(lastIndex); // 여전히 마지막 (경계값 처리)
  });

  it('[GREEN] 연속적인 툴바 버튼 클릭 처리', () => {
    // Given: 갤러리가 중간 아이템에서 열려있음
    openGallery(mockMedia, 2);

    // When: 연속적인 네비게이션
    // 2 → 3 (Next)
    setToolbarIntent('next');
    navigateToItem(Math.min(mockMedia.length - 1, 2 + 1));
    expect(galleryState.value.currentIndex).toBe(3);

    // 3 → 4 (Next)
    setToolbarIntent('next');
    navigateToItem(Math.min(mockMedia.length - 1, 3 + 1));
    expect(galleryState.value.currentIndex).toBe(4);

    // 4 → 3 (Previous)
    setToolbarIntent('prev');
    navigateToItem(Math.max(0, 4 - 1));

    // Then: 최종 상태 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-prev'); // 마지막 intent
    expect(galleryState.value.currentIndex).toBe(3); // 최종 인덱스
  });
});
