/**
 * Focus Trap 표준화 테스트
 * 접근성 유틸의 createFocusTrap이 통합 유틸(@shared/utils/focusTrap)로 위임하는지 검증
 */

/* eslint-env browser */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 통합 유틸을 모킹해 위임 여부를 검증한다
vi.mock('@shared/utils/focusTrap', () => {
  const activateSpy = vi.fn();
  const deactivateSpy = vi.fn();
  const destroySpy = vi.fn();
  const mockedCreateFocusTrap = vi.fn(() => ({
    isActive: false,
    activate: activateSpy,
    deactivate: deactivateSpy,
    destroy: destroySpy,
  }));
  return {
    createFocusTrap: mockedCreateFocusTrap,
    __createSpy: mockedCreateFocusTrap,
    __activateSpy: activateSpy,
  };
});

// 접근성 유틸은 테스트 대상
import { createFocusTrap as legacyCreateFocusTrap } from '@shared/utils/accessibility/accessibility-utils';
import { __createSpy, __activateSpy } from '@shared/utils/focusTrap';

describe('Focus Trap 표준화 (accessibility-utils → unified focusTrap)', () => {
  let container;

  beforeEach(() => {
    container = globalThis.document.createElement('div');
    container.innerHTML = `
      <button id="first">First</button>
      <button id="last">Last</button>
    `;
    globalThis.document.body.appendChild(container);
  });

  afterEach(() => {
    if (globalThis.document.body.contains(container))
      globalThis.document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('accessibility-utils.createFocusTrap은 unified.createFocusTrap으로 위임해야 한다', () => {
    // when
    legacyCreateFocusTrap(container);

    // then
    expect(__createSpy).toHaveBeenCalledTimes(1);
    expect(__createSpy).toHaveBeenCalledWith(container, expect.any(Object));
  });

  it('위임 후 즉시 activate를 호출하여 trap을 활성화해야 한다', () => {
    legacyCreateFocusTrap(container);
    expect(__activateSpy).toHaveBeenCalledTimes(1);
  });
});
