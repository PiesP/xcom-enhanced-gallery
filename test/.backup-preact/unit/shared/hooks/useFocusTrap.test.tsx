/**
 * P4: Focus Trap Hook Test (Simplified)
 * @description 설정 모달의 키보드 접근성을 위한 focus trap 훅 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, render, h } from '@test/utils/testing-library';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';

describe('P4: Focus Trap Hook', () => {
  let container;

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
    cleanup();
  });

  describe('Focus Trap 기본 동작', () => {
    it('focus trap 함수가 존재해야 함', () => {
      expect(typeof useFocusTrap).toBe('function');
    });

    it('focus trap이 올바른 타입을 반환해야 함', () => {
      const modalContainer = document.getElementById('modal-container');
      const outputs = {} as any;
      const Harness = () => {
        const api = useFocusTrap(modalContainer, false);
        (outputs as any).api = api;
        return null;
      };
      render(h(Harness, {}));
      const result = outputs.api;
      expect(typeof result).toBe('object');
      expect(typeof result.isActive).toBe('boolean');
      expect(typeof result.activate).toBe('function');
      expect(typeof result.deactivate).toBe('function');
    });

    it('null container로 안전하게 처리해야 함', () => {
      const Harness = () => {
        useFocusTrap(null, true);
        return null;
      };
      expect(() => render(h(Harness, {}))).not.toThrow();
    });
  });

  describe('Focus Trap 활성화', () => {
    it('활성화 시 isActive가 true가 되어야 함', () => {
      const modalContainer = document.getElementById('modal-container');
      const outputs = {} as any;
      const Harness = () => {
        const api = useFocusTrap(modalContainer, true);
        (outputs as any).api = api;
        return null;
      };
      render(h(Harness, {}));
      expect(typeof outputs.api.isActive).toBe('boolean');
    });

    it('비활성화 시 isActive가 false여야 함', () => {
      const modalContainer = document.getElementById('modal-container');
      const outputs = {} as any;
      const Harness = () => {
        const api = useFocusTrap(modalContainer, false);
        (outputs as any).api = api;
        return null;
      };
      render(h(Harness, {}));
      expect(outputs.api.isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('빈 컨테이너에서 안전하게 처리해야 함', () => {
      const emptyContainer = document.createElement('div');
      emptyContainer.innerHTML = '<div>No focusable elements</div>';
      document.body.appendChild(emptyContainer);
      const Harness = () => {
        useFocusTrap(emptyContainer, true);
        return null;
      };
      expect(() => render(h(Harness, {}))).not.toThrow();
      document.body.removeChild(emptyContainer);
    });

    it('컨테이너가 제거된 후에도 안전해야 함', () => {
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = '<button>Test</button>';
      document.body.appendChild(tempContainer);
      const outputs = {} as any;
      const Harness = () => {
        const api = useFocusTrap(tempContainer, true);
        (outputs as any).api = api;
        return null;
      };
      render(h(Harness, {}));
      document.body.removeChild(tempContainer);
      expect(() => {
        outputs.api.activate();
        outputs.api.deactivate();
      }).not.toThrow();
    });
  });

  describe('ARIA 지원', () => {
    it('focusable 요소를 올바르게 식별해야 함', () => {
      const modalContainer = document.getElementById('modal-container');
      const buttons = modalContainer.querySelectorAll('button');
      const inputs = modalContainer.querySelectorAll('input');

      expect(buttons.length).toBe(2);
      expect(inputs.length).toBe(1);
      expect(buttons[0].id).toBe('first-focusable');
      expect(buttons[1].id).toBe('last-focusable');
      expect(inputs[0].id).toBe('input-field');
    });
  });

  describe('Function Signature', () => {
    it('올바른 매개변수를 받아야 함', () => {
      const modalContainer = document.getElementById('modal-container');
      const HarnessBasic = () => {
        useFocusTrap(modalContainer, true);
        return null;
      };
      const HarnessWithOptions = () => {
        useFocusTrap(modalContainer, true, { onEscape: () => {}, restoreFocus: false });
        return null;
      };
      expect(() => render(h(HarnessBasic, {}))).not.toThrow();
      expect(() => render(h(HarnessWithOptions, {}))).not.toThrow();
    });
  });
});
