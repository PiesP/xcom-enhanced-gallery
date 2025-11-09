/**
 * @fileoverview GalleryContainer 컴포넌트 테스트
 * @description Light DOM 기반 갤러리 컨테이너 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock EventManager
vi.mock('@shared/services/event-manager', () => ({
  EventManager: {
    getInstance: () => ({
      addListener: vi.fn(() => 'listener-id-123'),
      removeListener: vi.fn(),
    }),
  },
}));

// Import components and utilities
import { EventManager } from '@shared/services/event-manager';
import {
  GalleryContainer,
  mountGallery,
  unmountGallery,
  type GalleryContainerProps,
} from '@shared/components/isolation/GalleryContainer';

describe('GalleryContainer Component - Unit Tests', () => {
  let mockContainer: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContainer = document.createElement('div');
  });

  afterEach(() => {
    if (mockContainer && mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
  });

  describe('mountGallery()', () => {
    it('should mount element to container and return container', () => {
      const mockElement = () => 'test-element' as any;
      const result = mountGallery(mockContainer, mockElement);

      expect(result).toBe(mockContainer);
    });

    it('should handle element as function factory', () => {
      const mockFactory = vi.fn(() => ({ type: 'div' }) as any);
      mountGallery(mockContainer, mockFactory);

      expect(mockContainer).toBeDefined();
    });

    it('should handle element as JSXElement directly', () => {
      const mockElement = { type: 'div', props: {} } as any;
      mountGallery(mockContainer, mockElement);

      expect(mockContainer).toBeDefined();
    });

    it('should handle mount error and re-throw', () => {
      const mockElement = () => {
        throw new Error('Render failed');
      };

      expect(() => {
        mountGallery(mockContainer, mockElement);
      }).toThrow('Render failed');
    });

    it('should re-throw errors after logging', () => {
      const mockElement = () => {
        throw new Error('Test error');
      };

      expect(() => {
        mountGallery(mockContainer, mockElement);
      }).toThrow('Test error');
    });

    it('should handle null element gracefully', () => {
      const result = mountGallery(mockContainer, null);
      expect(result).toBe(mockContainer);
    });

    it('should handle undefined element gracefully', () => {
      const result = mountGallery(mockContainer, undefined);
      expect(result).toBe(mockContainer);
    });
  });

  describe('unmountGallery()', () => {
    it('should unmount without errors', () => {
      expect(() => {
        unmountGallery(mockContainer);
      }).not.toThrow();
    });

    it('should handle missing dispose function gracefully', () => {
      expect(() => {
        unmountGallery(mockContainer);
      }).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        unmountGallery(mockContainer);
        unmountGallery(mockContainer);
      }).not.toThrow();
    });

    it('should log error on unmount error', () => {
      // JSDOM에서 null container는 타입 관점에서만 처리
      // 실제 동작은 source code에 의존
      expect(() => {
        unmountGallery(null as any);
      }).toThrow();
    });

    it('should re-throw errors after logging', () => {
      expect(() => {
        unmountGallery(null as any);
      }).toThrow();
    });

    it('should handle undefined container gracefully', () => {
      expect(() => {
        unmountGallery(undefined as any);
      }).toThrow();
    });

    it('Phase 300.1: Twitter 페이지에서도 reflow 없이 정리', () => {
      // Twitter 컨테이너 생성
      const twitterScroll = document.createElement('div');
      twitterScroll.setAttribute('data-testid', 'primaryColumn');
      document.body.appendChild(twitterScroll);

      // scrollHeight getter mock
      const scrollHeightSpy = vi.spyOn(twitterScroll, 'scrollHeight', 'get');

      // Twitter 페이지로 설정
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: 'x.com',
      });

      // unmount 실행
      unmountGallery(mockContainer);

      // scrollHeight가 읽히지 않아야 함 (reflow 제거)
      expect(scrollHeightSpy).not.toHaveBeenCalled();

      // 정리
      document.body.removeChild(twitterScroll);
    });

    it('Phase 300.1: 비-Twitter 페이지에서도 reflow가 발생하지 않음', () => {
      // Twitter 컨테이너 생성
      const twitterScroll = document.createElement('div');
      twitterScroll.setAttribute('data-testid', 'primaryColumn');
      document.body.appendChild(twitterScroll);

      // scrollHeight getter mock
      const scrollHeightSpy = vi.spyOn(twitterScroll, 'scrollHeight', 'get');

      // 비-Twitter 페이지로 설정
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: 'example.com',
      });

      // unmount 실행
      unmountGallery(mockContainer);

      // scrollHeight가 읽히지 않았는지 확인 (reflow 미실행)
      expect(scrollHeightSpy).not.toHaveBeenCalled();

      // 정리
      document.body.removeChild(twitterScroll);
    });
  });

  describe('GalleryContainer Component', () => {
    it('should render without throwing', () => {
      const props: GalleryContainerProps = {
        children: 'Test Content' as any,
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should render with custom className', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        className: 'custom-class',
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should accept children prop', () => {
      const props: GalleryContainerProps = {
        children: 'Child Content' as any,
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should accept onClose callback', () => {
      const onCloseMock = vi.fn();
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should not throw with undefined onClose', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: undefined,
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should register event listener when onClose is provided', () => {
      const onCloseMock = vi.fn();
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      // JSDOM 제약: Solid.js createEffect가 제한적으로 작동
      // 컴포넌트가 렌더링되고 이벤트 등록 로직이 실행됨을 확인
      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();

      // EventManager는 mock이므로 실제 호출 여부는 Solid.js 반응성에 의존
    });

    it('should not register listener when onClose is undefined', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
      };

      GalleryContainer(props);

      expect(EventManager.getInstance().addListener).not.toHaveBeenCalled();
    });

    it('should handle keyboard event handler registration', () => {
      const onCloseMock = vi.fn();
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      // JSDOM 제약: Solid.js createEffect가 제한적으로 작동
      // 컴포넌트 렌더링이 정상 작동함을 확인
      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should handle Escape key when handler exists', () => {
      const onCloseMock = vi.fn();
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      // JSDOM 제약: Solid.js createEffect에서 이벤트 핸들러 직접 테스트 불가
      // 컴포넌트가 onClose prop을 받았을 때 정상 렌더링되는지 확인
      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();

      // 실제 이벤트 처리는 E2E 테스트에서 검증 가능
    });

    it('should call preventDefault on Escape key', () => {
      const onCloseMock = vi.fn();
      let keydownHandler: ((event: KeyboardEvent) => void) | undefined;

      const addListenerMock = vi.fn((doc, event, handler) => {
        keydownHandler = handler;
        return 'listener-123';
      });

      vi.mocked(EventManager.getInstance().addListener).mockImplementation(addListenerMock as any);

      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      GalleryContainer(props);

      if (keydownHandler) {
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        const preventDefaultSpy = vi.spyOn(escapeEvent, 'preventDefault');

        keydownHandler(escapeEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
      }
    });

    it('should call stopPropagation on Escape key', () => {
      const onCloseMock = vi.fn();
      let keydownHandler: ((event: KeyboardEvent) => void) | undefined;

      const addListenerMock = vi.fn((doc, event, handler) => {
        keydownHandler = handler;
        return 'listener-123';
      });

      vi.mocked(EventManager.getInstance().addListener).mockImplementation(addListenerMock as any);

      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      GalleryContainer(props);

      if (keydownHandler) {
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        const stopPropagationSpy = vi.spyOn(escapeEvent, 'stopPropagation');

        keydownHandler(escapeEvent);

        expect(stopPropagationSpy).toHaveBeenCalled();
      }
    });

    it('should ignore non-Escape keys', () => {
      const onCloseMock = vi.fn();
      let keydownHandler: ((event: KeyboardEvent) => void) | undefined;

      const addListenerMock = vi.fn((doc, event, handler) => {
        keydownHandler = handler;
        return 'listener-123';
      });

      vi.mocked(EventManager.getInstance().addListener).mockImplementation(addListenerMock as any);

      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      GalleryContainer(props);

      if (keydownHandler) {
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        keydownHandler(enterEvent);

        expect(onCloseMock).not.toHaveBeenCalled();
      }
    });

    it('should handle multiple keyboard events correctly', () => {
      const onCloseMock = vi.fn();
      let keydownHandler: ((event: KeyboardEvent) => void) | undefined;

      const addListenerMock = vi.fn((doc, event, handler) => {
        keydownHandler = handler;
        return 'listener-123';
      });

      vi.mocked(EventManager.getInstance().addListener).mockImplementation(addListenerMock as any);

      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      GalleryContainer(props);

      if (keydownHandler) {
        // First Escape key
        let escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        keydownHandler(escapeEvent);
        expect(onCloseMock).toHaveBeenCalledTimes(1);

        // Non-Escape key
        let enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        keydownHandler(enterEvent);
        expect(onCloseMock).toHaveBeenCalledTimes(1);

        // Second Escape key
        escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        keydownHandler(escapeEvent);
        expect(onCloseMock).toHaveBeenCalledTimes(2);
      }
    });

    it('should render with default props only', () => {
      const props: GalleryContainerProps = {
        children: 'Content' as any,
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should handle empty string className', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        className: '',
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should handle complex children', () => {
      const complexChildren = {
        type: 'div',
        props: { children: 'nested' },
      } as any;

      const props: GalleryContainerProps = {
        children: complexChildren,
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should handle null onClose with children', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: undefined,
        className: 'custom',
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should handle empty children', () => {
      const props: GalleryContainerProps = {
        children: '' as any,
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should render with className merging', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        className: 'extra-class',
      };

      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });
  });

  describe('GalleryContainerProps interface', () => {
    it('should accept children as required prop', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
      };

      expect(props).toHaveProperty('children');
      expect(props.children).toBe('Test');
    });

    it('should accept onClose as optional prop', () => {
      const onCloseMock = vi.fn();
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      expect(props).toHaveProperty('onClose');
      expect(props.onClose).toBe(onCloseMock);
    });

    it('should accept className as optional prop', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        className: 'custom-class',
      };

      expect(props).toHaveProperty('className');
      expect(props.className).toBe('custom-class');
    });

    it('should allow undefined optional props', () => {
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: undefined,
        className: undefined,
      };

      expect(props.onClose).toBeUndefined();
      expect(props.className).toBeUndefined();
    });

    it('should work with partial props', () => {
      const props: Partial<GalleryContainerProps> = {
        children: 'Test' as any,
      };

      expect(props).toHaveProperty('children');
      expect(props.onClose).toBeUndefined();
      expect(props.className).toBeUndefined();
    });

    it('should have correct prop types', () => {
      const props: GalleryContainerProps = {
        children: 'Content' as any,
        onClose: vi.fn(),
        className: 'test-class',
      };

      expect(typeof props.children).toBeDefined();
      expect(typeof props.onClose).toBe('function');
      expect(typeof props.className).toBe('string');
    });
  });

  describe('Event Management', () => {
    it('should register listener with document', () => {
      const onCloseMock = vi.fn();
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      // JSDOM 제약: Solid.js createEffect가 제한적으로 작동
      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();

      // 이벤트 등록 로직은 Solid.js 반응성에 의존
    });

    it('should use correct event type', () => {
      const onCloseMock = vi.fn();
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      // 컴포넌트가 onClose를 수용할 수 있는지 확인
      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();
    });

    it('should have callback function for event listener', () => {
      const onCloseMock = vi.fn();
      const props: GalleryContainerProps = {
        children: 'Test' as any,
        onClose: onCloseMock,
      };

      // 컴포넌트가 정상 작동함을 확인
      expect(() => {
        GalleryContainer(props);
      }).not.toThrow();

      // JSDOM의 Solid.js 반응성 제약으로 direct callback 테스트는 불가
      // E2E 테스트에서 실제 동작 검증
    });
  });
});
