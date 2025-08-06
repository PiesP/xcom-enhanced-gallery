/**
 * @fileoverview InteractionService 디버깅 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionService } from '../src/shared/utils/interaction/interaction-manager';

describe('InteractionService 디버깅', () => {
  let testElement: HTMLElement;
  let interactionService: InteractionService;

  beforeEach(() => {
    vi.useFakeTimers();
    testElement = document.createElement('div');
    document.body.appendChild(testElement);
    interactionService = new InteractionService(testElement);
  });

  afterEach(() => {
    vi.clearAllTimers();
    document.body.innerHTML = '';
  });

  it('기본 클릭 이벤트가 제대로 작동하는지 확인', () => {
    const clickHandler = vi.fn();
    interactionService.onGesture('click', clickHandler);

    // InteractionService의 private 메서드에 직접 접근할 수 없으므로
    // 우회적으로 이벤트 처리를 테스트

    // 첫 번째: 이벤트 리스너 접근 가능성 확인
    const privateService = interactionService as any;

    // mousedown과 mouseup을 직접 시뮬레이션
    const mouseDownEvent = new MouseEvent('mousedown', {
      button: 0,
      bubbles: true,
      clientX: 100,
      clientY: 200,
    });
    const mouseUpEvent = new MouseEvent('mouseup', {
      button: 0,
      bubbles: true,
      clientX: 100,
      clientY: 200,
    });

    // private 메서드를 직접 호출
    privateService.handleMouseDown(mouseDownEvent);
    privateService.handleMouseUp(mouseUpEvent);

    // 핸들러가 호출되었는지 확인
    expect(clickHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'click',
        x: 100,
        y: 200,
        button: 0,
      })
    );
  });

  it('키보드 이벤트가 제대로 작동하는지 확인', () => {
    const shortcutHandler = vi.fn();

    interactionService.addKeyboardShortcut({
      key: 'Escape',
      callback: shortcutHandler,
    });

    const keyEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      ctrlKey: false,
      bubbles: true,
    });

    testElement.dispatchEvent(keyEvent);

    expect(shortcutHandler).toHaveBeenCalledWith(keyEvent);
  });
});
