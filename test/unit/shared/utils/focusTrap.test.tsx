/**
 * P4: Focus Trap Utility Test
 * @description 설정 모달의 키보드 접근성을 위한 focus trap 유틸리티 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createFocusTrap } from '@shared/utils/focus-trap';

describe('P4: Focus Trap Utility', () => {
  type ModalContainerElement = HTMLElement;

  let container: ModalContainerElement;

  const getModalContainer = (): ModalContainerElement => {
    const modal = document.getElementById('modal-container');
    if (!(modal instanceof HTMLElement)) {
      throw new Error('Modal container가 준비되지 않았습니다.');
    }
    return modal;
  };

  beforeEach(() => {
    // DOM 환경 설정
    container = document.createElement('div');
    container.innerHTML = `
      <div id="modal-container">
        <button id="first-focusable">First Button</button>
        <input id="input-field" type="text" placeholder="Input">
        <button id="last-focusable">Last Button</button>
      </div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  describe('Focus Trap 생성', () => {
    it('createFocusTrap 함수가 존재해야 함', () => {
      expect(typeof createFocusTrap).toBe('function');
    });

    it('focus trap 인스턴스를 반환해야 함', () => {
      const modalContainer = getModalContainer();
      const focusTrap = createFocusTrap(modalContainer);

      expect(typeof focusTrap).toBe('object');
      expect(typeof focusTrap.isActive).toBe('boolean');
      expect(typeof focusTrap.activate).toBe('function');
      expect(typeof focusTrap.deactivate).toBe('function');
      expect(typeof focusTrap.destroy).toBe('function');
    });

    it('null container로 안전하게 처리해야 함', () => {
      expect(() => {
        createFocusTrap(null);
      }).not.toThrow();
    });
  });

  describe('Focus Trap 활성화', () => {
    it('초기 상태는 비활성화여야 함', () => {
      const modalContainer = getModalContainer();
      const focusTrap = createFocusTrap(modalContainer);

      expect(focusTrap.isActive).toBe(false);
    });

    it('activate 호출 시 활성화되어야 함', () => {
      const modalContainer = getModalContainer();
      const focusTrap = createFocusTrap(modalContainer);

      focusTrap.activate();
      expect(focusTrap.isActive).toBe(true);
    });

    it('deactivate 호출 시 비활성화되어야 함', () => {
      const modalContainer = getModalContainer();
      const focusTrap = createFocusTrap(modalContainer);

      focusTrap.activate();
      focusTrap.deactivate();
      expect(focusTrap.isActive).toBe(false);
    });
  });

  describe('Focus 관리', () => {
    test('활성화 시 첫 번째 요소로 포커스 이동해야 함', () => {
      const modalContainer = getModalContainer();
      const firstButton = document.getElementById('first-focusable');
      if (!(firstButton instanceof HTMLElement)) {
        throw new Error('첫 번째 focusable 요소 버튼이 없습니다.');
      }

      // focus 메서드를 spy로 감시
      const focusSpy = vi.spyOn(firstButton, 'focus');

      const focusTrap = createFocusTrap(modalContainer);

      focusTrap.activate();

      // focus 메서드가 호출되었는지 확인
      expect(focusSpy).toHaveBeenCalled();

      focusSpy.mockRestore();
    });

    it('initialFocus 옵션이 작동해야 함', () => {
      const modalContainer = getModalContainer();
      const inputField = document.getElementById('input-field');
      if (!(inputField instanceof HTMLElement)) {
        throw new Error('초기 포커스 대상 요소가 없습니다.');
      }
      const focusTrap = createFocusTrap(modalContainer, {
        initialFocus: '#input-field',
      });

      focusTrap.activate();
      expect(document.activeElement).toBe(inputField);
    });
  });

  describe('Error Handling', () => {
    it('빈 컨테이너에서 안전하게 처리해야 함', () => {
      const emptyContainer = document.createElement('div');
      emptyContainer.innerHTML = '<div>No focusable elements</div>';
      document.body.appendChild(emptyContainer);

      expect(() => {
        const focusTrap = createFocusTrap(emptyContainer);
        focusTrap.activate();
        focusTrap.deactivate();
      }).not.toThrow();

      document.body.removeChild(emptyContainer);
    });

    it('컨테이너 제거 후에도 안전해야 함', () => {
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = '<button>Test</button>';
      document.body.appendChild(tempContainer);

      const focusTrap = createFocusTrap(tempContainer);
      focusTrap.activate();

      // 컨테이너 제거
      document.body.removeChild(tempContainer);

      // 여전히 안전하게 함수 호출 가능해야 함
      expect(() => {
        focusTrap.deactivate();
        focusTrap.destroy();
      }).not.toThrow();
    });
  });

  describe('Options', () => {
    it('onEscape 콜백을 받아야 함', () => {
      const modalContainer = getModalContainer();

      expect(() => {
        createFocusTrap(modalContainer, {
          onEscape: () => console.log('Escape pressed'),
        });
      }).not.toThrow();
    });

    it('restoreFocus 옵션을 받아야 함', () => {
      const modalContainer = getModalContainer();

      expect(() => {
        createFocusTrap(modalContainer, {
          restoreFocus: false,
        });
      }).not.toThrow();
    });
  });

  describe('Resource Management', () => {
    it('destroy 호출 시 정리되어야 함', () => {
      const modalContainer = getModalContainer();
      const focusTrap = createFocusTrap(modalContainer);

      focusTrap.activate();
      expect(focusTrap.isActive).toBe(true);

      focusTrap.destroy();
      expect(focusTrap.isActive).toBe(false);
    });

    it('여러 번 activate/deactivate 호출해도 안전해야 함', () => {
      const modalContainer = getModalContainer();
      const focusTrap = createFocusTrap(modalContainer);

      expect(() => {
        focusTrap.activate();
        focusTrap.activate(); // 이미 활성화된 상태
        focusTrap.deactivate();
        focusTrap.deactivate(); // 이미 비활성화된 상태
      }).not.toThrow();
    });
  });

  describe('ARIA Support', () => {
    it('focusable 요소를 올바르게 식별해야 함', () => {
      const modalContainer = getModalContainer();
      const buttons = Array.from(modalContainer.querySelectorAll('button'));
      const inputs = Array.from(modalContainer.querySelectorAll('input'));

      expect(buttons.length).toBe(2);
      expect(inputs.length).toBe(1);

      const [firstButton, lastButton] = buttons;
      const [inputField] = inputs;

      if (!firstButton || !lastButton || !inputField) {
        throw new Error('필수 focusable 요소가 누락되었습니다.');
      }

      expect(firstButton.id).toBe('first-focusable');
      expect(lastButton.id).toBe('last-focusable');
      expect(inputField.id).toBe('input-field');
    });
  });
});
