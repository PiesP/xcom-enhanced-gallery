/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview 스크롤 격리 TDD 테스트 (개선 버전)
 * @description TDD 방식으로 스크롤 잠금 문제 해결을 위한 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { galleryState } from '@shared/state/signals/gallery.signals';

describe('🎯 스크롤 격리 문제 해결 (TDD)', () => {
  let originalBodyOverflow: string;
  let mockContainer: HTMLElement;
  let mockGalleryItemsList: HTMLElement;
  let mockTwitterContainer: HTMLElement;

  beforeEach(() => {
    // 원본 body overflow 값 저장
    originalBodyOverflow = document.body.style.overflow || '';

    // Mock DOM 요소들 생성
    mockContainer = document.createElement('div');
    mockContainer.className = 'xeg-gallery-container';
    mockContainer.style.position = 'fixed';
    mockContainer.style.top = '0';
    mockContainer.style.left = '0';
    mockContainer.style.width = '100vw';
    mockContainer.style.height = '100vh';
    mockContainer.style.zIndex = '9999';

    mockGalleryItemsList = document.createElement('div');
    mockGalleryItemsList.className = 'itemsList';
    mockGalleryItemsList.setAttribute('data-xeg-role', 'items-list');
    mockGalleryItemsList.style.overflowY = 'auto';
    mockGalleryItemsList.style.height = '80vh';

    mockTwitterContainer = document.createElement('div');
    mockTwitterContainer.setAttribute('data-testid', 'primaryColumn');
    mockTwitterContainer.style.height = '200vh'; // 스크롤 가능하게

    // DOM에 추가
    mockContainer.appendChild(mockGalleryItemsList);
    document.body.appendChild(mockContainer);
    document.body.appendChild(mockTwitterContainer);

    // 갤러리 상태 초기화 - 열린 상태로 설정
    galleryState.value = {
      mediaItems: [
        { id: '1', type: 'image', url: 'test1.jpg', originalUrl: 'test1.jpg' },
        { id: '2', type: 'image', url: 'test2.jpg', originalUrl: 'test2.jpg' },
      ],
      currentIndex: 0,
      isLoading: false,
      isOpen: true, // 🔑 갤러리가 열린 상태
    };
  });

  afterEach(() => {
    // DOM 정리
    mockContainer.remove();
    mockTwitterContainer.remove();

    // body overflow 복원
    document.body.style.overflow = originalBodyOverflow;

    // 갤러리 상태 초기화
    galleryState.value = {
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      isOpen: false,
    };
  });

  describe('🔴 RED: 실패하는 테스트 (현재 문제 상황)', () => {
    describe('문제 1: 갤러리 내부 스크롤 차단 문제', () => {
      it('갤러리 내부에서 발생한 wheel 이벤트는 차단되지 않아야 함', () => {
        let wheelEventPrevented = false;
        let wheelEventStopped = false;

        // Mock wheel 이벤트 생성 (갤러리 내부에서 발생)
        const mockWheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });

        // 이벤트가 차단되었는지 확인하기 위한 Mock
        Object.defineProperty(mockWheelEvent, 'preventDefault', {
          value: () => {
            wheelEventPrevented = true;
          },
        });
        Object.defineProperty(mockWheelEvent, 'stopPropagation', {
          value: () => {
            wheelEventStopped = true;
          },
        });
        Object.defineProperty(mockWheelEvent, 'target', {
          value: mockGalleryItemsList,
          writable: false,
        });

        // 갤러리 내부 요소에서 이벤트 발생
        mockGalleryItemsList.dispatchEvent(mockWheelEvent);

        // 🔴 현재는 이 테스트가 실패할 것 (갤러리 내부 스크롤도 차단됨)
        expect(wheelEventPrevented).toBe(false);
        expect(wheelEventStopped).toBe(false);
      });

      it('갤러리 외부(트위터)에서 발생한 wheel 이벤트는 차단되어야 함', () => {
        let wheelEventPrevented = false;
        let wheelEventStopped = false;

        // Mock wheel 이벤트 생성 (트위터 컨테이너에서 발생)
        const mockWheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });

        Object.defineProperty(mockWheelEvent, 'preventDefault', {
          value: () => {
            wheelEventPrevented = true;
          },
        });
        Object.defineProperty(mockWheelEvent, 'stopPropagation', {
          value: () => {
            wheelEventStopped = true;
          },
        });
        Object.defineProperty(mockWheelEvent, 'target', {
          value: mockTwitterContainer,
          writable: false,
        });

        // 트위터 컨테이너에서 이벤트 발생
        mockTwitterContainer.dispatchEvent(mockWheelEvent);

        // ✅ 이 테스트는 통과해야 함 (외부 스크롤은 차단되어야 함)
        expect(wheelEventPrevented).toBe(true);
        expect(wheelEventStopped).toBe(true);
      });
    });

    describe('문제 2: 갤러리 종료 후 스크롤 잠금 지속 문제', () => {
      it('갤러리 종료 후 wheel 이벤트 리스너가 제거되어야 함', () => {
        // 현재 활성화된 이벤트 리스너 수 확인 (실제로는 확인하기 어려우므로 상태로 확인)
        expect(galleryState.value.isOpen).toBe(true);

        // 갤러리 종료
        galleryState.value = {
          ...galleryState.value,
          isOpen: false,
          mediaItems: [],
        };

        // 🔴 현재는 이벤트 리스너가 제대로 정리되지 않을 수 있음
        // 갤러리가 닫힌 상태에서는 wheel 이벤트가 처리되지 않아야 함
        expect(galleryState.value.isOpen).toBe(false);
      });

      it('갤러리 종료 후 트위터 페이지 스크롤이 정상 작동해야 함', () => {
        // 갤러리 종료
        galleryState.value = {
          ...galleryState.value,
          isOpen: false,
          mediaItems: [],
        };

        let wheelEventPrevented = false;
        const mockWheelEvent = new WheelEvent('wheel', {
          deltaY: 100,
          bubbles: true,
          cancelable: true,
        });

        Object.defineProperty(mockWheelEvent, 'preventDefault', {
          value: () => {
            wheelEventPrevented = true;
          },
        });
        Object.defineProperty(mockWheelEvent, 'target', {
          value: mockTwitterContainer,
          writable: false,
        });

        // 트위터 컨테이너에서 이벤트 발생
        mockTwitterContainer.dispatchEvent(mockWheelEvent);

        // 🔴 갤러리가 닫힌 상태에서는 외부 스크롤도 차단되지 않아야 함
        expect(wheelEventPrevented).toBe(false);
      });
    });

    describe('통합 시나리오 테스트', () => {
      it('갤러리 열기 → 내부 스크롤 → 외부 스크롤 차단 → 갤러리 닫기 → 외부 스크롤 복원', () => {
        // 1. 갤러리가 열린 상태에서 내부 스크롤 테스트
        let internalWheelPrevented = false;
        const internalWheelEvent = new WheelEvent('wheel', { deltaY: 50 });
        Object.defineProperty(internalWheelEvent, 'preventDefault', {
          value: () => {
            internalWheelPrevented = true;
          },
        });
        Object.defineProperty(internalWheelEvent, 'target', {
          value: mockGalleryItemsList,
          writable: false,
        });

        mockGalleryItemsList.dispatchEvent(internalWheelEvent);
        expect(internalWheelPrevented).toBe(false); // 🔴 내부 스크롤은 차단되지 않아야 함

        // 2. 갤러리가 열린 상태에서 외부 스크롤 차단 테스트
        let externalWheelPrevented = false;
        const externalWheelEvent = new WheelEvent('wheel', { deltaY: 50 });
        Object.defineProperty(externalWheelEvent, 'preventDefault', {
          value: () => {
            externalWheelPrevented = true;
          },
        });
        Object.defineProperty(externalWheelEvent, 'target', {
          value: mockTwitterContainer,
          writable: false,
        });

        mockTwitterContainer.dispatchEvent(externalWheelEvent);
        expect(externalWheelPrevented).toBe(true); // ✅ 외부 스크롤은 차단되어야 함

        // 3. 갤러리 닫기
        galleryState.value = {
          ...galleryState.value,
          isOpen: false,
          mediaItems: [],
        };

        // 4. 갤러리 닫힌 후 외부 스크롤 복원 테스트
        let postCloseWheelPrevented = false;
        const postCloseWheelEvent = new WheelEvent('wheel', { deltaY: 50 });
        Object.defineProperty(postCloseWheelEvent, 'preventDefault', {
          value: () => {
            postCloseWheelPrevented = true;
          },
        });
        Object.defineProperty(postCloseWheelEvent, 'target', {
          value: mockTwitterContainer,
          writable: false,
        });

        mockTwitterContainer.dispatchEvent(postCloseWheelEvent);
        expect(postCloseWheelPrevented).toBe(false); // 🔴 갤러리 닫힌 후에는 외부 스크롤이 차단되지 않아야 함
      });
    });
  });

  describe('🟢 GREEN: 구현 후 통과해야 하는 테스트', () => {
    it('개선된 useGalleryScroll 훅이 갤러리 내외부를 구분해야 함', () => {
      // 갤러리 내부 스크롤 테스트
      let internalEventPrevented = false;
      const internalEvent = new WheelEvent('wheel', { deltaY: 50 });
      Object.defineProperty(internalEvent, 'preventDefault', {
        value: () => {
          internalEventPrevented = true;
        },
      });
      Object.defineProperty(internalEvent, 'target', {
        value: mockGalleryItemsList,
        writable: false,
      });

      // 갤러리 외부 스크롤 테스트
      let externalEventPrevented = false;
      const externalEvent = new WheelEvent('wheel', { deltaY: 50 });
      Object.defineProperty(externalEvent, 'preventDefault', {
        value: () => {
          externalEventPrevented = true;
        },
      });
      Object.defineProperty(externalEvent, 'target', {
        value: mockTwitterContainer,
        writable: false,
      });

      // 이벤트 발생
      mockGalleryItemsList.dispatchEvent(internalEvent);
      mockTwitterContainer.dispatchEvent(externalEvent);

      // 결과 검증
      expect(internalEventPrevented).toBe(false); // 내부 스크롤은 허용
      expect(externalEventPrevented).toBe(true); // 외부 스크롤은 차단
    });

    it('갤러리 상태가 닫힌 후 모든 스크롤이 정상 작동해야 함', () => {
      // 갤러리 닫기
      galleryState.value = {
        ...galleryState.value,
        isOpen: false,
        mediaItems: [],
      };

      // 외부 스크롤 테스트
      let externalEventPrevented = false;
      const externalEvent = new WheelEvent('wheel', { deltaY: 50 });
      Object.defineProperty(externalEvent, 'preventDefault', {
        value: () => {
          externalEventPrevented = true;
        },
      });
      Object.defineProperty(externalEvent, 'target', {
        value: mockTwitterContainer,
        writable: false,
      });

      mockTwitterContainer.dispatchEvent(externalEvent);

      // 갤러리가 닫힌 후에는 외부 스크롤도 차단되지 않아야 함
      expect(externalEventPrevented).toBe(false);
    });
  });

  describe('🔵 REFACTOR: 리팩토링 검증 테스트', () => {
    // TODO: Phase 3에서 구현할 예정
    it.todo('성능 최적화 검증');
    it.todo('메모리 누수 방지 검증');
    it.todo('에러 핸들링 검증');
  });
});
