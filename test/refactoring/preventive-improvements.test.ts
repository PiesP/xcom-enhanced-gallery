/**
 * 예방적 개선사항 단위 테스트
 * - Body overflow 복구 보장
 * - 페이지 언로드 시 정리 로직
 *
 * @module PreventiveImprovementsTest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';

// 테스트 대상 모듈들
import {
  initializePageUnloadCleanup,
  forceBodyOverflowRestore,
} from '@shared/browser-environment/page-unload-cleanup';

// DOM mocking utilities
interface MockDocument {
  body: {
    style: { overflow: string };
    classList: { remove: MockInstance };
    removeAttribute: MockInstance;
    className: string;
  } | null;
}

interface MockWindow {
  addEventListener: MockInstance;
  sessionStorage: {
    length: number;
    key: MockInstance;
    removeItem: MockInstance;
  };
}

describe('예방적 개선사항 테스트', () => {
  let mockDocument: MockDocument;
  let mockWindow: MockWindow;
  let originalDocument: typeof global.document;
  let originalWindow: typeof global.window;

  beforeEach(() => {
    // Document mock 설정
    mockDocument = {
      body: {
        style: { overflow: '' },
        classList: { remove: vi.fn() },
        removeAttribute: vi.fn(),
        className: 'some-class xeg-scroll-lock other-class',
      },
    };

    // Window mock 설정
    mockWindow = {
      addEventListener: vi.fn(),
      sessionStorage: {
        length: 3,
        key: vi.fn((index: number) => {
          const keys = ['xeg_scroll_/timeline', 'other_key', 'xeg_scroll_/home'];
          return keys[index] || null;
        }),
        removeItem: vi.fn(),
      },
    };

    // 전역 객체 교체
    originalDocument = global.document;
    originalWindow = global.window;
    global.document = mockDocument as any;
    global.window = mockWindow as any;
  });

  afterEach(() => {
    // 전역 객체 복원
    global.document = originalDocument;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe('페이지 언로드 정리 로직', () => {
    it('beforeunload 및 pagehide 이벤트 리스너를 등록해야 함', () => {
      initializePageUnloadCleanup();

      expect(mockWindow.addEventListener).toHaveBeenCalledTimes(2);
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function),
        { passive: true }
      );
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function), {
        passive: true,
      });
    });

    it('beforeunload 이벤트에서 body overflow를 복구해야 함', () => {
      initializePageUnloadCleanup();

      // beforeunload 핸들러 가져오기
      const beforeUnloadCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'beforeunload'
      );
      expect(beforeUnloadCall).toBeDefined();

      const beforeUnloadHandler = beforeUnloadCall![1] as () => void;

      // 핸들러 실행
      beforeUnloadHandler();

      // body overflow 복구 확인
      expect(mockDocument.body!.style.overflow).toBe('');
      expect(mockDocument.body!.classList.remove).toHaveBeenCalledWith('xeg-scroll-lock');
    });

    it('pagehide 이벤트에서 세션스토리지를 정리해야 함', () => {
      initializePageUnloadCleanup();

      // pagehide 핸들러 가져오기
      const pageHideCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'pagehide'
      );
      expect(pageHideCall).toBeDefined();

      const pageHideHandler = pageHideCall![1] as () => void;

      // 핸들러 실행
      pageHideHandler();

      // xeg_scroll_ 키들만 삭제 확인
      expect(mockWindow.sessionStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(mockWindow.sessionStorage.removeItem).toHaveBeenCalledWith('xeg_scroll_/timeline');
      expect(mockWindow.sessionStorage.removeItem).toHaveBeenCalledWith('xeg_scroll_/home');
      expect(mockWindow.sessionStorage.removeItem).not.toHaveBeenCalledWith('other_key');
    });
  });

  describe('수동 body overflow 복구', () => {
    it('정상적으로 body overflow를 복구하고 true를 반환해야 함', () => {
      const result = forceBodyOverflowRestore();

      expect(result).toBe(true);
      expect(mockDocument.body!.style.overflow).toBe('');
      expect(mockDocument.body!.classList.remove).toHaveBeenCalledWith('xeg-scroll-lock');
    });

    it('document.body가 없을 때 false를 반환해야 함', () => {
      mockDocument.body = null;

      const result = forceBodyOverflowRestore();

      expect(result).toBe(false);
    });

    it('DOM이 없는 환경에서 false를 반환해야 함', () => {
      global.document = undefined as any;

      const result = forceBodyOverflowRestore();

      expect(result).toBe(false);
    });
  });

  describe('예외 처리', () => {
    it('beforeunload 핸들러에서 예외가 발생해도 중단되지 않아야 함', () => {
      // classList.remove에서 예외 발생하도록 설정
      mockDocument.body!.classList.remove = vi.fn(() => {
        throw new Error('DOM 오류');
      });

      initializePageUnloadCleanup();
      const beforeUnloadCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'beforeunload'
      );
      const beforeUnloadHandler = beforeUnloadCall![1] as () => void;

      // 예외가 발생해도 함수가 정상 완료되어야 함
      expect(() => beforeUnloadHandler()).not.toThrow();

      // style.overflow는 여전히 설정되어야 함
      expect(mockDocument.body!.style.overflow).toBe('');
    });

    it('pagehide 핸들러에서 세션스토리지 오류가 발생해도 중단되지 않아야 함', () => {
      // sessionStorage.removeItem에서 예외 발생하도록 설정
      mockWindow.sessionStorage.removeItem = vi.fn(() => {
        throw new Error('Storage 오류');
      });

      initializePageUnloadCleanup();
      const pageHideCall = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'pagehide'
      );
      const pageHideHandler = pageHideCall![1] as () => void;

      // 예외가 발생해도 함수가 정상 완료되어야 함
      expect(() => pageHideHandler()).not.toThrow();
    });
  });
});
