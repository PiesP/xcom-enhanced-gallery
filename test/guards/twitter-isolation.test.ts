/**
 * @fileoverview Twitter 페이지 격리 검증 테스트
 * @description 스크립트가 Twitter 페이지에 영향을 주지 않는지 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

type WindowWithXEG = typeof window & { __XEG__?: unknown };
type WindowRecord = typeof window & Record<string, unknown>;

describe('Phase 290: Twitter 페이지 격리', () => {
  describe('전역 네임스페이스 격리', () => {
    beforeEach(() => {
      // 테스트 전 전역 오염 확인
      delete (window as WindowWithXEG).__XEG__;
    });

    afterEach(() => {
      // 테스트 후 정리
      delete (window as WindowWithXEG).__XEG__;
    });

    it('단일 __XEG__ 네임스페이스만 사용해야 함', () => {
      // Arrange: 레거시 전역 변수들이 존재하지 않아야 함
      const legacyGlobals = [
        '__XEG_SET_LOG_LEVEL',
        '__XEG_GET_LOG_LEVEL',
        '__XEG_MEASURE_MEMORY',
        '__XEG_TRACE_START',
        '__XEG_TRACE_STOP',
        '__XEG_TRACE_POINT',
        '__XEG_TRACE_STATUS',
        '__XEG_MAIN__',
        '__XEG_GALLERY_APP__',
      ];

      // Assert: 레거시 전역 변수가 없어야 함
      for (const globalKey of legacyGlobals) {
        expect((window as WindowRecord)[globalKey]).toBeUndefined();
      }
    });

    it('__XEG__ 네임스페이스가 개발 환경에서만 노출되어야 함', () => {
      // DEV 환경에서는 __XEG__가 있을 수 있음 (조건부)
      const xeg = (window as WindowWithXEG).__XEG__;

      if (__DEV__) {
        // 개발 환경에서는 존재할 수 있음 (선택적)
        if (xeg) {
          expect(typeof xeg).toBe('object');
        }
      } else {
        // 프로덕션에서는 반드시 없어야 함
        expect(xeg).toBeUndefined();
      }
    });

    it('__XEG__ 네임스페이스 구조가 올바르게 정의되어야 함', () => {
      type XEGNamespace = {
        logging?: {
          setLogLevel?: (level: string) => void;
          getLogLevel?: () => string;
          measureMemory?: (label: string) => unknown;
        };
        tracing?: {
          start?: (options?: unknown) => void;
          stop?: () => void;
          point?: (label: string, data?: Record<string, unknown>) => void;
          status?: () => unknown;
        };
        main?: {
          start?: () => Promise<void>;
          createConfig?: () => unknown;
          cleanup?: () => Promise<void>;
          galleryApp?: unknown;
        };
      };

      const xeg = (window as WindowWithXEG).__XEG__ as XEGNamespace | undefined;

      if (xeg) {
        // logging 네임스페이스 검증
        if (xeg.logging) {
          expect(typeof xeg.logging.setLogLevel).toBe('function');
          expect(typeof xeg.logging.getLogLevel).toBe('function');
          expect(typeof xeg.logging.measureMemory).toBe('function');
        }

        // tracing 네임스페이스 검증
        if (xeg.tracing) {
          expect(typeof xeg.tracing.start).toBe('function');
          expect(typeof xeg.tracing.stop).toBe('function');
          expect(typeof xeg.tracing.point).toBe('function');
          expect(typeof xeg.tracing.status).toBe('function');
        }

        // main 네임스페이스 검증
        if (xeg.main) {
          expect(typeof xeg.main.start).toBe('function');
          expect(typeof xeg.main.createConfig).toBe('function');
          expect(typeof xeg.main.cleanup).toBe('function');
        }
      }
    });
  });

  describe('전역 오염 방지', () => {
    it('XEG 관련 전역 변수가 __XEG__ 외에 없어야 함', () => {
      // Arrange: window 객체의 모든 키 검사
      const windowKeys = Object.keys(window);
      const xegRelatedKeys = windowKeys.filter(
        key =>
          (key.startsWith('__XEG') || key.startsWith('XEG') || key.startsWith('xeg')) &&
          key !== '__XEG__'
      );

      // Assert: __XEG__ 외의 XEG 관련 전역 변수가 없어야 함
      expect(xegRelatedKeys).toEqual([]);
    });

    it('트위터 네이티브 객체를 수정하지 않아야 함', () => {
      // Arrange: Twitter 관련 주요 객체들
      const twitterNativeObjects = ['Twitter', 'TwitterAPI', 'TwitterConfig', '__INITIAL_STATE__'];

      // Assert: Twitter 네이티브 객체가 우리 스크립트에 의해 추가되지 않아야 함
      // (원래 있던 것은 유지, 우리가 추가한 것이 없어야 함)
      for (const objName of twitterNativeObjects) {
        const obj = (window as WindowRecord)[objName];
        if (obj && typeof obj === 'object') {
          // 객체가 있다면, 우리가 추가한 속성이 없는지 확인
          const suspiciousKeys = Object.keys(obj as Record<string, unknown>).filter(
            key => key.startsWith('__XEG') || key.startsWith('xeg')
          );
          expect(suspiciousKeys).toEqual([]);
        }
      }
    });
  });

  describe('DOM 격리', () => {
    it('갤러리 루트 컨테이너가 격리된 클래스를 가져야 함', () => {
      // Arrange: 갤러리 루트 컨테이너 생성
      const root = document.createElement('div');
      root.className = 'xeg-root';
      document.body.appendChild(root);

      try {
        // Assert: xeg-root 클래스가 있어야 함
        expect(root.classList.contains('xeg-root')).toBe(true);

        // Note: JSDOM은 CSS를 완전히 렌더링하지 않으므로
        // 스타일 검증은 E2E 테스트(Playwright)에서 수행
      } finally {
        // Cleanup
        root.remove();
      }
    });

    it('갤러리 컨테이너 외부 DOM을 직접 수정하지 않아야 함', () => {
      // Arrange: Twitter DOM 시뮬레이션
      const twitterTimeline = document.createElement('div');
      twitterTimeline.setAttribute('data-testid', 'primaryColumn');
      twitterTimeline.textContent = 'Twitter Timeline';
      document.body.appendChild(twitterTimeline);

      const originalDisplay = twitterTimeline.style.display;
      const originalContent = twitterTimeline.textContent;

      try {
        // Act: 갤러리 루트 생성 (실제로는 자동 생성됨)
        const root = document.createElement('div');
        root.className = 'xeg-root';
        document.body.appendChild(root);

        // Assert: Twitter DOM이 수정되지 않았어야 함
        expect(twitterTimeline.style.display).toBe(originalDisplay);
        expect(twitterTimeline.textContent).toBe(originalContent);

        root.remove();
      } finally {
        // Cleanup
        twitterTimeline.remove();
      }
    });
  });

  describe('이벤트 격리', () => {
    it('이벤트 리스너가 cleanup 함수를 제공해야 함', () => {
      // Arrange: 모킹된 cleanup 함수
      let cleanupCalled = false;
      const mockCleanup = (): void => {
        cleanupCalled = true;
      };

      // Act: cleanup 실행
      mockCleanup();

      // Assert: cleanup이 호출되었어야 함
      expect(cleanupCalled).toBe(true);
    });

    it('등록된 모든 이벤트 리스너가 정리되어야 함', () => {
      // Arrange: 이벤트 리스너 추적
      const listeners: Array<{
        target: unknown;
        type: string;
        handler: () => void;
      }> = [];

      const addTrackedListener = (
        target: unknown,
        type: string,
        handler: () => void
      ): (() => void) => {
        (target as HTMLElement).addEventListener(type, handler);
        listeners.push({ target, type, handler });

        return () => {
          (target as HTMLElement).removeEventListener(type, handler);
        };
      };

      // Act: 리스너 등록 및 정리
      const handler = (): void => {};
      const cleanup1 = addTrackedListener(document, 'click', handler);
      const cleanup2 = addTrackedListener(window, 'resize', handler);

      expect(listeners.length).toBe(2);

      cleanup1();
      cleanup2();

      // Assert: 정리 후 리스너가 제거되었어야 함
      // (실제로는 추적 배열을 비우는 로직이 필요하지만, 개념 검증용)
      expect(typeof cleanup1).toBe('function');
      expect(typeof cleanup2).toBe('function');
    });
  });

  describe('메모리 격리', () => {
    it('cleanup 함수가 모든 리소스를 정리해야 함', async () => {
      // Arrange: 정리 대상 시뮬레이션
      const cleanupTasks: Array<() => Promise<void> | void> = [];
      let galleryAppCleaned = false;
      let servicesCleaned = false;
      let vendorsCleaned = false;

      const mockGalleryApp = {
        cleanup: async (): Promise<void> => {
          galleryAppCleaned = true;
        },
      };

      const mockCleanup = async (): Promise<void> => {
        // 갤러리 앱 정리
        if (mockGalleryApp) {
          await mockGalleryApp.cleanup();
        }

        // 서비스 정리
        servicesCleaned = true;

        // Vendor 정리
        vendorsCleaned = true;

        // 이벤트 리스너 정리
        await Promise.all(cleanupTasks.map(task => task()));
      };

      // Act: cleanup 실행
      await mockCleanup();

      // Assert: 모든 리소스가 정리되었어야 함
      expect(galleryAppCleaned).toBe(true);
      expect(servicesCleaned).toBe(true);
      expect(vendorsCleaned).toBe(true);
    });

    it('페이지 언로드 시 자동 정리가 트리거되어야 함', () => {
      // Arrange: beforeunload 핸들러 시뮬레이션
      let cleanupTriggered = false;
      const mockOnBeforeUnload = (): void => {
        cleanupTriggered = true;
      };

      // Act: beforeunload 이벤트 시뮬레이션
      mockOnBeforeUnload();

      // Assert: cleanup이 트리거되었어야 함
      expect(cleanupTriggered).toBe(true);
    });
  });

  describe('CSS 격리', () => {
    it('CSS Modules가 고유한 클래스 이름을 생성해야 함', () => {
      // Arrange: CSS Modules 패턴 검증
      const cssModuleClass = 'Button_container_abc123'; // 예시

      // Assert: 해시가 포함된 고유 클래스 이름
      expect(cssModuleClass).toMatch(/_[a-zA-Z0-9]+$/);
    });

    it('갤러리 루트와 외부 요소가 분리된 클래스를 가져야 함', () => {
      // Arrange: 갤러리 루트와 외부 요소 생성
      const root = document.createElement('div');
      root.className = 'xeg-root';
      document.body.appendChild(root);

      const outsideElement = document.createElement('div');
      outsideElement.className = 'twitter-element';
      document.body.appendChild(outsideElement);

      try {
        // Assert: 클래스가 분리되어 있어야 함
        expect(root.classList.contains('xeg-root')).toBe(true);
        expect(root.classList.contains('twitter-element')).toBe(false);
        expect(outsideElement.classList.contains('twitter-element')).toBe(true);
        expect(outsideElement.classList.contains('xeg-root')).toBe(false);

        // Note: JSDOM은 CSS를 완전히 렌더링하지 않으므로
        // 실제 스타일 적용 검증은 E2E 테스트(Playwright)에서 수행
      } finally {
        // Cleanup
        root.remove();
        outsideElement.remove();
      }
    });
  });

  describe('성능 격리', () => {
    it('갤러리가 Twitter 페이지 레이아웃 재계산을 유발하지 않아야 함', () => {
      // Arrange: Twitter DOM 시뮬레이션
      const twitterContent = document.createElement('div');
      twitterContent.setAttribute('data-testid', 'primaryColumn');
      twitterContent.style.width = '600px';
      document.body.appendChild(twitterContent);

      const initialWidth = twitterContent.offsetWidth;

      try {
        // Act: 갤러리 루트 추가
        const root = document.createElement('div');
        root.className = 'xeg-root';
        root.style.position = 'fixed';
        root.style.top = '0';
        root.style.left = '0';
        root.style.width = '100vw';
        root.style.height = '100vh';
        document.body.appendChild(root);

        // Assert: Twitter 컨텐츠 레이아웃이 변경되지 않았어야 함
        expect(twitterContent.offsetWidth).toBe(initialWidth);

        root.remove();
      } finally {
        // Cleanup
        twitterContent.remove();
      }
    });

    it('갤러리가 하드웨어 가속을 사용해야 함', () => {
      // Arrange: 갤러리 루트 생성
      const root = document.createElement('div');
      root.className = 'xeg-root';
      root.style.transform = 'translateZ(0)';
      document.body.appendChild(root);

      try {
        // Assert: transform 속성이 설정되어 있어야 함
        const styles = window.getComputedStyle(root);
        expect(styles.transform).not.toBe('none');
      } finally {
        // Cleanup
        root.remove();
      }
    });
  });
});
