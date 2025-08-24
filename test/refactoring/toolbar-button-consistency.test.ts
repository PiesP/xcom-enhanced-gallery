/**
 * @fileoverview 툴바 버튼 크기 일관성 테스트 (TDD 기반)
 * @description 모든 툴바 버튼이 통일된 크기를 갖도록 하는 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Toolbar Button Size Consistency', () => {
  let testContainer;

  beforeEach(() => {
    testContainer = document.createElement('div');
    testContainer.innerHTML = `
      <div class="galleryToolbar">
        <div class="toolbarContent">
          <div class="toolbarSection toolbarLeft">
            <button class="toolbarButton navButton" data-testid="nav-previous">←</button>
            <button class="toolbarButton navButton" data-testid="nav-next">→</button>
          </div>
          <div class="toolbarSection toolbarCenter">
            <span class="mediaCounter">1 / 3</span>
          </div>
          <div class="toolbarSection toolbarRight">
            <div class="fitModeGroup">
              <button class="toolbarButton fitButton" data-testid="fit-original">⌘</button>
              <button class="toolbarButton fitButton" data-testid="fit-width">↔</button>
              <button class="toolbarButton fitButton" data-testid="fit-height">↕</button>
              <button class="toolbarButton fitButton" data-testid="fit-container">⛶</button>
            </div>
            <button class="toolbarButton downloadButton downloadCurrent" data-testid="download-current">⬇</button>
            <button class="toolbarButton downloadButton downloadAll" data-testid="download-all">📦</button>
            <button class="toolbarButton settingsButton" data-testid="settings">⚙</button>
            <button class="toolbarButton closeButton" data-testid="close">✕</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(testContainer);

    // CSS 모듈 스타일 시뮬레이션
    const style = document.createElement('style');
    style.textContent = `
      .toolbarButton {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* 현재 문제가 있는 fitButton 스타일 */
      .fitButton {
        width: 30px;
        height: 30px;
        border-radius: 6px;
      }

      .navButton, .downloadButton, .settingsButton, .closeButton {
        /* toolbarButton 기본 스타일 상속 */
      }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    document.body.removeChild(testContainer);
    const styles = document.querySelectorAll('style');
    styles.forEach(style => {
      if (style.textContent?.includes('toolbarButton')) {
        style.remove();
      }
    });
  });

  it('모든 툴바 버튼이 동일한 크기를 가져야 함', () => {
    const buttons = testContainer.querySelectorAll('.toolbarButton');
    expect(buttons.length).toBeGreaterThan(0);

    const buttonSizes = Array.from(buttons).map(button => {
      const computedStyle = window.getComputedStyle(button);
      return {
        width: computedStyle.width,
        height: computedStyle.height,
        element: button.getAttribute('data-testid') || button.className,
      };
    });

    // 기준 크기 (첫 번째 네비게이션 버튼)
    const expectedSize = buttonSizes[0];
    console.log('Expected size:', expectedSize);
    console.log('All button sizes:', buttonSizes);

    // 모든 버튼이 동일한 크기를 가져야 함
    buttonSizes.forEach(({ width, height, element }, index) => {
      expect(
        width,
        `Button ${element} (index: ${index}) width should be ${expectedSize.width} but got ${width}`
      ).toBe(expectedSize.width);
      expect(
        height,
        `Button ${element} (index: ${index}) height should be ${expectedSize.height} but got ${height}`
      ).toBe(expectedSize.height);
    });
  });

  it('데스크탑에서 모든 버튼이 40px 크기를 가져야 함', () => {
    const buttons = testContainer.querySelectorAll('.toolbarButton');

    buttons.forEach(button => {
      const computedStyle = window.getComputedStyle(button);
      const testId = button.getAttribute('data-testid') || button.className;

      expect(computedStyle.width, `Button ${testId} width should be 40px`).toBe('40px');
      expect(computedStyle.height, `Button ${testId} height should be 40px`).toBe('40px');
    });
  });

  it('핏 모드 버튼들이 다른 버튼들과 동일한 크기를 가져야 함', () => {
    const fitButtons = testContainer.querySelectorAll('.fitButton');
    const otherButtons = testContainer.querySelectorAll('.toolbarButton:not(.fitButton)');

    expect(fitButtons.length).toBeGreaterThan(0);
    expect(otherButtons.length).toBeGreaterThan(0);

    const fitButtonSize = window.getComputedStyle(fitButtons[0]);
    const otherButtonSize = window.getComputedStyle(otherButtons[0]);

    expect(fitButtonSize.width, 'Fit buttons width should match other buttons').toBe(
      otherButtonSize.width
    );
    expect(fitButtonSize.height, 'Fit buttons height should match other buttons').toBe(
      otherButtonSize.height
    );
  });

  describe('반응형 크기 일관성', () => {
    it('태블릿 크기에서 모든 버튼이 36px를 가져야 함', () => {
      // 태블릿 뷰포트 시뮬레이션
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 768px) {
          .toolbarButton {
            min-width: 36px;
            min-height: 36px;
          }
          .fitButton {
            min-width: 32px; /* 문제: 다른 크기 */
            min-height: 32px;
          }
        }
      `;
      document.head.appendChild(style);

      const buttons = testContainer.querySelectorAll('.toolbarButton');
      const expectedSize = '36px';

      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const testId = button.getAttribute('data-testid') || button.className;

        if (button.classList.contains('fitButton')) {
          // 현재는 실패할 것으로 예상 - RED 단계
          expect(computedStyle.minWidth, `Fit button ${testId} should have consistent size`).toBe(
            expectedSize
          );
          expect(computedStyle.minHeight, `Fit button ${testId} should have consistent size`).toBe(
            expectedSize
          );
        }
      });

      style.remove();
    });

    it('모바일 크기에서 모든 버튼이 32px를 가져야 함', () => {
      // 모바일 뷰포트 시뮬레이션
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 480px) {
          .toolbarButton {
            min-width: 32px;
            min-height: 32px;
          }
          .fitButton {
            min-width: 28px; /* 문제: 다른 크기 */
            min-height: 28px;
          }
        }
      `;
      document.head.appendChild(style);

      const buttons = testContainer.querySelectorAll('.toolbarButton');
      const expectedSize = '32px';

      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const testId = button.getAttribute('data-testid') || button.className;

        if (button.classList.contains('fitButton')) {
          // 현재는 실패할 것으로 예상 - RED 단계
          expect(computedStyle.minWidth, `Fit button ${testId} should have consistent size`).toBe(
            expectedSize
          );
          expect(computedStyle.minHeight, `Fit button ${testId} should have consistent size`).toBe(
            expectedSize
          );
        }
      });

      style.remove();
    });
  });
});
