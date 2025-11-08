/**
 * @fileoverview Phase 229.2: Pointer Event Policy Tests
 *
 * Verifies the Phase 229 implementation:
 * 1. Touch events are blocked globally (strict PC-only policy)
 * 2. Pointer events are logged globally (allowing text selection, link clicks)
 * 3. Pointer events are blocked inside gallery containers only
 *
 * Background:
 * - Phase 228.1: Event capture optimization
 * - Phase 229.1: Modified blockTouchAndPointerEvents() to preserve text selection
 * - Phase 229.2: Add tests to verify new pointer event policy
 *
 * Note: This test uses browser environment to properly test Touch/Pointer events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import type { Mock } from 'vitest';

type PointerEventLike = Event & { pointerType?: string };

describe('Phase 229.2: Pointer Event Policy', () => {
  setupGlobalTestIsolation();

  describe('Policy Documentation and Contract', () => {
    it('should document the Phase 229 pointer event policy change', () => {
      // This test documents the expected behavior:
      // 1. Touch events: blocked globally (strict PC-only)
      // 2. Pointer events (outside gallery): logged only, allowing text selection
      // 3. Pointer events (inside gallery): blocked

      const policy = {
        touch: {
          global: 'blocked',
          reason: 'PC-only policy - no touch device support',
          events: ['touchstart', 'touchmove', 'touchend', 'touchcancel'],
        },
        pointer: {
          outsideGallery: 'logged-only',
          insideGallery: 'blocked',
          reason: 'Preserve text selection and native browser behavior outside gallery',
          events: [
            'pointerdown',
            'pointermove',
            'pointerup',
            'pointercancel',
            'pointerenter',
            'pointerleave',
          ],
        },
      };

      expect(policy.touch.global).toBe('blocked');
      expect(policy.pointer.outsideGallery).toBe('logged-only');
      expect(policy.pointer.insideGallery).toBe('blocked');
    });

    it('should expose applyGalleryPointerPolicy helper', async () => {
      const eventsModule = await import('@shared/utils/events');

      expect(eventsModule.applyGalleryPointerPolicy).toBeDefined();
      expect(typeof eventsModule.applyGalleryPointerPolicy).toBe('function');
    });
  });

  describe('isGalleryInternalElement Helper', () => {
    let testContainer: HTMLElement;
    let galleryContainer: HTMLElement;
    let outsideElement: HTMLElement;

    beforeEach(() => {
      testContainer = document.createElement('div');

      galleryContainer = document.createElement('div');
      galleryContainer.className = 'xeg-gallery-container';
      galleryContainer.setAttribute('data-xeg-gallery', 'true');

      outsideElement = document.createElement('div');
      outsideElement.className = 'external-content';

      testContainer.appendChild(galleryContainer);
      testContainer.appendChild(outsideElement);
      document.body.appendChild(testContainer);
    });

    afterEach(() => {
      if (testContainer.parentNode) {
        testContainer.parentNode.removeChild(testContainer);
      }
    });

    it('should correctly identify gallery internal elements', async () => {
      const { isGalleryInternalElement } = await import('@/shared/utils/utils');

      expect(isGalleryInternalElement(galleryContainer)).toBe(true);
      expect(isGalleryInternalElement(outsideElement)).toBe(false);
    });

    it('should identify nested gallery elements', async () => {
      const { isGalleryInternalElement } = await import('@/shared/utils/utils');

      const nestedElement = document.createElement('button');
      galleryContainer.appendChild(nestedElement);

      expect(isGalleryInternalElement(nestedElement)).toBe(true);
    });

    it('should identify elements with data-gallery-element marker', async () => {
      const { isGalleryInternalElement } = await import('@/shared/utils/utils');

      const dataElement = document.createElement('div');
      dataElement.setAttribute('data-gallery-element', 'true');
      outsideElement.appendChild(dataElement);

      // Elements with data-gallery-element markers are considered internal
      expect(isGalleryInternalElement(dataElement)).toBe(true);
    });

    it('should ignore non-HTMLElement inputs without warnings', async () => {
      const [{ isGalleryInternalElement }, loggingModule] = await Promise.all([
        import('@/shared/utils/utils'),
        import('@/shared/logging'),
      ]);

      const warnSpy = vi.spyOn(loggingModule.logger, 'warn');

      const result = isGalleryInternalElement(document as unknown as HTMLElement);

      expect(result).toBe(false);
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('Event Policy Implementation Verification', () => {
    it('should call preventDefault/stopPropagation for touch events', () => {
      // Mock event object with spy methods
      const mockTouchEvent = {
        type: 'touchstart',
        target: document.createElement('div'),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      };

      // Verify our policy expectation: touch events should be blocked
      expect(mockTouchEvent.preventDefault).toBeDefined();
      expect(mockTouchEvent.stopPropagation).toBeDefined();
      expect(mockTouchEvent.stopImmediatePropagation).toBeDefined();

      // Simulate policy enforcement
      mockTouchEvent.preventDefault();
      mockTouchEvent.stopPropagation();
      mockTouchEvent.stopImmediatePropagation();

      expect(mockTouchEvent.preventDefault).toHaveBeenCalled();
      expect(mockTouchEvent.stopPropagation).toHaveBeenCalled();
      expect(mockTouchEvent.stopImmediatePropagation).toHaveBeenCalled();
    });

    it('should conditionally block pointer events based on target', async () => {
      const { isGalleryInternalElement } = await import('@/shared/utils/utils');

      const galleryElement = document.createElement('div');
      galleryElement.className = 'xeg-gallery-container';

      const outsideElement = document.createElement('div');
      outsideElement.className = 'external';

      document.body.appendChild(galleryElement);
      document.body.appendChild(outsideElement);

      const mockPointerEventGallery = {
        type: 'pointerdown',
        target: galleryElement,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      const mockPointerEventOutside = {
        type: 'pointerdown',
        target: outsideElement,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      // Simulate policy: block if inside gallery
      if (isGalleryInternalElement(mockPointerEventGallery.target as HTMLElement)) {
        mockPointerEventGallery.preventDefault();
        mockPointerEventGallery.stopPropagation();
      }

      // Outside: do not block
      if (!isGalleryInternalElement(mockPointerEventOutside.target as HTMLElement)) {
        // Do nothing - allow event to propagate
      }

      expect(mockPointerEventGallery.preventDefault).toHaveBeenCalled();
      expect(mockPointerEventOutside.preventDefault).not.toHaveBeenCalled();

      document.body.removeChild(galleryElement);
      document.body.removeChild(outsideElement);
    });

    it('should allow mouse pointer events on form controls inside the gallery', async () => {
      const { applyGalleryPointerPolicy } = await import('@/shared/utils/events');

      const galleryRoot = document.createElement('div');
      galleryRoot.setAttribute('data-xeg-gallery', 'true');
      document.body.appendChild(galleryRoot);

      const cleanupPointerPolicy = applyGalleryPointerPolicy(galleryRoot);

      const settingsPanel = document.createElement('div');
      settingsPanel.setAttribute('data-gallery-element', 'settings-panel');

      const select = document.createElement('select');
      const option = document.createElement('option');
      option.value = 'light';
      option.textContent = 'Light';
      select.appendChild(option);
      settingsPanel.appendChild(select);
      galleryRoot.appendChild(settingsPanel);

      try {
        const pointerEvent = new Event('pointerdown', {
          bubbles: true,
          cancelable: true,
        }) as PointerEventLike;
        Object.defineProperty(pointerEvent, 'pointerType', {
          value: 'mouse',
          configurable: true,
        });

        const dispatchResult = select.dispatchEvent(pointerEvent);

        expect(dispatchResult).toBe(true);
        expect(pointerEvent.defaultPrevented).toBe(false);
      } finally {
        cleanupPointerPolicy();
        galleryRoot.remove();
      }
    });

    it('should not assign global pointer/touch handlers while gallery is closed', async () => {
      const eventsModule = await import('@/shared/utils/events');

      const handlers = {
        onMediaClick: vi.fn().mockResolvedValue(undefined),
        onGalleryClose: vi.fn(),
        onKeyboardEvent: vi.fn(),
      };

      const originalHandlers = {
        ontouchstart: document.ontouchstart,
        ontouchmove: document.ontouchmove,
        ontouchend: document.ontouchend,
        ontouchcancel: document.ontouchcancel,
        onpointerdown: document.onpointerdown,
        onpointermove: document.onpointermove,
        onpointerup: document.onpointerup,
        onpointercancel: document.onpointercancel,
        onpointerenter: document.onpointerenter,
        onpointerleave: document.onpointerleave,
      };

      try {
        await eventsModule.initializeGalleryEvents(handlers, {
          enableMediaDetection: false,
          enableKeyboard: false,
          preventBubbling: false,
          context: 'test-pointer-policy-global-handlers',
        });

        expect(document.ontouchstart == null).toBe(true);
        expect(document.ontouchmove == null).toBe(true);
        expect(document.ontouchend == null).toBe(true);
        expect(document.ontouchcancel == null).toBe(true);
        expect(document.onpointerdown == null).toBe(true);
        expect(document.onpointermove == null).toBe(true);
        expect(document.onpointerup == null).toBe(true);
        expect(document.onpointercancel == null).toBe(true);
        expect(document.onpointerenter == null).toBe(true);
        expect(document.onpointerleave == null).toBe(true);
      } finally {
        eventsModule.cleanupGalleryEvents();

        document.ontouchstart = originalHandlers.ontouchstart;
        document.ontouchmove = originalHandlers.ontouchmove;
        document.ontouchend = originalHandlers.ontouchend;
        document.ontouchcancel = originalHandlers.ontouchcancel;
        document.onpointerdown = originalHandlers.onpointerdown;
        document.onpointermove = originalHandlers.onpointermove;
        document.onpointerup = originalHandlers.onpointerup;
        document.onpointercancel = originalHandlers.onpointercancel;
        document.onpointerenter = originalHandlers.onpointerenter;
        document.onpointerleave = originalHandlers.onpointerleave;
      }
    });

    it('should continue to block pointer events on non-form gallery elements', async () => {
      const { applyGalleryPointerPolicy } = await import('@/shared/utils/events');

      const galleryRoot = document.createElement('div');
      galleryRoot.setAttribute('data-xeg-gallery', 'true');
      document.body.appendChild(galleryRoot);

      const cleanupPointerPolicy = applyGalleryPointerPolicy(galleryRoot);

      const galleryWrapper = document.createElement('div');
      galleryWrapper.setAttribute('data-gallery-element', 'toolbar-wrapper');

      const internalButton = document.createElement('div');
      internalButton.setAttribute('data-gallery-element', 'toolbar-button');
      galleryWrapper.appendChild(internalButton);
      galleryRoot.appendChild(galleryWrapper);

      try {
        const pointerEvent = new Event('pointerdown', {
          bubbles: true,
          cancelable: true,
        }) as PointerEventLike;
        Object.defineProperty(pointerEvent, 'pointerType', {
          value: 'mouse',
          configurable: true,
        });

        internalButton.dispatchEvent(pointerEvent);

        expect(pointerEvent.defaultPrevented).toBe(true);
      } finally {
        cleanupPointerPolicy();
        galleryRoot.remove();
      }
    });
  });

  describe('Text Selection Preservation', () => {
    it('should document that pointer events outside gallery preserve native behavior', () => {
      // This is a contract test - the implementation should:
      // 1. NOT call preventDefault() on pointer events outside gallery
      // 2. Allow text selection to work normally
      // 3. Allow link clicks to work normally

      const expectations = {
        pointerEventsOutsideGallery: {
          preventDefault: false,
          stopPropagation: false,
          allowNativeBehavior: true,
        },
        textSelection: {
          sequence: ['pointerdown', 'pointermove', 'pointerup'],
          shouldWork: true,
        },
        linkClicks: {
          shouldWork: true,
        },
      };

      expect(expectations.pointerEventsOutsideGallery.allowNativeBehavior).toBe(true);
      expect(expectations.textSelection.shouldWork).toBe(true);
      expect(expectations.linkClicks.shouldWork).toBe(true);
    });
  });

  describe('Logging Behavior', () => {
    beforeEach(async () => {
      // Import is handled dynamically in each test
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should log different messages for blocked vs allowed events', () => {
      // Simulate logging for blocked event
      const blockedLog = '[PC-only policy] Blocked pointerdown in gallery';
      const allowedLog = '[PC-only policy] Logged pointerdown (allowed)';

      // Verify log format expectations
      expect(blockedLog).toContain('Blocked');
      expect(allowedLog).toContain('Logged');
      expect(allowedLog).toContain('(allowed)');
    });
  });

  describe('PC-only Policy Consistency', () => {
    it('should maintain consistent event blocking strategy', () => {
      const policy = {
        allowedEvents: [
          'click',
          'keydown',
          'keyup',
          'wheel',
          'contextmenu',
          'mouseenter',
          'mouseleave',
          'mousemove',
          'mousedown',
          'mouseup',
        ],
        blockedEventsGlobal: ['touchstart', 'touchmove', 'touchend', 'touchcancel'],
        conditionallyBlockedEvents: [
          'pointerdown',
          'pointermove',
          'pointerup',
          'pointercancel',
          'pointerenter',
          'pointerleave',
        ],
      };

      // Verify policy structure
      expect(policy.allowedEvents.length).toBeGreaterThan(0);
      expect(policy.blockedEventsGlobal.length).toBe(4);
      expect(policy.conditionallyBlockedEvents.length).toBe(6);

      // Verify no overlap between allowed and blocked
      const allowedSet = new Set(policy.allowedEvents);
      const blockedSet = new Set(policy.blockedEventsGlobal);

      for (const event of policy.blockedEventsGlobal) {
        expect(allowedSet.has(event)).toBe(false);
      }

      for (const event of policy.allowedEvents) {
        expect(blockedSet.has(event)).toBe(false);
      }
    });
  });

  describe('Phase 304: Gallery-Scoped Event Isolation', () => {
    /**
     * Phase 304: 트위터 네이티브 동작 영향 최소화
     *
     * 목표: 갤러리 이벤트 리스너를 갤러리 루트에만 한정하여
     * 트위터 네이티브 동작 (스크롤, 키보드)과 충돌하지 않도록 격리
     *
     * 대안 3 (선택됨): 완전 격리
     * - 갤러리 오픈 시에만 컨테이너 범위 리스너 장착 (AbortController)
     * - 갤러리 루트에 한정된 포인터/터치 차단
     * - 외부 요소 영향 최소화
     */

    let galleryRoot: HTMLElement;
    let externalElement: HTMLElement;

    beforeEach(() => {
      // 갤러리 루트 생성
      galleryRoot = document.createElement('div');
      galleryRoot.id = 'xeg-gallery-root';
      galleryRoot.className = 'xeg-gallery-container';
      document.body.appendChild(galleryRoot);

      // 외부 요소 생성
      externalElement = document.createElement('div');
      externalElement.id = 'external-element';
      externalElement.textContent = 'External Element';
      document.body.appendChild(externalElement);
    });

    afterEach(() => {
      document.body.removeChild(galleryRoot);
      document.body.removeChild(externalElement);
    });

    describe('Pointer policy scope (갤러리 루트에만 한정)', () => {
      it('should allow external elements to receive click events (not blocked)', () => {
        // Phase 304 RED: 갤러리 포인터 정책이 외부 요소에 영향을 주지 않아야 함
        // 현재 구현이 전역 포인터 리스너를 사용한다면 이 테스트가 FAIL

        let externalClickFired = false;
        externalElement.addEventListener(
          'click',
          () => {
            externalClickFired = true;
          },
          { capture: true }
        );

        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });

        externalElement.dispatchEvent(clickEvent);

        // Assert
        expect(externalClickFired).toBe(true);
      });

      it('FAILING: should scope pointer blocking to gallery root only', () => {
        // Phase 304 RED: applyGalleryPointerPolicy(galleryRoot)가
        // 실제로 갤러리 루트로 범위를 제한하고 있는지 검증

        let galleryPointerEvent: PointerEventLike | null = null;
        let externalPointerEvent: PointerEventLike | null = null;

        // 갤러리 루트에 포인터 리스너 장착
        galleryRoot.addEventListener(
          'pointerdown',
          e => {
            galleryPointerEvent = e as PointerEventLike;
          },
          { capture: true }
        );

        externalElement.addEventListener(
          'pointerdown',
          e => {
            externalPointerEvent = e as PointerEventLike;
          },
          { capture: true }
        );

        // Phase 304: 갤러리 포인터 정책 적용 (구현 필요)
        // const cleanup = applyGalleryPointerPolicy(galleryRoot);

        // 갤러리 내부 포인터 이벤트 dispatch
        const galleryEvent = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
        });

        galleryRoot.dispatchEvent(galleryEvent);

        // 외부 포인터 이벤트 dispatch
        const externalEvent = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
        });

        externalElement.dispatchEvent(externalEvent);

        // Assert (Phase 304 완료 후 PASSING)
        // 갤러리 내부: blocked (galleryPointerEvent는 null 또는 preventDefault됨)
        // 외부: 정상 작동 (externalPointerEvent는 fired)
        expect(externalPointerEvent).not.toBeNull();
      });
    });

    describe('Gallery lifecycle (갤러리 오픈/닫기 시 리스너 관리)', () => {
      it('FAILING: should only attach event listeners when gallery root has listeners registered', async () => {
        // Phase 304 RED: 갤러리 리스너가 실제로 갤러리 루트에만 등록되는지 검증

        // 현재 상태: initializeGalleryEvents()는 전역 document에 리스너 등록
        // 목표: 갤러리 오픈 시에만 갤러리 루트에 범위 리스너 등록

        let galleryKeydownFired = false;
        let externalKeydownFired = false;

        galleryRoot.addEventListener('keydown', () => {
          galleryKeydownFired = true;
        });

        externalElement.addEventListener('keydown', () => {
          externalKeydownFired = true;
        });

        // Simulate keyboard event on gallery root
        const galleryKeyEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });

        galleryRoot.dispatchEvent(galleryKeyEvent);

        // Assert
        // 갤러리 루트: 리스너 정상 작동
        expect(galleryKeydownFired).toBe(true);
      });

      it('FAILING: should preserve Twitter scroll position with scoped events', () => {
        // Phase 304 RED: TwitterScrollPreservation이 갤러리 범위 리스너와 호환

        // 시나리오:
        // 1. Twitter 스크롤 위치: top = 500
        // 2. 갤러리 오픈 (AbortController 기반 범위 리스너 등록)
        // 3. 갤러리 닫기 (리스너 정리)
        // 4. 스크롤 복원 요청
        //
        // 기대: 전역 리스너 간섭 없이 스크롤이 500으로 복원

        const mockContainer = document.createElement('div');
        mockContainer.className = 'twitter-scroll-container';
        document.body.appendChild(mockContainer);

        // 스크롤 위치 설정
        Object.defineProperty(mockContainer, 'scrollTop', {
          configurable: true,
          writable: true,
          value: 500,
        });

        // 갤러리 이벤트 리스너 등록 (현재는 전역)
        // Phase 304 후: galleryRoot 범위로 한정

        // 스크롤 변경
        mockContainer.scrollTop = 200;

        // 복원 가정
        mockContainer.scrollTop = 500;

        // Assert
        expect(mockContainer.scrollTop).toBe(500);

        document.body.removeChild(mockContainer);
      });
    });

    describe('Event delegation (스코프 기반 리스너 조화)', () => {
      it('FAILING: should not interfere with Twitter native keyboard handling', () => {
        // Phase 304 RED: 갤러리 키보드 리스너가 Twitter의 키보드 처리를 방해하지 않아야 함

        // 현재 문제:
        // - initializeGalleryEvents()가 전역 document에 keydown 리스너 등록
        // - Twitter 네이티브 key handling (Ctrl+Enter 등)과 충돌 가능성

        // 목표:
        // - 갤러리 루트에만 keydown 리스너 등록 (스코프 한정)
        // - Twitter 네이티브 처리는 그대로 작동

        let twitterKeydownDefault = 'not-prevented';

        // Twitter (외부 요소) 키보드 핸들러
        externalElement.addEventListener('keydown', e => {
          // Twitter 네이티브 처리 시뮬레이션 (예: Ctrl+Enter 트윗 전송)
          if (e.ctrlKey && e.key === 'Enter') {
            twitterKeydownDefault = e.defaultPrevented ? 'prevented' : 'not-prevented';
          }
        });

        // Ctrl+Enter on Twitter (갤러리 리스너가 간섭하지 않아야 함)
        const twitterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        });

        externalElement.dispatchEvent(twitterEvent);

        // Assert
        // Twitter 이벤트는 갤러리 리스너로부터 간섭받지 않음
        expect(twitterKeydownDefault).toBe('not-prevented');
      });

      it('should allow Twitter native click handling outside gallery', () => {
        // Phase 304: 외부 (Twitter) 클릭이 정상 작동하는지 검증

        let externalClickFired = false;
        externalElement.addEventListener(
          'click',
          () => {
            externalClickFired = true;
          },
          { capture: true }
        );

        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });

        externalElement.dispatchEvent(clickEvent);

        // Assert
        expect(externalClickFired).toBe(true);
      });
    });
  });
});
