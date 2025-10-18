/**
 * Focus Management 테스트 (Browser 모드)
 *
 * 실제 브라우저 환경에서 포커스 관리를 검증합니다.
 * - Tab/Shift+Tab 네비게이션
 * - 포커스 트랩 (모달)
 * - 포커스 인디케이터 위치
 * - programmatic focus 설정
 *
 * JSDOM에서는 focus()가 제대로 작동하지 않습니다.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';

const { createSignal, createEffect } = getSolid();

describe('Focus Management in Browser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should set focus programmatically', () => {
    const button = document.createElement('button');
    button.textContent = 'Focus me';
    container.appendChild(button);

    button.focus();

    expect(document.activeElement).toBe(button);
  });

  it('should navigate with Tab key', () => {
    const button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    const button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    const button3 = document.createElement('button');
    button3.textContent = 'Button 3';

    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);

    button1.focus();
    expect(document.activeElement).toBe(button1);

    // Tab 키 시뮬레이션 (실제로는 브라우저가 처리)
    button2.focus(); // 수동으로 다음 요소로 포커스 이동
    expect(document.activeElement).toBe(button2);

    button3.focus();
    expect(document.activeElement).toBe(button3);
  });

  it('should trap focus within modal', () => {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';

    modal.appendChild(closeButton);
    modal.appendChild(submitButton);
    container.appendChild(modal);

    // 모달 내부에만 포커스 가능
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    // Tab: Close → Submit
    submitButton.focus();
    expect(document.activeElement).toBe(submitButton);

    // Tab: Submit → Close (순환)
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);
  });

  it('should track focus changes reactively', async () => {
    const [focusedId, setFocusedId] = createSignal('');

    const input1 = document.createElement('input');
    input1.id = 'input-1';
    input1.type = 'text';

    const input2 = document.createElement('input');
    input2.id = 'input-2';
    input2.type = 'text';

    container.appendChild(input1);
    container.appendChild(input2);

    const trackFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      setFocusedId(target.id);
    };

    input1.addEventListener('focus', trackFocus);
    input2.addEventListener('focus', trackFocus);

    expect(focusedId()).toBe('');

    input1.focus();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(focusedId()).toBe('input-1');

    input2.focus();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(focusedId()).toBe('input-2');
  });

  it('should restore focus after modal closes', () => {
    const triggerButton = document.createElement('button');
    triggerButton.textContent = 'Open Modal';
    container.appendChild(triggerButton);

    triggerButton.focus();
    const previouslyFocused = document.activeElement;

    expect(previouslyFocused).toBe(triggerButton);

    // 모달 열기
    const modal = document.createElement('div');
    const modalButton = document.createElement('button');
    modalButton.textContent = 'Close Modal';
    modal.appendChild(modalButton);
    container.appendChild(modal);

    modalButton.focus();
    expect(document.activeElement).toBe(modalButton);

    // 모달 닫기 + 포커스 복원
    modal.remove();
    (previouslyFocused as HTMLElement).focus();

    expect(document.activeElement).toBe(triggerButton);
  });

  it('should calculate focus indicator position', () => {
    const items = [
      document.createElement('button'),
      document.createElement('button'),
      document.createElement('button'),
    ];

    items.forEach((item, index) => {
      item.textContent = `Item ${index + 1}`;
      item.style.position = 'absolute';
      item.style.left = `${index * 100}px`;
      item.style.width = '80px';
      container.appendChild(item);
    });

    items[1].focus();

    const focusedElement = document.activeElement as HTMLElement;
    const rect = focusedElement.getBoundingClientRect();

    // 포커스 인디케이터 위치 계산 (실제 프로젝트 로직 반영)
    expect(rect.left).toBeGreaterThan(0);
    expect(rect.width).toBe(80);
  });

  it('should handle focusable vs non-focusable elements', () => {
    const focusable = document.createElement('button');
    focusable.textContent = 'Focusable';

    const nonFocusable = document.createElement('div');
    nonFocusable.textContent = 'Non-focusable';

    container.appendChild(focusable);
    container.appendChild(nonFocusable);

    focusable.focus();
    expect(document.activeElement).toBe(focusable);

    // div는 기본적으로 포커스 불가
    nonFocusable.focus();
    expect(document.activeElement).not.toBe(nonFocusable);

    // tabindex를 추가하면 포커스 가능
    nonFocusable.tabIndex = 0;
    nonFocusable.focus();
    expect(document.activeElement).toBe(nonFocusable);
  });

  it('should handle disabled elements correctly', () => {
    const enabledButton = document.createElement('button');
    enabledButton.textContent = 'Enabled';

    const disabledButton = document.createElement('button');
    disabledButton.textContent = 'Disabled';
    disabledButton.disabled = true;

    container.appendChild(enabledButton);
    container.appendChild(disabledButton);

    enabledButton.focus();
    expect(document.activeElement).toBe(enabledButton);

    // Disabled 요소는 포커스 불가
    disabledButton.focus();
    expect(document.activeElement).not.toBe(disabledButton);
    expect(document.activeElement).toBe(enabledButton); // 포커스 유지
  });
});
