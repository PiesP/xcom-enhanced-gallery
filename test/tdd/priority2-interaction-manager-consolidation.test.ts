/**
 * @fileoverview TDD Priority 2: 인터랙션 매니저 통합 완료 검증
 * @description InteractionService, EventManager, ComponentManager 통합 및 중복 제거
 * @version 1.0.0 - TDD GREEN Phase
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  InteractionService,
  createInteractionManager,
} from '@shared/utils/interaction/interaction-manager';
import { GalleryEventManager, addListener, removeEventListenerManaged } from '@shared/utils/events';
import { UnifiedComponentManager } from '@shared/components/component-manager';
import { UnifiedDOMService } from '@shared/dom/unified-dom-service';

describe('🔄 GREEN Phase: 인터랙션 매니저 통합 완료', () => {
  let testElement: HTMLElement;
  let interactionService: InteractionService;
  let eventManager: GalleryEventManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // 테스트용 DOM 요소 생성
    testElement = document.createElement('div');
    testElement.id = 'test-element';
    document.body.appendChild(testElement);

    // 서비스 인스턴스 생성
    interactionService = createInteractionManager(testElement);
    eventManager = GalleryEventManager.getInstance();
  });

  afterEach(() => {
    // 정리 작업
    interactionService?.cleanup();
    eventManager?.cleanup();
    testElement?.remove();

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('통합된 인터랙션 매니저 기능 검증', () => {
    it('단일 인터랙션 서비스 인스턴스가 통합 기능을 제공한다', () => {
      expect(interactionService).toBeInstanceOf(InteractionService);
      expect(interactionService.onGesture).toBeDefined();
      expect(interactionService.addKeyboardShortcut).toBeDefined();
      expect(interactionService.cleanup).toBeDefined();
    });

    it('PC 전용 제스처 감지가 정상 작동한다', () => {
      const clickHandler = vi.fn();
      interactionService.onGesture('click', clickHandler);

      // 마우스 클릭 시뮬레이션 - 등록된 element에서 발생
      const mouseDownEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 200,
        bubbles: true,
      });
      const mouseUpEvent = new MouseEvent('mouseup', {
        button: 0,
        clientX: 100,
        clientY: 200,
        bubbles: true,
      });

      testElement.dispatchEvent(mouseDownEvent);
      testElement.dispatchEvent(mouseUpEvent);

      expect(clickHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
          x: 100,
          y: 200,
          button: 0,
        })
      );
    });

    it('키보드 단축키 등록 및 처리가 작동한다', () => {
      const shortcutHandler = vi.fn();

      interactionService.addKeyboardShortcut({
        key: 'Escape',
        ctrl: false,
        callback: shortcutHandler,
        preventDefault: true,
      });

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        ctrlKey: false,
        bubbles: true,
      });

      testElement.dispatchEvent(keyEvent);
      expect(shortcutHandler).toHaveBeenCalledWith(keyEvent);
    });

    it('더블클릭 감지가 정확히 작동한다', () => {
      const doubleClickHandler = vi.fn();
      interactionService.onGesture('doubleClick', doubleClickHandler);

      // 첫 번째 클릭
      testElement.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
      testElement.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }));

      // 300ms 이내 두 번째 클릭
      vi.advanceTimersByTime(100);
      testElement.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
      testElement.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }));

      expect(doubleClickHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'doubleClick',
        })
      );
    });
  });

  describe('통합 이벤트 매니저 검증', () => {
    it('GalleryEventManager가 통합된 이벤트 관리를 제공한다', () => {
      expect(eventManager).toBeInstanceOf(GalleryEventManager);
      expect(eventManager.addListener).toBeDefined();
      expect(eventManager.removeListener).toBeDefined();
      expect(eventManager.getStatus).toBeDefined();
      expect(eventManager.cleanup).toBeDefined();
    });

    it('이벤트 리스너 추가 및 제거가 정상 작동한다', () => {
      const handler = vi.fn();

      const listenerId = eventManager.addListener(
        testElement,
        'click',
        handler,
        undefined,
        'test-context'
      );

      expect(listenerId).toBeTruthy();

      // 이벤트 발생 테스트 - 직접적인 이벤트 생성
      const clickEvent = new MouseEvent('click', { bubbles: true });
      testElement.dispatchEvent(clickEvent);
      expect(handler).toHaveBeenCalled();

      // 리스너 제거
      const removed = eventManager.removeListener(listenerId);
      expect(removed).toBe(true);

      // 제거 후 이벤트 발생하지 않음
      handler.mockClear();
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      testElement.dispatchEvent(clickEvent2);
      expect(handler).not.toHaveBeenCalled();
    });

    it('컨텍스트별 이벤트 리스너 관리가 작동한다', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventManager.addListener(testElement, 'click', handler1, undefined, 'context1');
      eventManager.addListener(testElement, 'click', handler2, undefined, 'context2');

      const removed = eventManager.removeByContext('context1');
      expect(removed).toBe(1);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      testElement.dispatchEvent(clickEvent);
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('UnifiedComponentManager 통합 검증', () => {
    it('통합된 컴포넌트 매니저가 이벤트 처리를 제공한다', () => {
      const component = UnifiedComponentManager.createComponent('test-component');

      expect(component).toBeDefined();
      expect(component.withEventHandling).toBeDefined();
      expect(component.withHooks).toBeDefined();
      expect(component.withStateManagement).toBeDefined();
    });

    it('이벤트 핸들링 기능이 정상 작동한다', () => {
      const component = {};
      const enhancedComponent =
        UnifiedComponentManager.createComponent('test').withEventHandling(component);

      expect(enhancedComponent.events).toBeDefined();
      expect(enhancedComponent.events.createClickHandler).toBeDefined();
      expect(enhancedComponent.events.createKeyboardHandler).toBeDefined();
    });

    it('클릭 핸들러 생성이 정상 작동한다', () => {
      const originalHandler = vi.fn();
      const eventManager = UnifiedComponentManager.getEventManager();

      const wrappedHandler = eventManager.createClickHandler(originalHandler);

      const mockEvent = new Event('click');
      vi.spyOn(mockEvent, 'preventDefault');
      vi.spyOn(mockEvent, 'stopPropagation');

      wrappedHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(originalHandler).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('호환성 요구사항 충족', () => {
    it('기존 이벤트 관리 패턴이 호환된다', () => {
      const handler = vi.fn();

      // 기존 addListener 함수 사용
      const listenerId = addListener(testElement, 'click', handler, undefined, 'legacy');
      expect(listenerId).toBeTruthy();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      testElement.dispatchEvent(clickEvent);
      expect(handler).toHaveBeenCalled();

      // 기존 제거 함수 사용
      const removed = removeEventListenerManaged(listenerId);
      expect(removed).toBe(true);
    });

    it('UnifiedDOMService 이벤트 처리와 호환된다', () => {
      const domService = UnifiedDOMService.getInstance();
      const handler = vi.fn();

      const cleanup = domService.addEventListener(testElement, 'click', handler);
      expect(cleanup).toBeInstanceOf(Function);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      testElement.dispatchEvent(clickEvent);
      expect(handler).toHaveBeenCalled();

      cleanup();

      handler.mockClear();
      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      testElement.dispatchEvent(clickEvent2);
      expect(handler).not.toHaveBeenCalled();
    });

    it('제스처 옵션 커스터마이징이 작동한다', () => {
      const customInteraction = createInteractionManager(testElement, {
        doubleClickDelay: 500,
        hoverDelay: 1000,
      });

      expect(customInteraction).toBeInstanceOf(InteractionService);

      customInteraction.cleanup();
    });
  });

  describe('성능 요구사항', () => {
    it('대량 이벤트 리스너 등록/해제가 효율적이다', () => {
      const startTime = performance.now();
      const listenerIds: string[] = [];

      // 1000개 리스너 등록
      for (let i = 0; i < 1000; i++) {
        const handler = vi.fn();
        const id = eventManager.addListener(
          testElement,
          'click',
          handler,
          undefined,
          `performance-test-${i}`
        );
        listenerIds.push(id);
      }

      const registrationTime = performance.now() - startTime;
      expect(registrationTime).toBeLessThan(100); // 100ms 이내

      // 모든 리스너 제거
      const removalStartTime = performance.now();
      listenerIds.forEach(id => eventManager.removeListener(id));
      const removalTime = performance.now() - removalStartTime;

      expect(removalTime).toBeLessThan(50); // 50ms 이내
    });

    it('메모리 누수 없이 정리가 완료된다', () => {
      const initialStatus = eventManager.getStatus();
      const initialTotal = initialStatus.total;

      // 여러 리스너 등록
      const ids = [];
      for (let i = 0; i < 10; i++) {
        const id = eventManager.addListener(testElement, 'click', vi.fn());
        ids.push(id);
      }

      // 모든 리스너 제거
      ids.forEach(id => eventManager.removeListener(id));

      const finalStatus = eventManager.getStatus();
      expect(finalStatus.total).toBe(initialTotal);
    });
  });
});
