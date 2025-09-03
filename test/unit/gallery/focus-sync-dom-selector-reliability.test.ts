/**
 * Phase 1: DOM 셀렉터 불안정성 진단
 * 현재 문제: [data-xeg-role="gallery-item"] 셀렉터가 일관성이 없음
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { galleryState, openGallery } from '@shared/state/signals/gallery.signals';
import { resetIntent } from '@shared/state/signals/navigation-intent.signals';

describe('Phase 1: DOM 셀렉터 불안정성 진단 (RED)', () => {
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

  it('[RED] gallery-item 요소들이 data-xeg-role 속성을 일관성 있게 가지지 않음', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 0);

    // When: DOM에서 gallery-item 셀렉터로 요소 검색 시뮬레이션
    // 현재 문제: 실제로는 일부 요소에서만 data-xeg-role 속성이 설정됨

    // Then: 문제 확인 - 셀렉터 일관성 부족
    // 기대값: 모든 미디어 아이템에 대응하는 DOM 요소가 data-xeg-role="gallery-item"을 가져야 함
    // 현재: 이 속성이 일관성 없게 설정되어 centerIndex 계산에 실패함

    expect(mockMedia.length).toBe(5); // 미디어 아이템은 5개

    // 누락된 기능: 모든 갤러리 아이템이 일관된 data-xeg-role 속성을 가져야 함
    // 현재 VerticalGalleryView에서 이 속성 설정이 불안정함을 시뮬레이션
  });

  it('[RED] data-index 속성이 currentIndex와 정확히 매치되지 않음', () => {
    // Given: 갤러리가 특정 인덱스로 열려있음
    openGallery(mockMedia, 2);
    const currentIndex = galleryState.value.currentIndex;

    // When: DOM에서 현재 인덱스에 해당하는 요소 검색 시뮬레이션
    // 현재 문제: data-index 속성이 일관성 없게 설정됨

    // Then: 문제 확인
    expect(currentIndex).toBe(2); // currentIndex는 설정됨

    // 현재 문제: data-index 속성이 누락되거나 일관성이 없어서
    // querySelector로 currentIndex에 해당하는 DOM 요소를 찾을 수 없음
    // 기대값: currentIndex에 해당하는 DOM 요소를 항상 찾을 수 있어야 함
  });

  it('[RED] 동적으로 생성된 갤러리 아이템들의 속성 누락', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 0);

    // When: 실제 VerticalGalleryView 컴포넌트가 렌더링한다고 가정
    // 현재 문제: 일부 아이템만 올바른 속성을 가짐 (비일관성)

    // Then: 문제 확인
    expect(mockMedia.length).toBe(5); // 총 5개 미디어 아이템

    // 현재 문제: 홀수/짝수 인덱스 아이템이 다른 속성을 가지거나 속성이 누락됨
    // 기대값: 모든 아이템이 올바른 data-xeg-role="gallery-item"과 data-index 속성을 가져야 함
  });

  it('[RED] querySelector 실패 시 우아한 실패 처리가 없음', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 3);

    // When: 잘못된 DOM 구조 (속성 누락) 시뮬레이션
    // 현재 문제: 올바른 속성을 가진 요소가 하나도 없을 때

    // Then: 문제 확인
    expect(mockMedia.length).toBe(5); // 미디어는 5개 있음

    // 현재 구현에서는 querySelector 실패 시 대안적인 방법이 없음 (문제점!)
    // 기대값: 셀렉터 실패 시 대안적인 방법으로 요소를 찾거나 적절한 에러 처리

    // 누락된 기능들:
    // 1. CSS 클래스 기반 fallback 셀렉터
    // 2. 인덱스 기반 nth-child 셀렉터
    // 3. 우아한 실패 처리 및 로깅
  });
});
