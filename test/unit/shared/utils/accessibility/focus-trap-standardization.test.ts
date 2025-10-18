/**
 * Focus Trap 표준화 테스트
 * 접근성 유틸의 createFocusTrap이 통합 유틸(@shared/utils/focusTrap)로 위임하는지 검증
 */

/* eslint-env browser */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import modules to be tested
import { createFocusTrap as legacyCreateFocusTrap } from '@/shared/utils/accessibility/keyboard-navigation';
import * as focusTrapModule from '@/shared/utils/focus-trap';

describe('Focus Trap 표준화 (keyboard-navigation → unified focusTrap)', () => {
  let container: HTMLElement;
  let createFocusTrapSpy: ReturnType<typeof vi.spyOn>;
  let trapInstance: ReturnType<typeof focusTrapModule.createFocusTrap>;

  beforeEach(() => {
    container = globalThis.document.createElement('div');
    container.innerHTML = `
      <button id="first">First</button>
      <button id="last">Last</button>
    `;
    globalThis.document.body.appendChild(container);

    // Set up spy on the unified createFocusTrap
    trapInstance = {
      isActive: false,
      activate: vi.fn(),
      deactivate: vi.fn(),
      destroy: vi.fn(),
    };
    createFocusTrapSpy = vi.spyOn(focusTrapModule, 'createFocusTrap').mockReturnValue(trapInstance);
  });

  afterEach(() => {
    if (globalThis.document.body.contains(container))
      globalThis.document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('keyboard-navigation.createFocusTrap은 unified.createFocusTrap으로 위임해야 한다', () => {
    // when
    legacyCreateFocusTrap(container);

    // then
    expect(createFocusTrapSpy).toHaveBeenCalledTimes(1);
    expect(createFocusTrapSpy).toHaveBeenCalledWith(container, expect.any(Object));
  });

  it('위임 후 즉시 activate를 호출하여 trap을 활성화해야 한다', () => {
    // legacyCreateFocusTrap returns void but should call the unified version
    legacyCreateFocusTrap(container);

    // The unified createFocusTrap should have been called
    expect(createFocusTrapSpy).toHaveBeenCalledTimes(1);
    // The trap instance should have been activated
    expect(trapInstance.activate).toHaveBeenCalledTimes(1);
  });
});
