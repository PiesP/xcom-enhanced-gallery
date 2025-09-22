/**
 * @fileoverview Focus Trap 접근성 스모크: Tab/Shift+Tab 순환 및 포커스 복귀
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFocusTrap } from '@/shared/utils/focusTrap';

describe('Focus Trap smoke (Tab/Shift+Tab & restore)', () => {
  let container: any;
  let outside: any;
  let b1: any;
  let b2: any;

  beforeEach(() => {
    // DOM 구성
    document.body.innerHTML = '';
    outside = document.createElement('button');
    outside.id = 'outside';
    outside.textContent = 'outside';
    document.body.appendChild(outside);

    container = document.createElement('div');
    container.id = 'trap';
    b1 = document.createElement('button');
    b1.id = 'b1';
    b1.textContent = 'one';
    b2 = document.createElement('button');
    b2.id = 'b2';
    b2.textContent = 'two';
    container.appendChild(b1);
    container.appendChild(b2);
    document.body.appendChild(container);

    outside.focus();
    expect(document.activeElement).toBe(outside);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('Tab은 마지막→첫 번째로, Shift+Tab은 첫 번째→마지막으로 순환한다', () => {
    const trap = createFocusTrap(container, { restoreFocus: true });
    trap.activate();

    // 활성화 시 첫 요소로 포커스 이동
    expect(document.activeElement).toBe(b1);

    // 마지막으로 이동 후 Tab → 첫 번째로 래핑
    b2.focus();
    expect(document.activeElement).toBe(b2);
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.dispatchEvent(tab);
    expect(document.activeElement).toBe(b1);

    // 첫 번째에서 Shift+Tab → 마지막으로 래핑
    const shiftTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });
    document.dispatchEvent(shiftTab);
    expect(document.activeElement).toBe(b2);

    trap.deactivate();
  });

  it('Escape 처리(onEscape) 후 비활성화 시 이전 포커스(outside)로 복원된다', () => {
    const onEscape = vi.fn();
    const trap = createFocusTrap(container, { restoreFocus: true, onEscape });
    trap.activate();

    // 초기 포커스는 컨테이너 내부
    expect(document.activeElement).toBe(b1);

    // Escape → onEscape 호출 후 비활성화하며 포커스 복원
    // onEscape에서 비활성화를 호출해 실제 시나리오를 모사
    onEscape.mockImplementation(() => trap.deactivate());

    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(esc);
    expect(onEscape).toHaveBeenCalledTimes(1);

    // 복원 확인
    expect(document.activeElement).toBe(outside);
  });
});
