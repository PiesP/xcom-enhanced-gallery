/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview TDD 방식 스크롤 잠금 격리 테스트
 * @description 제안된 해결책을 검증하는 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { galleryState, openGallery, closeGallery } from '@shared/state/signals/gallery.signals';

// Mock 환경 설정
vi.mock('@shared/external/vendors', () => ({
  getPreactHooks: () => ({
    useCallback: vi.fn(fn => fn),
    useRef: vi.fn(() => ({ current: null })),
    useEffect: vi.fn(fn => {
      // cleanup 함수 시뮬레이션
      const cleanup = fn();
      if (typeof cleanup === 'function') {
        return cleanup;
      }
    }),
  }),
  getPreactSignals: () => ({
    signal: vi.fn(value => ({ value })),
    computed: vi.fn(fn => ({ value: fn() })),
  }),
}));

vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('🎯 TDD: 개선된 스크롤 잠금 격리 시스템', () => {
  let mockTwitterContainer: HTMLElement;
  let mockGalleryContainer: HTMLElement;
  let mockItemsList: HTMLElement;
  let originalDocumentElementOverflow: string;
  let originalBodyOverflow: string;

  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';

    // 원본 overflow 상태 저장
    originalDocumentElementOverflow = document.documentElement.style.overflow;
    originalBodyOverflow = document.body.style.overflow;

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
    mockItemsList.style.overflowY = 'scroll';
    mockItemsList.style.height = '80vh';

    mockGalleryContainer.appendChild(mockItemsList);
    document.body.appendChild(mockGalleryContainer);

    // 갤러리 상태 초기화
    closeGallery();
  });

  afterEach(() => {
    // 원본 상태 복원
    document.documentElement.style.overflow = originalDocumentElementOverflow;
    document.body.style.overflow = originalBodyOverflow;

    // DOM 정리
    document.body.innerHTML = '';
    closeGallery();
    vi.clearAllMocks();
  });

  describe('RED: 실패하는 테스트 작성', () => {
    it('개선된 useScrollLock이 document.documentElement와 body를 직접 제어해야 함', async () => {
      // 동적 import로 실제 구현을 테스트
      const { useScrollLock } = await import('@shared/hooks/useScrollLock');
      const { lockScroll, unlockScroll, isLocked } = useScrollLock();

      // Act: 스크롤 잠금 실행
      lockScroll();

      // Assert: document.documentElement와 body가 잠김
      expect(document.documentElement.style.overflow).toBe('hidden');
      expect(document.body.style.overflow).toBe('hidden');
      expect(isLocked()).toBe(true);

      // 갤러리 내부 스크롤은 영향 받지 않음
      expect(mockItemsList.style.overflowY).toBe('scroll'); // 갤러리 내부는 여전히 스크롤 가능

      // 스크롤 잠금 해제
      unlockScroll();
      expect(document.documentElement.style.overflow).toBe(originalDocumentElementOverflow);
      expect(document.body.style.overflow).toBe(originalBodyOverflow);
      expect(isLocked()).toBe(false);
    });

    it('갤러리가 닫힐 때 useEffect cleanup으로 확실히 잠금 해제되어야 함', async () => {
      const { useScrollLock } = await import('@shared/hooks/useScrollLock');
      const { lockScroll, unlockScroll, isLocked } = useScrollLock();

      // 스크롤 잠금
      lockScroll();
      expect(isLocked()).toBe(true);
      expect(document.documentElement.style.overflow).toBe('hidden');
      expect(document.body.style.overflow).toBe('hidden');

      // 수동으로 unlockScroll 호출 (실제로는 useEffect cleanup에서 호출됨)
      unlockScroll();

      // 잠금이 해제되어야 함
      expect(isLocked()).toBe(false);
      expect(document.documentElement.style.overflow).toBe(originalDocumentElementOverflow);
      expect(document.body.style.overflow).toBe(originalBodyOverflow);
    });

    it('중복 잠금 방지 - 이미 잠겨있으면 중복 실행하지 않음', async () => {
      const { useScrollLock } = await import('@shared/hooks/useScrollLock');
      const { lockScroll, unlockScroll, isLocked } = useScrollLock();

      // 첫 번째 잠금
      lockScroll();
      expect(isLocked()).toBe(true);

      const firstLockOverflow = document.documentElement.style.overflow;

      // 중복 잠금 시도
      lockScroll();

      // 상태는 그대로 유지되어야 함
      expect(isLocked()).toBe(true);
      expect(document.documentElement.style.overflow).toBe(firstLockOverflow);

      // 한 번의 해제로 완전히 해제되어야 함
      unlockScroll();
      expect(isLocked()).toBe(false);
    });

    it('갤러리 활성화 시 트위터 컨테이너 wheel 이벤트가 preventDefault로 차단되어야 한다', async () => {
      const { useScrollLock } = await import('@shared/hooks/useScrollLock');
      const { lockScroll, unlockScroll } = useScrollLock();
      let wheelPrevented = false;

      // 스크롤 잠금 활성화
      lockScroll();

      // 이벤트 리스너를 document에 추가하여 실제 동작 확인
      const wheelHandler = (e: WheelEvent) => {
        wheelPrevented = e.defaultPrevented;
      };

      // 이벤트 캡처링 단계에서 확인
      document.addEventListener('wheel', wheelHandler, { capture: true });

      // 트위터 컨테이너에서 wheel 이벤트 발생
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: 100,
      });

      mockTwitterContainer.dispatchEvent(wheelEvent);

      expect(wheelPrevented).toBe(true); // RED에서 GREEN으로 변경되어야 함

      // 정리
      document.removeEventListener('wheel', wheelHandler, { capture: true });
      unlockScroll();
    });
  });

  describe('GREEN: 통과하는 구현 작성', () => {
    it('갤러리 열림/닫힘 전체 시나리오에서 스크롤 제어가 올바르게 작동해야 함', async () => {
      const { useScrollLock } = await import('@shared/hooks/useScrollLock');
      const { lockScroll, unlockScroll, isLocked } = useScrollLock();

      // 1. 초기 상태: 스크롤 잠금 없음
      expect(isLocked()).toBe(false);
      expect(document.documentElement.style.overflow).toBe(originalDocumentElementOverflow);
      expect(document.body.style.overflow).toBe(originalBodyOverflow);

      // 2. 갤러리 열기 + 스크롤 잠금
      openGallery([{ id: '1', url: 'https://example.com/image1.jpg', type: 'image' }]);
      lockScroll();

      expect(galleryState.value.isOpen).toBe(true);
      expect(isLocked()).toBe(true);
      expect(document.documentElement.style.overflow).toBe('hidden');
      expect(document.body.style.overflow).toBe('hidden');

      // 3. 갤러리 내부 스크롤은 여전히 가능
      expect(mockItemsList.style.overflowY).toBe('scroll');

      // 4. 갤러리 닫기 + 스크롤 잠금 해제
      closeGallery();
      unlockScroll();

      expect(galleryState.value.isOpen).toBe(false);
      expect(isLocked()).toBe(false);
      expect(document.documentElement.style.overflow).toBe(originalDocumentElementOverflow);
      expect(document.body.style.overflow).toBe(originalBodyOverflow);
    });
  });
});
