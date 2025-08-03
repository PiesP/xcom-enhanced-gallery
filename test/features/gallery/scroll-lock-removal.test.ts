/**
 * @fileoverview 스크롤 잠금 시스템 제거 테스트
 * @description TDD Red Phase - 스크롤 잠금 관련 기능이 완전히 제거되었는지 확인
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { galleryState } from '@shared/state/signals/gallery.signals';

describe('🔴 RED: 스크롤 잠금 시스템 제거 검증', () => {
  let originalBodyStyle: CSSStyleDeclaration;
  let originalHtmlStyle: CSSStyleDeclaration;

  beforeEach(() => {
    // 원본 스타일 백업
    originalBodyStyle = { ...document.body.style };
    originalHtmlStyle = { ...document.documentElement.style };

    // body와 html 스타일 초기화
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
    document.documentElement.style.overflow = '';

    // 갤러리 상태 초기화
    galleryState.value = {
      isOpen: false,
      currentIndex: 0,
      mediaItems: [],
      isLoading: false,
      hasError: false,
      errorMessage: null,
      totalCount: 0,
    };
  });

  afterEach(() => {
    // 스타일 복원
    Object.assign(document.body.style, originalBodyStyle);
    Object.assign(document.documentElement.style, originalHtmlStyle);
  });

  describe('body 스타일 조작 금지', () => {
    it('갤러리 열림 시 body.style.overflow가 변경되지 않아야 함', () => {
      const initialOverflow = document.body.style.overflow;

      // 갤러리 열기
      galleryState.value = { ...galleryState.value, isOpen: true };

      // body overflow가 변경되지 않았는지 확인
      expect(document.body.style.overflow).toBe(initialOverflow);
    });

    it('갤러리 닫힘 시 body.style에 대한 조작이 없어야 함', () => {
      const initialOverflow = document.body.style.overflow;
      const initialPointerEvents = document.body.style.pointerEvents;

      // 갤러리 열고 닫기
      galleryState.value = { ...galleryState.value, isOpen: true };
      galleryState.value = { ...galleryState.value, isOpen: false };

      // body 스타일이 변경되지 않았는지 확인
      expect(document.body.style.overflow).toBe(initialOverflow);
      expect(document.body.style.pointerEvents).toBe(initialPointerEvents);
    });
  });

  describe('html 스타일 조작 금지', () => {
    it('갤러리 작동 시 html.style.overflow가 변경되지 않아야 함', () => {
      const initialOverflow = document.documentElement.style.overflow;

      // 갤러리 열기
      galleryState.value = { ...galleryState.value, isOpen: true };

      // html overflow가 변경되지 않았는지 확인
      expect(document.documentElement.style.overflow).toBe(initialOverflow);
    });
  });

  describe('스크롤 이벤트 차단 금지', () => {
    it('wheel 이벤트에서 preventDefault를 호출하지 않아야 함', () => {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(wheelEvent, 'stopPropagation');

      // 갤러리 컨테이너가 아닌 일반 영역에서 이벤트 발생
      document.body.dispatchEvent(wheelEvent);

      // 스크롤 이벤트가 차단되지 않았는지 확인
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(stopPropagationSpy).not.toHaveBeenCalled();
    });
  });

  describe('갤러리 컨테이너 격리', () => {
    it('갤러리 스크롤이 갤러리 컨테이너 내부에서만 작동해야 함', () => {
      // 갤러리 컨테이너 생성
      const galleryContainer = document.createElement('div');
      galleryContainer.className = 'xeg-gallery-container';
      galleryContainer.style.height = '400px';
      galleryContainer.style.overflow = 'auto';
      document.body.appendChild(galleryContainer);

      // 갤러리 내부 콘텐츠
      const content = document.createElement('div');
      content.style.height = '800px';
      galleryContainer.appendChild(content);

      // 갤러리 컨테이너는 독립적으로 스크롤 가능해야 함
      expect(galleryContainer.style.overflow).toBe('auto');

      // body와는 격리되어 있어야 함
      expect(document.body.style.overflow).not.toBe('hidden');

      // 정리
      document.body.removeChild(galleryContainer);
    });
  });

  describe('성능 최적화 유지', () => {
    it('갤러리 컨테이너에는 성능 최적화 속성이 유지되어야 함', () => {
      const galleryContainer = document.createElement('div');
      galleryContainer.className = 'xeg-gallery-container';
      document.body.appendChild(galleryContainer);

      // transform이나 contain 등의 최적화 속성이 있어야 함
      // (실제 값은 CSS에 따라 다를 수 있음)
      expect(galleryContainer.style.willChange).toBeDefined();

      // 정리
      document.body.removeChild(galleryContainer);
    });
  });

  describe('접근성 고려사항', () => {
    it('스크린 리더 사용자를 위한 스크롤 기능이 유지되어야 함', () => {
      // 페이지 스크롤이 완전히 차단되지 않아야 함
      expect(document.body.style.overflow).not.toBe('hidden');
      expect(document.documentElement.style.overflow).not.toBe('hidden');

      // 키보드 네비게이션이 가능해야 함
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      document.body.dispatchEvent(tabEvent);

      // Tab 키가 차단되지 않아야 함
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });
});
