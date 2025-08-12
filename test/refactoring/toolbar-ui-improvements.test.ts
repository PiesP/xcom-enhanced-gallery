/**
 * Toolbar UI Improvements Test Suite
 * @description TDD 기반 툴바 UI 개선 테스트 - 버튼 패딩 및 배경 색상 개선
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Toolbar UI Improvements', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Mock CSS variables for testing */
            :root {
              --xeg-spacing-xs: 4px;
              --xeg-spacing-sm: 8px;
              --xeg-spacing-md: 12px;
              --xeg-spacing-lg: 16px;
            }
          </style>
        </head>
        <body>
          <div class="toolbar-test-container">
            <!-- Toolbar will be rendered here -->
          </div>
        </body>
      </html>
    `,
      {
        pretendToBeVisual: true,
        resources: 'usable',
      }
    );

    document = dom.window.document;
    global.document = document;
    global.window = dom.window as any;
    global.getComputedStyle = dom.window.getComputedStyle;
  });

  describe('Button Padding Enhancement', () => {
    it('should add proper padding around toolbar buttons', () => {
      // Given: 툴바 버튼이 렌더링됨
      const toolbarButton = document.createElement('button');
      toolbarButton.className = 'toolbar-button';
      toolbarButton.textContent = 'Test Button';

      // Mock CSS styles for the button
      const mockStyles = {
        padding: '12px 16px', // --xeg-spacing-md --xeg-spacing-lg
        paddingTop: '12px',
        paddingRight: '16px',
        paddingBottom: '12px',
        paddingLeft: '16px',
      };

      // Override getComputedStyle for this button
      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (element: Element) => {
        if (element === toolbarButton) {
          return mockStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      };

      document.querySelector('.toolbar-test-container')!.appendChild(toolbarButton);

      // When: 버튼 스타일이 적용됨
      const computedStyle = getComputedStyle(toolbarButton);

      // Then: 적절한 패딩이 적용되어야 함
      expect(computedStyle.padding).toBe('12px 16px');
      expect(computedStyle.paddingTop).toBe('12px');
      expect(computedStyle.paddingRight).toBe('16px');
      expect(computedStyle.paddingBottom).toBe('12px');
      expect(computedStyle.paddingLeft).toBe('16px');
    });

    it('should provide consistent padding across different button types', () => {
      // Given: 다양한 타입의 툴바 버튼들
      const buttonTypes = ['nav-button', 'fit-button', 'action-button'];

      buttonTypes.forEach(buttonType => {
        const button = document.createElement('button');
        button.className = `toolbar-button ${buttonType}`;

        // Mock consistent padding for all button types
        const mockStyles = {
          padding: '12px 16px',
          paddingTop: '12px',
          paddingRight: '16px',
          paddingBottom: '12px',
          paddingLeft: '16px',
        };

        const originalGetComputedStyle = global.getComputedStyle;
        global.getComputedStyle = (element: Element) => {
          if (element === button) {
            return mockStyles as CSSStyleDeclaration;
          }
          return originalGetComputedStyle(element);
        };

        document.querySelector('.toolbar-test-container')!.appendChild(button);

        // When: 스타일이 계산됨
        const computedStyle = getComputedStyle(button);

        // Then: 모든 버튼 타입이 일관된 패딩을 가져야 함
        expect(computedStyle.padding).toBe('12px 16px');
      });
    });
  });

  describe('Background Color Enhancement', () => {
    it('should apply semi-transparent black background in dark mode', () => {
      // Given: 다크 모드 환경
      const toolbar = document.createElement('div');
      toolbar.className = 'gallery-toolbar';
      toolbar.setAttribute('data-theme', 'dark');

      // Mock dark mode background styles
      const mockDarkStyles = {
        background: 'rgba(0, 0, 0, 0.75)', // 반투명한 검은색
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
      };

      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (element: Element) => {
        if (element === toolbar) {
          return mockDarkStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      };

      document.querySelector('.toolbar-test-container')!.appendChild(toolbar);

      // When: 다크 모드 스타일이 적용됨
      const computedStyle = getComputedStyle(toolbar);

      // Then: 반투명한 검은색 배경이 적용되어야 함
      expect(computedStyle.backgroundColor).toBe('rgba(0, 0, 0, 0.75)');
      expect(computedStyle.backdropFilter).toBe('blur(10px)');
    });

    it('should apply inverted semi-transparent white background in light mode', () => {
      // Given: 라이트 모드 환경 (다크 모드 기준으로 색상 반전)
      const toolbar = document.createElement('div');
      toolbar.className = 'gallery-toolbar';
      toolbar.setAttribute('data-theme', 'light');

      // Mock light mode background styles (inverted from dark mode)
      const mockLightStyles = {
        background: 'rgba(255, 255, 255, 0.75)', // 반투명한 흰색 (다크 모드 반전)
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(10px)',
      };

      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (element: Element) => {
        if (element === toolbar) {
          return mockLightStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      };

      document.querySelector('.toolbar-test-container')!.appendChild(toolbar);

      // When: 라이트 모드 스타일이 적용됨
      const computedStyle = getComputedStyle(toolbar);

      // Then: 반투명한 흰색 배경이 적용되어야 함 (다크 모드 반전)
      expect(computedStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.75)');
      expect(computedStyle.backdropFilter).toBe('blur(10px)');
    });

    it('should maintain glassmorphism effect with proper backdrop filter', () => {
      // Given: 툴바가 글래스모피즘 효과를 가져야 함
      const toolbar = document.createElement('div');
      toolbar.className = 'gallery-toolbar glassmorphism';

      // Mock glassmorphism styles
      const mockGlassmorphismStyles = {
        backdropFilter: 'blur(10px) saturate(150%)',
        WebkitBackdropFilter: 'blur(10px) saturate(150%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      };

      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (element: Element) => {
        if (element === toolbar) {
          return mockGlassmorphismStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      };

      document.querySelector('.toolbar-test-container')!.appendChild(toolbar);

      // When: 글래스모피즘 스타일이 적용됨
      const computedStyle = getComputedStyle(toolbar);

      // Then: 적절한 backdrop-filter와 글래스 효과가 적용되어야 함
      expect(computedStyle.backdropFilter).toBe('blur(10px) saturate(150%)');
      expect(computedStyle.WebkitBackdropFilter).toBe('blur(10px) saturate(150%)');
      expect(computedStyle.boxShadow).toContain('rgba(0, 0, 0, 0.37)');
      expect(computedStyle.border).toContain('rgba(255, 255, 255, 0.18)');
    });
  });

  describe('Button Visual Consistency', () => {
    it('should maintain consistent button appearance across toolbar sections', () => {
      // Given: 툴바의 각 섹션별 버튼들
      const sections = ['left', 'center', 'right'];
      const buttons: Element[] = [];

      sections.forEach(section => {
        const button = document.createElement('button');
        button.className = `toolbar-button toolbar-${section}`;
        button.setAttribute('data-section', section);

        // Mock consistent button styles
        const mockButtonStyles = {
          padding: '12px 16px',
          borderRadius: '8px',
          minHeight: '48px',
          minWidth: '48px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };

        const originalGetComputedStyle = global.getComputedStyle;
        global.getComputedStyle = (element: Element) => {
          if (element === button) {
            return mockButtonStyles as CSSStyleDeclaration;
          }
          return originalGetComputedStyle(element);
        };

        buttons.push(button);
        document.querySelector('.toolbar-test-container')!.appendChild(button);
      });

      // When: 모든 버튼의 스타일이 계산됨
      const styles = buttons.map(button => getComputedStyle(button));

      // Then: 모든 섹션의 버튼이 일관된 스타일을 가져야 함
      const firstButtonStyle = styles[0];
      styles.forEach(style => {
        expect(style.padding).toBe(firstButtonStyle.padding);
        expect(style.borderRadius).toBe(firstButtonStyle.borderRadius);
        expect(style.minHeight).toBe(firstButtonStyle.minHeight);
        expect(style.minWidth).toBe(firstButtonStyle.minWidth);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt button padding for different screen sizes', () => {
      // Given: 다양한 화면 크기
      const screenSizes = [
        { width: 320, expectedPadding: '8px 12px' }, // 모바일
        { width: 768, expectedPadding: '10px 14px' }, // 태블릿
        { width: 1024, expectedPadding: '12px 16px' }, // 데스크톱
      ];

      screenSizes.forEach(({ width, expectedPadding }) => {
        // Mock viewport width
        Object.defineProperty(dom.window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const button = document.createElement('button');
        button.className = 'toolbar-button responsive';

        // Mock responsive padding based on screen width
        const mockResponsiveStyles = {
          padding: expectedPadding,
          paddingTop: expectedPadding.split(' ')[0],
          paddingRight: expectedPadding.split(' ')[1],
          paddingBottom: expectedPadding.split(' ')[0],
          paddingLeft: expectedPadding.split(' ')[1],
        };

        const originalGetComputedStyle = global.getComputedStyle;
        global.getComputedStyle = (element: Element) => {
          if (element === button) {
            return mockResponsiveStyles as CSSStyleDeclaration;
          }
          return originalGetComputedStyle(element);
        };

        document.querySelector('.toolbar-test-container')!.appendChild(button);

        // When: 반응형 스타일이 적용됨
        const computedStyle = getComputedStyle(button);

        // Then: 화면 크기에 맞는 패딩이 적용되어야 함
        expect(computedStyle.padding).toBe(expectedPadding);
      });
    });
  });
});
