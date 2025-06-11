/**
 * Safe DOM Utilities Unit Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SafeDOMUtil } from '../../../../../../src/shared/utils/core/dom/safe-dom';

// Logger 모킹 - 알리아스 경로 사용
vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('SafeDOMUtil', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock DOM 요소 생성
    mockElement = {
      id: 'test-container',
      tagName: 'DIV',
      className: 'test-class',
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(),
      getAttribute: vi.fn(),
      setAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      click: vi.fn(),
      children: [],
    } as any;

    // Mock document methods
    vi.spyOn(document, 'querySelector').mockImplementation(vi.fn());
    vi.spyOn(document, 'querySelectorAll').mockImplementation(vi.fn());
    vi.spyOn(document, 'getElementById').mockImplementation(vi.fn());
    vi.spyOn(document, 'createElement').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('querySelector', () => {
    it('요소를 안전하게 선택해야 함', () => {
      const mockFoundElement = document.createElement('div');
      vi.mocked(document.querySelector).mockReturnValue(mockFoundElement);

      const result = SafeDOMUtil.querySelector('.test-class');
      expect(result).toBe(mockFoundElement);
      expect(document.querySelector).toHaveBeenCalledWith('.test-class');
    });

    it('존재하지 않는 요소에 대해 null을 반환해야 함', () => {
      vi.mocked(document.querySelector).mockReturnValue(null);

      const result = SafeDOMUtil.querySelector('.non-existent');
      expect(result).toBeNull();
    });

    it('잘못된 선택자에 대해 안전하게 처리해야 함', () => {
      vi.mocked(document.querySelector).mockImplementation(() => {
        throw new Error('Invalid selector');
      });

      const result = SafeDOMUtil.querySelector('invalid-[selector');
      expect(result).toBeNull();
    });

    it('컨테이너 내에서 요소를 선택해야 함', () => {
      const mockFoundElement = document.createElement('span');
      mockElement.querySelector.mockReturnValue(mockFoundElement);

      const result = SafeDOMUtil.querySelector('span', mockElement);
      expect(result).toBe(mockFoundElement);
      expect(mockElement.querySelector).toHaveBeenCalledWith('span');
    });

    it('빈 선택자에 대해 null을 반환해야 함', () => {
      const result = SafeDOMUtil.querySelector('');
      expect(result).toBeNull();
      expect(document.querySelector).not.toHaveBeenCalled();
    });
  });

  describe('querySelectorAll', () => {
    it('모든 매칭 요소를 반환해야 함', () => {
      const mockElements = [document.createElement('div'), document.createElement('div')];
      const mockNodeList = Object.assign(mockElements, {
        forEach: vi.fn(),
        length: mockElements.length,
      }) as any;

      vi.mocked(document.querySelectorAll).mockReturnValue(mockNodeList);

      const result = SafeDOMUtil.querySelectorAll('.test-class');
      expect(result).toBe(mockNodeList);
      expect(document.querySelectorAll).toHaveBeenCalledWith('.test-class');
    });

    it('매칭되는 요소가 없으면 빈 배열을 반환해야 함', () => {
      const emptyNodeList = Object.assign([], {
        forEach: vi.fn(),
        length: 0,
      }) as any;

      vi.mocked(document.querySelectorAll).mockReturnValue(emptyNodeList);

      const result = SafeDOMUtil.querySelectorAll('.non-existent');
      expect(result.length).toBe(0);
    });

    it('잘못된 선택자에 대해 빈 배열을 반환해야 함', () => {
      vi.mocked(document.querySelectorAll).mockImplementation(() => {
        throw new Error('Invalid selector');
      });

      const result = SafeDOMUtil.querySelectorAll('invalid-[selector');
      expect(result.length).toBe(0);
    });
  });

  describe('getElementById', () => {
    it('ID로 요소를 찾아야 함', () => {
      const mockFoundElement = document.createElement('div');
      vi.mocked(document.getElementById).mockReturnValue(mockFoundElement);

      const result = SafeDOMUtil.getElementById('test-id');
      expect(result).toBe(mockFoundElement);
      expect(document.getElementById).toHaveBeenCalledWith('test-id');
    });

    it('존재하지 않는 ID에 대해 null을 반환해야 함', () => {
      vi.mocked(document.getElementById).mockReturnValue(null);

      const result = SafeDOMUtil.getElementById('non-existent-id');
      expect(result).toBeNull();
    });

    it('빈 ID에 대해 null을 반환해야 함', () => {
      const result = SafeDOMUtil.getElementById('');
      expect(result).toBeNull();
      expect(document.getElementById).not.toHaveBeenCalled();
    });
  });

  describe('createElement', () => {
    it('요소를 안전하게 생성해야 함', () => {
      const mockCreatedElement = document.createElement('div');
      vi.mocked(document.createElement).mockReturnValue(mockCreatedElement as any);

      const result = SafeDOMUtil.createElement('div');
      expect(result).toBe(mockCreatedElement);
      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    it('속성과 함께 요소를 생성해야 함', () => {
      const mockCreatedElement = {
        tagName: 'DIV',
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      } as any;

      vi.mocked(document.createElement).mockReturnValue(mockCreatedElement);

      const result = SafeDOMUtil.createElement('div', { id: 'test-id', class: 'test-class' });
      expect(result).toBe(mockCreatedElement);
      expect(mockCreatedElement.setAttribute).toHaveBeenCalledWith('id', 'test-id');
      expect(mockCreatedElement.setAttribute).toHaveBeenCalledWith('class', 'test-class');
    });

    it('잘못된 태그명에 대해 안전하게 처리해야 함', () => {
      vi.mocked(document.createElement).mockImplementation(() => {
        throw new Error('Invalid tag name');
      });

      const result = SafeDOMUtil.createElement('invalid-tag');
      expect(result).toBeNull();
    });
  });

  describe('setAttribute', () => {
    it('속성을 안전하게 설정해야 함', () => {
      mockElement.setAttribute = vi.fn();

      const result = SafeDOMUtil.setAttribute(mockElement, 'data-test', 'value');
      expect(result).toBe(true);
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-test', 'value');
    });

    it('null 요소에 대해 false를 반환해야 함', () => {
      const result = SafeDOMUtil.setAttribute(null, 'data-test', 'value');
      expect(result).toBe(false);
    });

    it('빈 속성명에 대해 false를 반환해야 함', () => {
      const result = SafeDOMUtil.setAttribute(mockElement, '', 'value');
      expect(result).toBe(false);
    });
  });

  describe('getAttribute', () => {
    it('속성값을 안전하게 가져와야 함', () => {
      mockElement.getAttribute = vi.fn().mockReturnValue('test-value');

      const result = SafeDOMUtil.getAttribute(mockElement, 'data-test');
      expect(result).toBe('test-value');
      expect(mockElement.getAttribute).toHaveBeenCalledWith('data-test');
    });

    it('존재하지 않는 속성에 대해 null을 반환해야 함', () => {
      mockElement.getAttribute = vi.fn().mockReturnValue(null);

      const result = SafeDOMUtil.getAttribute(mockElement, 'non-existent');
      expect(result).toBeNull();
    });

    it('null 요소에 대해 null을 반환해야 함', () => {
      const result = SafeDOMUtil.getAttribute(null, 'data-test');
      expect(result).toBeNull();
    });
  });

  describe('addEventListener', () => {
    it('이벤트 리스너를 안전하게 추가해야 함', () => {
      mockElement.addEventListener = vi.fn();
      const mockListener = vi.fn();

      const result = SafeDOMUtil.addEventListener(mockElement, 'click', mockListener);
      expect(result).toBe(true);
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', mockListener, undefined);
    });

    it('null 요소에 대해 false를 반환해야 함', () => {
      const mockListener = vi.fn();

      const result = SafeDOMUtil.addEventListener(null, 'click', mockListener);
      expect(result).toBe(false);
    });
  });

  describe('removeEventListener', () => {
    it('이벤트 리스너를 안전하게 제거해야 함', () => {
      mockElement.removeEventListener = vi.fn();
      const mockListener = vi.fn();

      const result = SafeDOMUtil.removeEventListener(mockElement, 'click', mockListener);
      expect(result).toBe(true);
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'click',
        mockListener,
        undefined
      );
    });

    it('null 요소에 대해 false를 반환해야 함', () => {
      const mockListener = vi.fn();

      const result = SafeDOMUtil.removeEventListener(null, 'click', mockListener);
      expect(result).toBe(false);
    });
  });

  describe('appendChild', () => {
    it('자식 요소를 안전하게 추가해야 함', () => {
      const childElement = {
        tagName: 'SPAN',
        parentNode: null,
      } as any;

      // mockElement의 appendChild가 실제로 성공했다고 모킹
      mockElement.appendChild = vi.fn().mockImplementation(child => {
        child.parentNode = mockElement;
        return child;
      });

      const result = SafeDOMUtil.appendChild(mockElement, childElement);
      expect(result).toBe(true);
      expect(mockElement.appendChild).toHaveBeenCalledWith(childElement);
    });

    it('null 부모 요소에 대해 false를 반환해야 함', () => {
      const childElement = {
        tagName: 'SPAN',
      } as any;

      const result = SafeDOMUtil.appendChild(null, childElement);
      expect(result).toBe(false);
    });
  });

  describe('removeChild', () => {
    it('자식 요소를 안전하게 제거해야 함', () => {
      const childElement = {
        tagName: 'SPAN',
        parentNode: mockElement,
      } as any;

      mockElement.removeChild = vi.fn().mockImplementation(child => {
        child.parentNode = null;
        return child;
      });

      const result = SafeDOMUtil.removeChild(mockElement, childElement);
      expect(result).toBe(true);
      expect(mockElement.removeChild).toHaveBeenCalledWith(childElement);
    });

    it('null 부모 요소에 대해 false를 반환해야 함', () => {
      const childElement = document.createElement('span');

      const result = SafeDOMUtil.removeChild(null, childElement);
      expect(result).toBe(false);
    });
  });

  describe('isElement', () => {
    it('Element 객체를 올바르게 식별해야 함', () => {
      // Mock DOM 요소를 Element-like 속성으로 생성
      const mockElement = {
        tagName: 'DIV',
        nodeType: 1, // ELEMENT_NODE
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      };

      // document.createElement가 적절한 mock 요소를 반환하도록 설정
      vi.mocked(document.createElement).mockReturnValue(mockElement as any);

      const element = document.createElement('div');
      const result = SafeDOMUtil.isElement(element);
      expect(result).toBe(true);
    });

    it('null에 대해 false를 반환해야 함', () => {
      const result = SafeDOMUtil.isElement(null);
      expect(result).toBe(false);
    });

    it('일반 객체에 대해 false를 반환해야 함', () => {
      const result = SafeDOMUtil.isElement({});
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('예외 발생 시 로깅되어야 함', async () => {
      vi.mocked(document.querySelector).mockImplementation(() => {
        throw new Error('Test error');
      });

      SafeDOMUtil.querySelector('.test');

      // 동적으로 모킹된 logger 가져오기
      const { logger } = await import('../../../../../../src/infrastructure/logging/logger');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
