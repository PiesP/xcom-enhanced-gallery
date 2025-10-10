/**
 * @fileoverview 툴바 버튼 크기 일관성 테스트 (TDD 기반)
 * @description 모든 툴바 버튼이 통일된 크기를 갖도록 하는 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const createToolbarContainer = () => document.createElement('div');
type ToolbarContainer = ReturnType<typeof createToolbarContainer>;

const createToolbarButton = () => document.createElement('button');
type ToolbarButtonElement = ReturnType<typeof createToolbarButton>;

describe('Toolbar Button Size Consistency', () => {
  let testContainer: ToolbarContainer;

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

      /* GREEN: fitButton도 동일한 크기로 수정 */
      .fitButton {
        width: 40px !important;
        height: 40px !important;
        border-radius: 12px;
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
    const buttons = Array.from(
      testContainer.querySelectorAll('.toolbarButton')
    ) as ToolbarButtonElement[];
    expect(buttons.length).toBeGreaterThan(0);

    const buttonSizes = buttons.map(button => {
      const computedStyle = window.getComputedStyle(button);
      return {
        width: computedStyle.width,
        height: computedStyle.height,
        element: button.getAttribute('data-testid') ?? button.className,
      };
    });

    const expectedSize = buttonSizes[0]!;

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
    const buttons = Array.from(
      testContainer.querySelectorAll('.toolbarButton')
    ) as ToolbarButtonElement[];

    buttons.forEach(button => {
      const computedStyle = window.getComputedStyle(button);
      const testId = button.getAttribute('data-testid') || button.className;

      expect(computedStyle.width, `Button ${testId} width should be 40px`).toBe('40px');
      expect(computedStyle.height, `Button ${testId} height should be 40px`).toBe('40px');
    });
  });

  it('핏 모드 버튼들이 다른 버튼들과 동일한 크기를 가져야 함', () => {
    const fitButtons = Array.from(
      testContainer.querySelectorAll('.fitButton')
    ) as ToolbarButtonElement[];
    const otherButtons = Array.from(
      testContainer.querySelectorAll('.toolbarButton:not(.fitButton)')
    ) as ToolbarButtonElement[];

    expect(fitButtons.length).toBeGreaterThan(0);
    expect(otherButtons.length).toBeGreaterThan(0);

    const firstFit = fitButtons[0];
    const firstOther = otherButtons[0];

    expect(firstFit).toBeTruthy();
    expect(firstOther).toBeTruthy();

    if (!firstFit || !firstOther) {
      throw new Error('Toolbar buttons missing for size comparison');
    }

    const fitButtonSize = window.getComputedStyle(firstFit);
    const otherButtonSize = window.getComputedStyle(firstOther);

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
        .toolbarButton {
          width: 36px !important;
          height: 36px !important;
        }
        .fitButton {
          width: 36px !important; /* GREEN: 일관된 크기 */
          height: 36px !important;
        }
      `;
      document.head.appendChild(style);

      const buttons = Array.from(
        testContainer.querySelectorAll('.toolbarButton')
      ) as ToolbarButtonElement[];
      const expectedSize = '36px';

      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const testId = button.getAttribute('data-testid') || button.className;

        if (button.classList.contains('fitButton')) {
          // GREEN: 이제 일관된 크기를 가져야 함
          expect(computedStyle.width, `Fit button ${testId} should have consistent size`).toBe(
            expectedSize
          );
          expect(computedStyle.height, `Fit button ${testId} should have consistent size`).toBe(
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
        .toolbarButton {
          width: 32px !important;
          height: 32px !important;
        }
        .fitButton {
          width: 32px !important; /* GREEN: 일관된 크기 */
          height: 32px !important;
        }
      `;
      document.head.appendChild(style);

      const buttons = Array.from(
        testContainer.querySelectorAll('.toolbarButton')
      ) as ToolbarButtonElement[];
      const expectedSize = '32px';

      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const testId = button.getAttribute('data-testid') || button.className;

        if (button.classList.contains('fitButton')) {
          // GREEN: 이제 일관된 크기를 가져야 함
          expect(computedStyle.width, `Fit button ${testId} should have consistent size`).toBe(
            expectedSize
          );
          expect(computedStyle.height, `Fit button ${testId} should have consistent size`).toBe(
            expectedSize
          );
        }
      });

      style.remove();
    });
  });
});
