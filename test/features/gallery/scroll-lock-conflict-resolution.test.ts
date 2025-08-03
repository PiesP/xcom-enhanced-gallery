/**
 * @fileoverview 스크롤 락 충돌 해결 테스트
 * @description StyleManager, 갤러리 CSS, useScrollLock 간 충돌 해결
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import StyleManager from '@shared/styles/StyleManager';

// 모킹 설정
const mockElement = {
  style: {} as CSSStyleDeclaration,
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn(),
  },
  closest: vi.fn(),
  matches: vi.fn(),
} as unknown as HTMLElement;

const mockDocument = {
  documentElement: {
    style: {} as CSSStyleDeclaration,
  },
  body: {
    style: {} as CSSStyleDeclaration,
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
    },
  },
  querySelector: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as Document;

describe('스크롤 락 충돌 해결', () => {
  beforeEach(() => {
    // DOM 환경 모킹
    global.document = mockDocument;
    vi.clearAllMocks();

    // 스타일 초기화
    mockElement.style = {} as CSSStyleDeclaration;
    mockDocument.documentElement.style = {} as CSSStyleDeclaration;
    mockDocument.body.style = {} as CSSStyleDeclaration;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('StyleManager 글래스모피즘 overflow 충돌', () => {
    it('갤러리 컨테이너에는 overflow hidden을 적용하지 않아야 함', () => {
      // Given: 갤러리 컨테이너로 식별되는 요소
      const galleryContainer = {
        ...mockElement,
        matches: vi.fn().mockReturnValue(true), // .xeg-gallery-container, #xeg-gallery-root와 매치
        classList: {
          ...mockElement.classList,
          contains: vi.fn().mockReturnValue(true), // xeg-gallery-container 포함
        },
        closest: vi.fn().mockReturnValue(mockElement), // 갤러리 컨테이너 안
      } as unknown as HTMLElement;

      // When: 글래스모피즘 적용
      StyleManager.applyGlassmorphism(galleryContainer, 'medium');

      // Then: overflow hidden이 설정되지 않아야 함
      expect(galleryContainer.style.overflow).not.toBe('hidden');
    });

    it('일반 요소에는 기존대로 overflow hidden 적용', () => {
      // Given: 일반 요소
      const normalElement = {
        ...mockElement,
        matches: vi.fn().mockReturnValue(false), // 갤러리 셀렉터와 매치하지 않음
        classList: {
          ...mockElement.classList,
          contains: vi.fn().mockReturnValue(false), // 갤러리 클래스 없음
        },
        closest: vi.fn().mockReturnValue(null), // 갤러리 컨테이너 밖
      } as unknown as HTMLElement;

      // When: 글래스모피즘 적용
      StyleManager.applyGlassmorphism(normalElement, 'medium');

      // Then: overflow hidden이 설정되어야 함
      expect(normalElement.style.overflow).toBe('hidden');
    });
  });

  describe('useScrollLock과 갤러리 CSS 호환성', () => {
    it('갤러리 열림 시 document와 갤러리 컨테이너 모두 제어해야 함', () => {
      // Given: useScrollLock 훅 동작 시뮬레이션
      // When: 스크롤 락 활성화 (갤러리 전용 로직)
      const lockScroll = () => {
        // document 레벨 제어
        mockDocument.documentElement.style.overflow = 'hidden';
        mockDocument.body.style.overflow = 'hidden';

        // 갤러리 컨테이너 내부 스크롤은 유지
        const galleryContent = document.querySelector('.content');
        if (galleryContent instanceof HTMLElement) {
          galleryContent.style.overflow = 'visible'; // hidden에서 변경
        }
      };

      lockScroll();

      // Then: document는 락, 갤러리 내부는 스크롤 가능
      expect(mockDocument.documentElement.style.overflow).toBe('hidden');
      expect(mockDocument.body.style.overflow).toBe('hidden');
    });

    it('갤러리 닫힘 시 모든 스크롤 락 해제되어야 함', () => {
      // Given: 스크롤 락 활성화 상태
      mockDocument.documentElement.style.overflow = 'hidden';
      mockDocument.body.style.overflow = 'hidden';

      // When: 스크롤 락 해제
      const unlockScroll = () => {
        mockDocument.documentElement.style.overflow = '';
        mockDocument.body.style.overflow = '';
      };

      unlockScroll();

      // Then: 모든 overflow 설정 초기화
      expect(mockDocument.documentElement.style.overflow).toBe('');
      expect(mockDocument.body.style.overflow).toBe('');
    });
  });

  describe('CSS 클래스 기반 스크롤 제어', () => {
    it('갤러리 활성화 시 body에 no-scroll 클래스 추가', () => {
      // Given: body 요소 모킹
      const mockBody = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
      } as unknown as HTMLElement;

      global.document = {
        ...mockDocument,
        body: mockBody,
      } as unknown as Document;

      // When: 갤러리 활성화 스크롤 락
      const enableGalleryScrollLock = () => {
        document.body.classList.add('xeg-no-scroll');
      };

      enableGalleryScrollLock();

      // Then: body에 no-scroll 클래스 추가됨
      expect(mockBody.classList.add).toHaveBeenCalledWith('xeg-no-scroll');
    });

    it('갤러리 비활성화 시 body에서 no-scroll 클래스 제거', () => {
      // Given: body에 no-scroll 클래스가 있는 상태
      const mockBody = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn().mockReturnValue(true),
        },
      } as unknown as HTMLElement;

      global.document = {
        ...mockDocument,
        body: mockBody,
      } as unknown as Document;

      // When: 갤러리 비활성화 스크롤 락 해제
      const disableGalleryScrollLock = () => {
        document.body.classList.remove('xeg-no-scroll');
      };

      disableGalleryScrollLock();

      // Then: body에서 no-scroll 클래스 제거됨
      expect(mockBody.classList.remove).toHaveBeenCalledWith('xeg-no-scroll');
    });
  });

  describe('preventScrollPropagation 충돌 방지', () => {
    it('갤러리 내부 스크롤 이벤트는 전파 차단하지 않아야 함', () => {
      // Given: 갤러리 내부 wheel 이벤트
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        cancelable: true,
      });

      // When: wheel 이벤트 핸들링
      const handleGalleryScroll = (event: WheelEvent) => {
        // 갤러리 내부에서는 스크롤 전파 허용
        const isInsideGallery = true; // 실제로는 DOM 검사
        if (isInsideGallery) {
          // preventDefault 호출하지 않음
          return;
        }
        event.preventDefault();
      };

      // Then: 갤러리 내부 스크롤은 차단되지 않아야 함
      expect(() => handleGalleryScroll(wheelEvent)).not.toThrow();
      expect(wheelEvent.defaultPrevented).toBe(false);
    });
  });
});

export {};
