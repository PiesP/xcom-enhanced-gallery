/**
 * Phase 1: 타이밍과 상태 동기화 문제 진단
 * 현재 문제: 비동기 상태 업데이트와 DOM 변화 간의 타이밍 이슈
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { galleryState, openGallery } from '@shared/state/signals/gallery.signals';
import {
  navigationIntentState,
  resetIntent,
  markUserScroll,
  setToolbarIntent,
} from '@shared/state/signals/navigation-intent.signals';

describe('Phase 1: 타이밍과 상태 동기화 문제 진단 (RED)', () => {
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

  it('[RED] toolbar intent와 galleryState 업데이트 간의 타이밍 동기화 실패', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 1);
    const initialIndex = galleryState.value.currentIndex;

    // When: 툴바 버튼 클릭 시뮬레이션
    setToolbarIntent('next');

    // Then: 문제 확인
    expect(navigationIntentState.value.intent).toBe('toolbar-next');

    // 현재 문제: setToolbarIntent 호출 후에도 galleryState.currentIndex가 즉시 업데이트되지 않음
    expect(galleryState.value.currentIndex).toBe(initialIndex); // 변화 없음 (문제점!)

    // 기대값: toolbar intent 설정 후 즉시 또는 단기간 내에 currentIndex가 동기화되어야 함
    // 현재: 이 연결고리가 누락되어 있음
  });

  it('[RED] user-scroll intent 후 자동 포커스 이동의 지연 처리 부족', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 2);
    const initialIndex = galleryState.value.currentIndex;

    // When: 사용자 스크롤 시뮬레이션
    markUserScroll();

    // 시간이 지나도 상태 변화 없음
    expect(navigationIntentState.value.intent).toBe('user-scroll');
    expect(galleryState.value.currentIndex).toBe(initialIndex); // 변화 없음

    // Then: 문제 확인
    // 현재 문제: user-scroll intent 후 적절한 지연 시간 뒤에
    // 가장 중앙에 있는 이미지로 자동 포커스 이동이 구현되지 않음

    // 기대 동작:
    // 1. user-scroll → 잠시 대기 (사용자가 추가 스크롤할 수 있도록)
    // 2. 일정 시간(예: 500ms) 후 centerIndex 계산
    // 3. galleryState.currentIndex를 centerIndex로 업데이트
    // 4. intent를 idle로 리셋

    // 현재: 이 전체 플로우가 구현되지 않음 (문제점!)
  });

  it('[RED] 연속적인 상태 변화 시 중간 상태 누락', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 0);

    // When: 빠른 연속 상태 변화 시뮬레이션
    setToolbarIntent('next'); // 1단계
    markUserScroll(); // 2단계 (사용자가 동시에 스크롤)
    setToolbarIntent('prev'); // 3단계 (사용자가 다시 버튼 클릭)

    // Then: 문제 확인
    const finalIntent = navigationIntentState.value.intent;

    // 마지막 intent만 남고 중간 과정이 무시됨 (문제점!)
    expect(finalIntent).toBe('toolbar-prev'); // 마지막 호출만 반영

    // 현재 문제:
    // 1. 중간 상태들(toolbar-next, user-scroll)이 처리되지 않음
    // 2. 각 상태에 따른 적절한 처리 로직이 누락됨
    // 3. 상태 변화 큐잉이나 순차 처리 메커니즘이 없음

    // 기대값: 각 상태 변화가 순차적으로 처리되어야 함
  });

  it('[RED] 비동기 DOM 업데이트와 상태 동기화 간격', () => {
    // Given: 갤러리가 열려있음
    openGallery(mockMedia, 1);

    // When: 상태 변화가 일어났다고 가정
    const beforeState = {
      currentIndex: galleryState.value.currentIndex,
      intent: navigationIntentState.value.intent,
    };

    // 상태 변화 시뮬레이션
    setToolbarIntent('next');

    // Then: 문제 확인
    const afterState = {
      currentIndex: galleryState.value.currentIndex,
      intent: navigationIntentState.value.intent,
    };

    // intent는 즉시 변경되지만 currentIndex는 변경되지 않음 (문제점!)
    expect(beforeState.intent).toBe('idle');
    expect(afterState.intent).toBe('toolbar-next'); // intent는 변경됨
    expect(beforeState.currentIndex).toBe(afterState.currentIndex); // currentIndex는 동일 (문제점!)

    // 현재 문제:
    // 1. intent 변화와 currentIndex 변화가 동기화되지 않음
    // 2. DOM 렌더링과 상태 업데이트 간의 타이밍 차이
    // 3. 비동기 처리 로직의 부재

    // 기대값: intent 변화 시 적절한 시점에 currentIndex도 동기화되어야 함
  });

  it('[RED] 상태 리셋 타이밍의 일관성 부족', () => {
    // Given: 갤러리가 열려있고 여러 상태 변화가 있었음
    openGallery(mockMedia, 3);
    markUserScroll();
    setToolbarIntent('next');

    // When: 상태 리셋 시뮬레이션
    resetIntent();

    // Then: 문제 확인
    expect(navigationIntentState.value.intent).toBe('idle'); // intent는 리셋됨

    // 현재 문제: intent는 리셋되지만 관련된 다른 상태들은 리셋되지 않음
    expect(galleryState.value.currentIndex).not.toBe(0); // currentIndex는 리셋되지 않음

    // 기대값: 상태 리셋 시 관련된 모든 상태가 일관성 있게 리셋되어야 함
    // 또는 명확한 리셋 범위가 정의되어야 함

    // 누락된 기능:
    // 1. 전체 상태 리셋 vs 부분 상태 리셋의 명확한 구분
    // 2. 리셋 시점에 대한 명확한 규칙
    // 3. 리셋 후 일관성 검증 로직
  });
});
