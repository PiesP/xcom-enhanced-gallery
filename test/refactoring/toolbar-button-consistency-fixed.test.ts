/**
 * @fileoverview 툴바 버튼 크기 일관성 테스트 (TDD 기반)
 * @description 모든 툴바 버튼이 통일된 크기를 갖도록 하는 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('툴바 버튼 크기 일관성', () => {
  let testContainer;

  beforeEach(() => {
    // 테스트 컨테이너 생성
    testContainer = globalThis.document.createElement('div');
    testContainer.id = 'test-container';
    testContainer.innerHTML = `
      <div class="xeg-toolbar">
        <button class="xeg-toolbar-button xeg-nav-button">네비게이션</button>
        <button class="xeg-toolbar-button xeg-download-button">다운로드</button>
        <button class="xeg-toolbar-button xeg-settings-button">설정</button>
        <button class="xeg-toolbar-button xeg-fit-button">맞춤보기</button>
      </div>
    `;
    globalThis.document.body.appendChild(testContainer);

    const style = globalThis.document.createElement('style');
    style.textContent = `
      .xeg-toolbar-button {
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
        padding: 8px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(16px);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      /* 현재 문제되는 fitButton 크기 (30px) */
      .xeg-fit-button {
        width: 30px;
        height: 30px;
        min-width: 30px;
        min-height: 30px;
      }
    `;
    globalThis.document.head.appendChild(style);
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      globalThis.document.body.removeChild(testContainer);
    }
    const styles = globalThis.document.querySelectorAll('style');
    styles.forEach(style => style.remove());
  });

  function getAllToolbarButtons() {
    return Array.from(testContainer?.querySelectorAll('.xeg-toolbar-button') || []);
  }

  function getButtonSize(button) {
    const computedStyle = globalThis.window.getComputedStyle(button);
    return {
      width: computedStyle.width,
      height: computedStyle.height,
    };
  }

  it('모든 툴바 버튼은 동일한 크기를 가져야 함 (40x40px)', () => {
    const buttons = getAllToolbarButtons();
    expect(buttons.length).toBeGreaterThan(0);

    const expectedSize = '40px';
    const buttonSizes = buttons.map(getButtonSize);

    // 모든 버튼이 동일한 크기여야 함
    buttonSizes.forEach((size, index) => {
      expect(size.width).toBe(expectedSize);
      expect(size.height).toBe(expectedSize);
    });
  });

  it('현재 fitButton이 다른 버튼보다 작음을 확인 (RED 단계)', () => {
    const buttons = getAllToolbarButtons();
    const fitButtons = buttons.filter(btn => btn.classList.contains('xeg-fit-button'));
    const otherButtons = buttons.filter(btn => !btn.classList.contains('xeg-fit-button'));

    expect(fitButtons.length).toBeGreaterThan(0);
    expect(otherButtons.length).toBeGreaterThan(0);

    const fitButtonSize = globalThis.window.getComputedStyle(fitButtons[0]);
    const otherButtonSize = globalThis.window.getComputedStyle(otherButtons[0]);

    // RED 단계: 현재 fitButton이 30px, 다른 버튼이 40px임을 확인
    expect(fitButtonSize.width).toBe('30px');
    expect(otherButtonSize.width).toBe('40px');
  });

  describe('반응형 디자인에서의 일관성', () => {
    it('데스크톱에서 모든 버튼이 40px이어야 함', () => {
      // 데스크톱 뷰포트 시뮬레이션
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const buttons = getAllToolbarButtons();
      buttons.forEach((button: any) => {
        const computedStyle = globalThis.window.getComputedStyle(button);
        expect(computedStyle.width).toBe('40px');
        expect(computedStyle.height).toBe('40px');
      });
    });

    it('모바일에서도 모든 버튼이 동일한 크기여야 함', () => {
      // 모바일 뷰포트 시뮬레이션
      Object.defineProperty(globalThis.window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const buttons = getAllToolbarButtons();
      // 모바일에서는 36px로 동일해야 함
      buttons.forEach((button: any) => {
        const computedStyle = globalThis.window.getComputedStyle(button);
        // 현재는 fitButton만 다르므로, 이 테스트는 실패해야 함 (RED)
        expect(computedStyle.width).toBe('36px');
        expect(computedStyle.height).toBe('36px');
      });
    });
  });
});
