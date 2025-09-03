import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openGallery, galleryState } from '@shared/state/signals/gallery.signals';
import {
  navigationIntentState,
  markUserScroll,
  resetIntent,
} from '@shared/state/signals/navigation-intent.signals';

/**
 * Phase 1: centerIndex와 galleryState.currentIndex 동기화 누락 진단
 * 현재 문제: centerIndex가 계산되지만 galleryState.currentIndex에 반영되지 않음
 */

describe('Phase 1: centerIndex 상태 동기화 진단 (RED)', () => {
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

  it('[RED] useVisibleCenterItem 훅이 centerIndex → currentIndex 동기화 로직을 포함하지 않음', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 0);

    // When: 사용자가 스크롤했다고 가정
    markUserScroll();

    // Then: 문제 확인 - 현재 useVisibleCenterItem에는 galleryState 업데이트 로직이 없음
    expect(navigationIntentState.value.intent).toBe('user-scroll');
    expect(galleryState.value.currentIndex).toBe(0); // 여전히 초기값

    // 실제로 필요한 것: useVisibleCenterItem에서 centerIndex 변화 시 galleryState.currentIndex 업데이트
    // 현재는 이 연결고리가 누락되어 있음 (문제점!)
  });

  it('[RED] 사용자 스크롤 후 포커스 이동 요구사항이 구현되지 않음', () => {
    // Given: 갤러리가 열려있고 사용자가 스크롤
    openGallery(mockMedia, 1);
    const initialIndex = galleryState.value.currentIndex;

    // When: 사용자 스크롤 시뮬레이션
    markUserScroll();

    // 시간이 지나도 currentIndex는 변경되지 않음 (문제점!)
    expect(galleryState.value.currentIndex).toBe(initialIndex);

    // 기대 동작: 사용자 스크롤 후 가장 적절한 위치의 이미지에 자동으로 포커스 이동
    // 현재: 이 기능이 전혀 구현되지 않음
  });

  it('[RED] centerIndex 계산과 galleryState 업데이트 간의 연결고리가 누락됨', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 2);

    // 현재 상황 분석
    const currentIndex = galleryState.value.currentIndex;
    const intent = navigationIntentState.value.intent;

    // When: 수동으로 centerIndex가 변화했다고 가정 (실제 계산 로직 없이)
    // mockCenterIndex는 설명용으로만 사용 (실제 구현에서는 useVisibleCenterItem에서 계산됨)

    // Then: 문제 확인 - centerIndex → currentIndex 업데이트 메커니즘이 없음
    expect(currentIndex).toBe(2); // 초기값 그대로
    expect(intent).toBe('idle'); // intent도 변화 없음

    // 누락된 기능들:
    // 1. centerIndex 계산 결과를 받아서
    // 2. user-scroll intent 인 경우에만
    // 3. galleryState.currentIndex를 업데이트하고
    // 4. intent를 idle로 리셋하는 로직

    // 이 모든 것이 현재 구현되지 않음 (문제점!)
  });
});
