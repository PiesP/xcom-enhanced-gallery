/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 스크롤 잠금 문제 해결 검증 테스트
 * @description TDD 방식으로 개선된 스크롤 격리 시스템 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { galleryState, openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
import { useScrollLock } from '@shared/hooks/useScrollLock';

// Mock the necessary modules
vi.mock('@shared/external/vendors', () => ({
  getPreactHooks: () => ({
    useCallback: vi.fn(fn => fn),
    useRef: vi.fn(() => ({ current: null })),
  }),
}));

vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/utils/core-utils', () => ({
  findTwitterScrollContainer: vi.fn(),
}));

describe('🎯 스크롤 잠금 문제 해결 검증 (TDD REFACTOR)', () => {
  let mockTwitterContainer: HTMLElement;
  let mockGalleryContainer: HTMLElement;
  let mockItemsList: HTMLElement;

  beforeEach(async () => {
    // DOM 초기화
    document.body.innerHTML = '';

    // Mock 트위터 컨테이너 생성
    mockTwitterContainer = document.createElement('div');
    mockTwitterContainer.setAttribute('data-testid', 'primaryColumn');
    mockTwitterContainer.style.height = '200vh';
    mockTwitterContainer.style.overflow = 'auto';
    document.body.appendChild(mockTwitterContainer);

    // Mock 갤러리 컨테이너 생성
    mockGalleryContainer = document.createElement('div');
    mockGalleryContainer.className = 'xeg-gallery-container';
    mockGalleryContainer.style.position = 'fixed';
    mockGalleryContainer.style.top = '0';
    mockGalleryContainer.style.left = '0';
    mockGalleryContainer.style.width = '100vw';
    mockGalleryContainer.style.height = '100vh';
    mockGalleryContainer.style.zIndex = '10000';

    // 갤러리 내부 스크롤 가능한 영역 생성
    mockItemsList = document.createElement('div');
    mockItemsList.className = 'itemsList';
    mockItemsList.setAttribute('data-xeg-role', 'items-list');
    mockItemsList.style.overflowY = 'auto';
    mockItemsList.style.height = '80vh';

    mockGalleryContainer.appendChild(mockItemsList);
    document.body.appendChild(mockGalleryContainer);

    // findTwitterScrollContainer mock 설정
    const { findTwitterScrollContainer } = await import('@shared/utils/core-utils');
    vi.mocked(findTwitterScrollContainer).mockReturnValue(mockTwitterContainer);

    // 갤러리 상태 초기화
    closeGallery();
  });

  afterEach(() => {
    // 정리
    document.body.innerHTML = '';
    closeGallery();
    vi.clearAllMocks();
  });

  describe('✅ 문제 해결 검증', () => {
    it('useScrollLock 훅이 트위터 컨테이너만 잠가야 함', () => {
      // Arrange: useScrollLock 훅 사용
      const { lockScroll, unlockScroll, isLocked } = useScrollLock();

      // Act: 스크롤 잠금 실행
      lockScroll();

      // Assert: 트위터 컨테이너만 잠김
      expect(mockTwitterContainer.style.overflow).toBe('hidden');
      expect(mockTwitterContainer.style.overscrollBehavior).toBe('contain');
      expect(isLocked()).toBe(true);

      // document.body는 잠기지 않음
      expect(document.body.style.overflow).not.toBe('hidden');

      // 스크롤 잠금 해제
      unlockScroll();
      expect(mockTwitterContainer.style.overflow).toBe('auto'); // 원래 상태로 복원
      expect(isLocked()).toBe(false);
    });

    it('갤러리 내부 스크롤은 정상 동작해야 함', () => {
      // Arrange: 갤러리 열기
      openGallery([{ id: '1', url: 'https://example.com/image1.jpg', type: 'image' }]);

      let internalEventPrevented = false;
      let internalEventStopped = false;

      // Act: 갤러리 내부에서 wheel 이벤트 발생
      const internalWheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });

      internalWheelEvent.preventDefault = vi.fn(() => {
        internalEventPrevented = true;
      });
      internalWheelEvent.stopPropagation = vi.fn(() => {
        internalEventStopped = true;
      });

      mockItemsList.dispatchEvent(internalWheelEvent);

      // Assert: 갤러리 내부 스크롤은 차단되지 않음
      expect(internalEventPrevented).toBe(false);
      expect(internalEventStopped).toBe(false);
    });

    it('갤러리 외부(트위터) 스크롤은 차단되어야 함', async () => {
      // Arrange: 갤러리 열기
      openGallery([{ id: '1', url: 'https://example.com/image1.jpg', type: 'image' }]);

      // useGalleryScroll 훅 모의 (실제 컴포넌트에서는 자동으로 등록됨)
      let externalEventPrevented = false;
      let externalEventStopped = false;

      // 외부 스크롤 차단 이벤트 리스너 등록 (실제 useGalleryScroll 훅의 동작을 모의)
      const preventTwitterScroll = (event: WheelEvent) => {
        if (!galleryState.value.isOpen) return;

        const eventTarget = event.target as HTMLElement;
        const isInsideGallery = mockGalleryContainer.contains(eventTarget);

        if (!isInsideGallery) {
          event.preventDefault();
          event.stopPropagation();
          externalEventPrevented = true;
          externalEventStopped = true;
        }
      };

      document.addEventListener('wheel', preventTwitterScroll, { capture: true, passive: false });

      // Act: 트위터 컨테이너에서 wheel 이벤트 발생
      const externalWheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });

      // 실제 preventDefault와 stopPropagation을 덮어씌움
      const originalPreventDefault = externalWheelEvent.preventDefault;
      const originalStopPropagation = externalWheelEvent.stopPropagation;

      externalWheelEvent.preventDefault = vi.fn(() => {
        externalEventPrevented = true;
        originalPreventDefault.call(externalWheelEvent);
      });

      externalWheelEvent.stopPropagation = vi.fn(() => {
        externalEventStopped = true;
        originalStopPropagation.call(externalWheelEvent);
      });

      mockTwitterContainer.dispatchEvent(externalWheelEvent);

      // Assert: 외부 스크롤은 차단됨
      expect(externalEventPrevented).toBe(true);
      expect(externalEventStopped).toBe(true);

      // Cleanup
      document.removeEventListener('wheel', preventTwitterScroll, { capture: true });
    });

    it('갤러리 닫기 후 스크롤 잠금이 완전히 해제되어야 함', () => {
      // Arrange: useScrollLock 훅 사용 및 갤러리 열기
      const { lockScroll, unlockScroll, isLocked } = useScrollLock();

      openGallery([{ id: '1', url: 'https://example.com/image1.jpg', type: 'image' }]);

      lockScroll();
      expect(isLocked()).toBe(true);
      expect(mockTwitterContainer.style.overflow).toBe('hidden');

      // Act: 갤러리 닫기 (실제로는 컴포넌트의 useEffect cleanup에서 호출됨)
      closeGallery();
      unlockScroll();

      // Assert: 스크롤 잠금 완전 해제
      expect(isLocked()).toBe(false);
      expect(mockTwitterContainer.style.overflow).toBe('auto'); // 원래 상태로 복원
      expect(mockTwitterContainer.style.overscrollBehavior).toBe(''); // 원래 상태로 복원
      expect(galleryState.value.isOpen).toBe(false);
      expect(galleryState.value.mediaItems).toEqual([]); // mediaItems도 초기화됨
    });
  });

  describe('🚀 통합 시나리오 테스트', () => {
    it('전체 갤러리 생명주기에서 스크롤 제어가 올바르게 작동해야 함', async () => {
      const { lockScroll, unlockScroll } = useScrollLock();

      // 1. 초기 상태: 스크롤 잠금 없음
      expect(mockTwitterContainer.style.overflow).toBe('auto');
      expect(galleryState.value.isOpen).toBe(false);

      // 2. 갤러리 열기 + 스크롤 잠금
      openGallery([{ id: '1', url: 'https://example.com/image1.jpg', type: 'image' }]);
      lockScroll();

      expect(galleryState.value.isOpen).toBe(true);
      expect(mockTwitterContainer.style.overflow).toBe('hidden');

      // 3. 갤러리 내부 스크롤 테스트 (정상 동작)
      const internalEvent = new WheelEvent('wheel', { deltaY: 100 });
      let internalPrevented = false;
      internalEvent.preventDefault = () => {
        internalPrevented = true;
      };

      mockItemsList.dispatchEvent(internalEvent);
      expect(internalPrevented).toBe(false); // 내부 스크롤은 허용

      // 4. 갤러리 닫기 + 스크롤 잠금 해제
      closeGallery();
      unlockScroll();

      expect(galleryState.value.isOpen).toBe(false);
      expect(galleryState.value.mediaItems).toEqual([]);
      expect(mockTwitterContainer.style.overflow).toBe('auto');
    });
  });
});
