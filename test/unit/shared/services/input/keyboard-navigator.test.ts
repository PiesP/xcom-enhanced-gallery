/**
 * @fileoverview KeyboardNavigator 테스트
 * @description 키보드 이벤트 처리, PC 전용 스코프, editable 가드 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeyboardNavigator, keyboardNavigator } from '@/shared/services/input/keyboard-navigator';
import type {
  KeyboardNavigatorHandlers,
  KeyboardNavigatorOptions,
} from '@/shared/services/input/keyboard-navigator';

// Mock logger
vi.mock('@/shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock EventManager
const mockAddListener = vi.fn((target, type, handler, options, context) => {
  // Return unique ID
  return `listener-${Date.now()}-${Math.random()}`;
});
const mockRemoveListener = vi.fn();

vi.mock('@/shared/services/event-manager', () => ({
  EventManager: {
    getInstance: vi.fn(() => ({
      addListener: mockAddListener,
      removeListener: mockRemoveListener,
    })),
  },
}));

describe('KeyboardNavigator', () => {
  let navigator: KeyboardNavigator;

  beforeEach(() => {
    navigator = KeyboardNavigator.getInstance();
    mockAddListener.mockClear();
    mockRemoveListener.mockClear();
  });

  describe('Singleton Pattern', () => {
    it('getInstance()는 항상 동일한 인스턴스를 반환한다', () => {
      const instance1 = KeyboardNavigator.getInstance();
      const instance2 = KeyboardNavigator.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('전역 keyboardNavigator는 싱글톤 인스턴스이다', () => {
      expect(keyboardNavigator).toBe(KeyboardNavigator.getInstance());
    });
  });

  describe('subscribe()', () => {
    it('EventManager에 keydown 리스너를 등록한다', () => {
      const handlers: KeyboardNavigatorHandlers = {
        onEscape: vi.fn(),
      };

      navigator.subscribe(handlers);

      expect(mockAddListener).toHaveBeenCalledTimes(1);
      expect(mockAddListener).toHaveBeenCalledWith(
        document,
        'keydown',
        expect.any(Function),
        { capture: true },
        'keyboard-navigator'
      );
    });

    it('커스텀 옵션을 적용한다', () => {
      const handlers: KeyboardNavigatorHandlers = {
        onEscape: vi.fn(),
      };
      const options: KeyboardNavigatorOptions = {
        context: 'custom-context',
        capture: false,
      };

      navigator.subscribe(handlers, options);

      expect(mockAddListener).toHaveBeenCalledWith(
        document,
        'keydown',
        expect.any(Function),
        { capture: false },
        'custom-context'
      );
    });

    it('unsubscribe 함수를 반환한다', () => {
      mockAddListener.mockReturnValue('listener-123');

      const handlers: KeyboardNavigatorHandlers = {
        onEscape: vi.fn(),
      };
      const unsubscribe = navigator.subscribe(handlers);

      expect(unsubscribe).toBeTypeOf('function');

      unsubscribe();

      expect(mockRemoveListener).toHaveBeenCalledTimes(1);
      expect(mockRemoveListener).toHaveBeenCalledWith('listener-123');
    });

    it('unsubscribe 에러를 조용히 처리한다', () => {
      mockRemoveListener.mockImplementation(() => {
        throw new Error('Remove failed');
      });

      const handlers: KeyboardNavigatorHandlers = {
        onEscape: vi.fn(),
      };
      const unsubscribe = navigator.subscribe(handlers);

      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('Key Handlers', () => {
    let registeredHandler: ((evt: Event) => void) | null = null;

    beforeEach(() => {
      mockAddListener.mockImplementation((target, type, handler) => {
        registeredHandler = handler as (evt: Event) => void;
        return 'listener-id';
      });
    });

    afterEach(() => {
      registeredHandler = null;
    });

    const createKeyboardEvent = (key: string, shiftKey = false): KeyboardEvent => {
      return new KeyboardEvent('keydown', {
        key,
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
    };

    it('Escape 키를 처리한다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const event = createKeyboardEvent('Escape');
      registeredHandler?.(event);

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('ArrowLeft 키를 처리한다', () => {
      const onLeft = vi.fn();
      navigator.subscribe({ onLeft });

      const event = createKeyboardEvent('ArrowLeft');
      registeredHandler?.(event);

      expect(onLeft).toHaveBeenCalledTimes(1);
    });

    it('ArrowRight 키를 처리한다', () => {
      const onRight = vi.fn();
      navigator.subscribe({ onRight });

      const event = createKeyboardEvent('ArrowRight');
      registeredHandler?.(event);

      expect(onRight).toHaveBeenCalledTimes(1);
    });

    it('Home 키를 처리한다', () => {
      const onHome = vi.fn();
      navigator.subscribe({ onHome });

      const event = createKeyboardEvent('Home');
      registeredHandler?.(event);

      expect(onHome).toHaveBeenCalledTimes(1);
    });

    it('End 키를 처리한다', () => {
      const onEnd = vi.fn();
      navigator.subscribe({ onEnd });

      const event = createKeyboardEvent('End');
      registeredHandler?.(event);

      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('Enter 키를 처리한다', () => {
      const onEnter = vi.fn();
      navigator.subscribe({ onEnter });

      const event = createKeyboardEvent('Enter');
      registeredHandler?.(event);

      expect(onEnter).toHaveBeenCalledTimes(1);
    });

    it('Space 키를 처리한다', () => {
      const onSpace = vi.fn();
      navigator.subscribe({ onSpace });

      const event = createKeyboardEvent(' ');
      registeredHandler?.(event);

      expect(onSpace).toHaveBeenCalledTimes(1);
    });

    it('Space 문자열도 처리한다', () => {
      const onSpace = vi.fn();
      navigator.subscribe({ onSpace });

      const event = createKeyboardEvent('Space');
      registeredHandler?.(event);

      expect(onSpace).toHaveBeenCalledTimes(1);
    });

    it('? 키를 처리한다 (Help)', () => {
      const onHelp = vi.fn();
      navigator.subscribe({ onHelp });

      const event = createKeyboardEvent('?');
      registeredHandler?.(event);

      expect(onHelp).toHaveBeenCalledTimes(1);
    });

    it('Shift+/ 키를 처리한다 (Help)', () => {
      const onHelp = vi.fn();
      navigator.subscribe({ onHelp });

      const event = createKeyboardEvent('/', true);
      registeredHandler?.(event);

      expect(onHelp).toHaveBeenCalledTimes(1);
    });

    it('Shift 없는 / 키는 처리하지 않는다', () => {
      const onHelp = vi.fn();
      navigator.subscribe({ onHelp });

      const event = createKeyboardEvent('/', false);
      registeredHandler?.(event);

      expect(onHelp).not.toHaveBeenCalled();
    });

    it('onAny 핸들러는 항상 호출된다', () => {
      const onAny = vi.fn();
      navigator.subscribe({ onAny });

      const event = createKeyboardEvent('a');
      registeredHandler?.(event);

      expect(onAny).toHaveBeenCalledTimes(1);
      expect(onAny).toHaveBeenCalledWith(event);
    });

    it('onAny는 특정 핸들러와 함께 호출된다', () => {
      const onEscape = vi.fn();
      const onAny = vi.fn();
      navigator.subscribe({ onEscape, onAny });

      const event = createKeyboardEvent('Escape');
      registeredHandler?.(event);

      expect(onEscape).toHaveBeenCalledTimes(1);
      expect(onAny).toHaveBeenCalledTimes(1);
    });

    it('onAny 에러를 조용히 처리한다', () => {
      const onAny = vi.fn(() => {
        throw new Error('onAny error');
      });
      navigator.subscribe({ onAny });

      const event = createKeyboardEvent('a');

      expect(() => registeredHandler?.(event)).not.toThrow();
      expect(onAny).toHaveBeenCalledTimes(1);
    });
  });

  describe('Editable Guard', () => {
    let registeredHandler: ((evt: Event) => void) | null = null;

    beforeEach(() => {
      mockAddListener.mockImplementation((target, type, handler) => {
        registeredHandler = handler as (evt: Event) => void;
        return 'listener-id';
      });
    });

    afterEach(() => {
      registeredHandler = null;
    });

    it('INPUT 요소에서는 핸들러를 호출하지 않는다', () => {
      const onEscape = vi.fn();
      const onAny = vi.fn();
      navigator.subscribe({ onEscape, onAny });

      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      registeredHandler?.(event);

      expect(onEscape).not.toHaveBeenCalled();
      expect(onAny).toHaveBeenCalledTimes(1); // onAny는 editable에서도 호출됨
    });

    it('TEXTAREA 요소에서는 핸들러를 호출하지 않는다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const textarea = document.createElement('textarea');
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: textarea, enumerable: true });

      registeredHandler?.(event);

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('contentEditable 요소에서는 핸들러를 호출하지 않는다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const div = document.createElement('div');
      div.contentEditable = 'true';

      // JSDOM에서 isContentEditable은 contentEditable='true'로 설정해도 false일 수 있음
      // 따라서 실제 브라우저 동작을 모사하기 위해 isContentEditable을 수동으로 설정
      Object.defineProperty(div, 'isContentEditable', {
        value: true,
        configurable: true,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: div, enumerable: true });

      registeredHandler?.(event);

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('guardEditable: false 옵션으로 가드를 비활성화할 수 있다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape }, { guardEditable: false });

      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      registeredHandler?.(event);

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('일반 요소에서는 정상 동작한다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const div = document.createElement('div');
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: div, enumerable: true });

      registeredHandler?.(event);

      expect(onEscape).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Control Options', () => {
    let registeredHandler: ((evt: Event) => void) | null = null;

    beforeEach(() => {
      mockAddListener.mockImplementation((target, type, handler) => {
        registeredHandler = handler as (evt: Event) => void;
        return 'listener-id';
      });
    });

    afterEach(() => {
      registeredHandler = null;
    });

    it('기본적으로 preventDefault를 호출한다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      registeredHandler?.(event);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    });

    it('기본적으로 stopPropagation을 호출한다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      registeredHandler?.(event);

      expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
    });

    it('preventDefault: false 옵션을 적용한다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape }, { preventDefault: false });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      registeredHandler?.(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('stopPropagation: false 옵션을 적용한다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape }, { stopPropagation: false });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      registeredHandler?.(event);

      expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    it('핸들러가 없는 키는 preventDefault/stopPropagation을 호출하지 않는다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const event = new KeyboardEvent('keydown', {
        key: 'a', // 핸들러 없음
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      registeredHandler?.(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    it('preventDefault 에러를 조용히 처리한다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      vi.spyOn(event, 'preventDefault').mockImplementation(() => {
        throw new Error('preventDefault error');
      });

      expect(() => registeredHandler?.(event)).not.toThrow();
    });

    it('stopPropagation 에러를 조용히 처리한다', () => {
      const onEscape = vi.fn();
      navigator.subscribe({ onEscape });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      vi.spyOn(event, 'stopPropagation').mockImplementation(() => {
        throw new Error('stopPropagation error');
      });

      expect(() => registeredHandler?.(event)).not.toThrow();
    });
  });
});
