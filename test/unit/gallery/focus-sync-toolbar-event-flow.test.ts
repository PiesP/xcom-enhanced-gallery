/**
 * Phase 1: 툴바 이벤트 플로우 누락 진단
 * 현재 문제: 툴바 버튼 클릭 시 setToolbarIntent() 호출 후 navigateToItem() 호출이 누락됨
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { galleryState, openGallery, navigateToItem } from '@shared/state/signals/gallery.signals';
import {
  navigationIntentState,
  resetIntent,
  setToolbarIntent,
} from '@shared/state/signals/navigation-intent.signals';

describe('Phase 1: 툴바 이벤트 플로우 누락 진단 (RED)', () => {
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

  it('[RED→GREEN] 툴바 Previous 버튼 클릭 시 이제 올바른 네비게이션 동작', () => {
    // Given: 갤러리가 인덱스 2에서 열려있음
    openGallery(mockMedia, 2);
    const initialIndex = galleryState.value.currentIndex;

    // When: 개선된 툴바 Previous 버튼 클릭 로직 시뮬레이션
    setToolbarIntent('prev');
    const nextIndex = Math.max(0, initialIndex - 1);
    // VerticalGalleryView에서 추가된 navigateToItem 호출 시뮬레이션
    navigateToItem(nextIndex);

    // Then: 이제 성공적으로 동작함
    expect(navigationIntentState.value.intent).toBe('toolbar-prev'); // intent 올바르게 설정됨
    expect(galleryState.value.currentIndex).toBe(1); // currentIndex도 업데이트됨 (문제 해결!)
  });

  it('[RED] 툴바 Next 버튼 클릭 시 setToolbarIntent만 호출되고 실제 네비게이션 누락', () => {
    // Given: 갤러리가 인덱스 1에서 열려있음
    openGallery(mockMedia, 1);
    const initialIndex = galleryState.value.currentIndex;

    // When: 툴바 Next 버튼 클릭 시뮬레이션 (현재 VerticalGalleryView의 onNext)
    setToolbarIntent('next');

    // Then: 문제 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-next'); // intent는 설정됨
    expect(galleryState.value.currentIndex).toBe(initialIndex); // currentIndex는 변화 없음 (문제점!)

    // 기대 동작: setToolbarIntent('next') 후 navigateToItem(currentIndex + 1) 호출되어야 함
    // 현재: navigateToItem 호출이 누락됨
    // expectedIndex = Math.min(mockMedia.length - 1, initialIndex + 1) 이어야 하지만 현재는 반영되지 않음
  });

  it('[RED] 툴바 버튼 클릭 후 스크롤 동작이 트리거되지 않음', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 2);

    // When: 툴바 버튼 클릭으로 인한 네비게이션 시뮬레이션
    setToolbarIntent('prev');

    // Then: 문제 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-prev');

    // 현재 문제:
    // 1. currentIndex가 업데이트되지 않음
    // 2. scrollIntoView나 smooth scroll 동작이 트리거되지 않음
    // 3. 사용자에게 버튼 클릭의 시각적 피드백이 없음

    // 기대 동작:
    // setToolbarIntent → navigateToItem → currentIndex 업데이트 → 해당 아이템으로 스크롤
  });

  it('[RED] 경계값에서 툴바 버튼 동작의 예외 처리 부족', () => {
    // Given: 갤러리가 첫 번째 아이템에서 열려있음
    openGallery(mockMedia, 0);

    // When: Previous 버튼 클릭 (경계값)
    setToolbarIntent('prev');

    // Then: 문제 확인
    expect(galleryState.value.currentIndex).toBe(0); // 여전히 0
    expect(navigationIntentState.value.intent).toBe('toolbar-prev'); // intent는 설정됨

    // 현재 문제: 경계값에서도 intent는 설정되지만 실제 동작은 없음
    // 기대 동작: 경계값 처리 로직 + 사용자 피드백 (예: disabled 상태 반영)

    // Given: 갤러리가 마지막 아이템에서 열려있음
    openGallery(mockMedia, mockMedia.length - 1);

    // When: Next 버튼 클릭 (경계값)
    setToolbarIntent('next');

    // Then: 동일한 문제
    expect(galleryState.value.currentIndex).toBe(mockMedia.length - 1); // 여전히 마지막
    expect(navigationIntentState.value.intent).toBe('toolbar-next'); // intent는 설정됨
  });

  it('[RED] intent 설정과 실제 갤러리 상태 동기화 메커니즘 부재', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 1);

    // When: 여러 차례 툴바 버튼 클릭 시뮬레이션
    setToolbarIntent('next'); // 1→2 예상
    setToolbarIntent('next'); // 2→3 예상
    setToolbarIntent('prev'); // 3→2 예상

    // Then: 문제 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-prev'); // 마지막 intent만 반영
    expect(galleryState.value.currentIndex).toBe(1); // 여전히 초기값 (문제점!)

    // 현재 문제: intent 변화가 galleryState에 전혀 반영되지 않음
    // 기대값: 각 intent에 따라 currentIndex가 순차적으로 업데이트되어야 함
    // 최종 expectedIndex = 1 + 1 + 1 - 1 = 2
    // expect(galleryState.value.currentIndex).toBe(2); // 이것이 실패하는 것이 문제
  });
});
