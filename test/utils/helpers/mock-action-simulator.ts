/**
 * Mock Action Simulator
 *
 * 디렉터리 구조 재정리로 인해 test/utils/helpers에 복구
 * DOM 이벤트 시뮬레이션 헬퍼
 */

/// <reference lib="dom" />
/* eslint-disable no-undef */

/**
 * 클릭 이벤트 시뮬레이션
 */
export function simulateClick(element: HTMLElement | Element | null): void {
  if (!element) {
    throw new Error('[simulateClick] Element is null');
  }

  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  });

  element.dispatchEvent(clickEvent);
}

/**
 * 키 입력 이벤트 시뮬레이션
 */
export function simulateKeypress(
  element: HTMLElement | Element | Document | Window | null,
  key: string,
  options?: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  }
): void {
  const target = element || document;

  const keydownEvent = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  target.dispatchEvent(keydownEvent);

  const keyupEvent = new KeyboardEvent('keyup', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });

  target.dispatchEvent(keyupEvent);
}
