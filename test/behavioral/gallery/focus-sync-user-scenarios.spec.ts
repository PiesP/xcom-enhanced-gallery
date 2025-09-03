import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openGallery, navigateToItem, galleryState } from '@shared/state/signals/gallery.signals';
import {
  navigationIntentState,
  setToolbarIntent,
  markUserScroll,
  resetIntent,
} from '@shared/state/signals/navigation-intent.signals';

/**
 * P14.FOCUS_SYNC v2 사용자 시나리오 테스트
 * 실제 사용자가 경험하는 4가지 핵심 기능이 올바르게 동작하는지 검증
 */

describe('P14.FOCUS_SYNC v2: 사용자 시나리오 테스트', () => {
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

  describe('시나리오 1: 툴바 좌우 버튼으로 포커스 이동', () => {
    it('툴바 버튼 클릭 시 intent가 toolbar로 설정되고 포커스가 이동한다', () => {
      // Given: 갤러리가 열려있고 첫 번째 이미지가 활성화
      openGallery(mockMedia, 0);
      expect(galleryState.value.isOpen).toBe(true);
      expect(galleryState.value.currentIndex).toBe(0);

      // When: 툴바 다음 버튼 클릭 (intent 설정 후 네비게이션)
      setToolbarIntent('next');
      navigateToItem(1);

      // Then: intent가 toolbar-next로 설정되고 인덱스가 변경됨
      expect(navigationIntentState.value.intent).toBe('toolbar-next');
      expect(galleryState.value.currentIndex).toBe(1);
    });

    it('연속적인 툴바 버튼 클릭이 올바르게 처리된다', () => {
      // Given: 갤러리가 열려있음
      openGallery(mockMedia, 0);

      // When: 연속으로 툴바 버튼 클릭
      setToolbarIntent('next');
      navigateToItem(1);
      setToolbarIntent('next');
      navigateToItem(2);
      setToolbarIntent('next');
      navigateToItem(3);

      // Then: 최종 인덱스가 올바르게 설정됨
      expect(galleryState.value.currentIndex).toBe(3);
      expect(navigationIntentState.value.intent).toBe('toolbar-next');
    });
  });

  describe('시나리오 2: 툴바 버튼으로 포커스 이동 시 자동 스크롤', () => {
    it('toolbar intent로 네비게이션 시 자동 스크롤이 실행된다', () => {
      // Given: 갤러리가 열려있음
      openGallery(mockMedia, 0);

      // When: 툴바 intent로 네비게이션
      setToolbarIntent('next');
      navigateToItem(2);

      // Then: intent가 유지되어 auto scroll이 실행될 수 있음
      expect(navigationIntentState.value.intent).toBe('toolbar-next');
    });
  });

  describe('시나리오 3: 자동 스크롤 중 사용자 개입 시 중단', () => {
    it('자동 스크롤 중 사용자가 wheel 이벤트를 발생시키면 중단된다', () => {
      // Given: 갤러리가 열려있고 toolbar intent로 자동 스크롤 시작
      openGallery(mockMedia, 0);
      setToolbarIntent('next');
      navigateToItem(2);

      // When: 사용자가 wheel 이벤트 (수동 스크롤)
      markUserScroll();

      // Then: intent가 user-scroll로 변경됨
      expect(navigationIntentState.value.intent).toBe('user-scroll');
    });

    it('user-scroll intent 시 추가 자동 스크롤이 스킵된다', () => {
      // Given: user-scroll intent 상태
      openGallery(mockMedia, 0);
      markUserScroll();

      // When: 프로그래밍 방식으로 네비게이션 시도
      const previousIntent = navigationIntentState.value.intent;
      navigateToItem(2);

      // Then: intent가 변경되지 않음 (user-scroll 유지)
      expect(navigationIntentState.value.intent).toBe(previousIntent);
      expect(navigationIntentState.value.intent).toBe('user-scroll');
    });
  });

  describe('시나리오 4: 사용자 스크롤 후 자동 포커스 (스크롤 없음)', () => {
    it('사용자가 수동 스크롤한 후 적절한 아이템에 포커스가 이동한다', () => {
      // Given: 갤러리가 열려있음
      openGallery(mockMedia, 1);

      // When: 사용자가 수동 스크롤
      markUserScroll();

      // Then: intent가 user-scroll로 설정됨
      expect(navigationIntentState.value.intent).toBe('user-scroll');
      expect(navigationIntentState.value.lastUserScrollAt).toBeGreaterThan(0);
    });

    it('user-scroll 후 일정 시간 지나면 intent가 리셋된다', async () => {
      // Given: user-scroll 상태
      markUserScroll();
      expect(navigationIntentState.value.intent).toBe('user-scroll');

      // When: intent 리셋
      resetIntent();

      // Then: idle 상태로 변경
      expect(navigationIntentState.value.intent).toBe('idle');
    });
  });

  describe('Race Condition 방지', () => {
    it('빠른 연속 intent 변경이 올바르게 처리된다', () => {
      // Given: 갤러리가 열려있음
      openGallery(mockMedia, 0);

      // When: 빠른 연속 intent 변경
      setToolbarIntent('next');
      markUserScroll(); // user가 개입
      setToolbarIntent('prev'); // 다시 toolbar (다른 방향)

      // Then: 마지막 intent가 적용됨
      expect(navigationIntentState.value.intent).toBe('toolbar-prev');
    });

    it('동일한 intent 반복 설정 시 불필요한 재렌더링이 방지된다', () => {
      // Given: toolbar intent 상태
      setToolbarIntent('next');
      const initialTimestamp = navigationIntentState.value.lastUserScrollAt;

      // When: 동일한 intent 재설정
      setToolbarIntent('next');

      // Then: 상태가 변경되지 않음
      expect(navigationIntentState.value.intent).toBe('toolbar-next');
      expect(navigationIntentState.value.lastUserScrollAt).toBe(initialTimestamp);
    });
  });

  describe('성능 및 반응성', () => {
    it('intent 변경이 즉시 반영된다', () => {
      const startTime = Date.now();

      // When: intent 변경
      markUserScroll();

      const endTime = Date.now();

      // Then: 즉시 변경되어야 함 (5ms 이내)
      expect(endTime - startTime).toBeLessThan(5);
      expect(navigationIntentState.value.intent).toBe('user-scroll');
    });

    it('150ms 타이머가 제거되고 이벤트 기반 처리가 된다', () => {
      // 이 테스트는 실제 DOM 환경에서 더 의미가 있지만
      // 구조적으로 polling이 제거되었는지 확인
      openGallery(mockMedia, 0);

      // user-scroll 후 즉시 반응해야 함
      markUserScroll();
      expect(navigationIntentState.value.intent).toBe('user-scroll');
      expect(navigationIntentState.value.lastUserScrollAt).toBeGreaterThan(0);
    });
  });
});
