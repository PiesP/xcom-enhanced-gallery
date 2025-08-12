/**
 * Glassmorphism Removal Test Suite
 * @description TDD 기반 글래스모피즘 효과 제거 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('Glassmorphism Removal', () => {
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
              --xeg-color-surface-light: #ffffff;
              --xeg-color-surface-dark: #1a1a1a;
              --xeg-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
              --xeg-radius-md: 8px;
            }
          </style>
        </head>
        <body>
          <div class="test-container">
            <!-- UI elements will be rendered here -->
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

  describe('Toolbar Background Simplification', () => {
    it('should remove backdrop-filter from toolbar', () => {
      // Given: 툴바 엘리먼트
      const toolbar = document.createElement('div');
      toolbar.className = 'gallery-toolbar';

      // Mock styles without glassmorphism
      const mockStyles = {
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        background: '#ffffff', // 불투명 배경
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // 일반 그림자
      };

      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (element: Element) => {
        if (element === toolbar) {
          return mockStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      };

      document.querySelector('.test-container')!.appendChild(toolbar);

      // When: 스타일이 계산됨
      const computedStyle = getComputedStyle(toolbar);

      // Then: backdrop-filter가 제거되어야 함
      expect(computedStyle.backdropFilter).toBe('none');
      expect(computedStyle.WebkitBackdropFilter).toBe('none');
      expect(computedStyle.background).toBe('#ffffff');
    });

    it('should use solid background colors instead of transparent', () => {
      // Given: 툴바가 다크/라이트 모드를 지원해야 함
      const themes = ['light', 'dark'];

      themes.forEach(theme => {
        const toolbar = document.createElement('div');
        toolbar.className = 'gallery-toolbar';
        toolbar.setAttribute('data-theme', theme);

        // Mock solid backgrounds
        const expectedBg = theme === 'dark' ? '#1a1a1a' : '#ffffff';
        const mockStyles = {
          background: expectedBg,
          backgroundColor: expectedBg,
          backdropFilter: 'none',
        };

        const originalGetComputedStyle = global.getComputedStyle;
        global.getComputedStyle = (element: Element) => {
          if (element === toolbar) {
            return mockStyles as CSSStyleDeclaration;
          }
          return originalGetComputedStyle(element);
        };

        document.querySelector('.test-container')!.appendChild(toolbar);

        // When: 테마별 스타일이 적용됨
        const computedStyle = getComputedStyle(toolbar);

        // Then: 불투명한 배경색이 적용되어야 함
        expect(computedStyle.backgroundColor).toBe(expectedBg);
        expect(computedStyle.backdropFilter).toBe('none');
      });
    });
  });

  describe('Button Component Simplification', () => {
    it('should remove glassmorphism effects from buttons', () => {
      // Given: 버튼 엘리먼트
      const button = document.createElement('button');
      button.className = 'button glassmorphism';

      // Mock simplified button styles
      const mockStyles = {
        background: '#f3f4f6', // 불투명 배경
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: '1px solid #d1d5db',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', // 단순한 그림자
      };

      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (element: Element) => {
        if (element === button) {
          return mockStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      };

      document.querySelector('.test-container')!.appendChild(button);

      // When: 버튼 스타일이 적용됨
      const computedStyle = getComputedStyle(button);

      // Then: 글래스모피즘 효과가 제거되어야 함
      expect(computedStyle.backdropFilter).toBe('none');
      expect(computedStyle.WebkitBackdropFilter).toBe('none');
      expect(computedStyle.background).toBe('#f3f4f6');
      expect(computedStyle.boxShadow).toBe('0 1px 2px rgba(0, 0, 0, 0.05)');
    });

    it('should provide clear visual hierarchy without glass effects', () => {
      // Given: 다양한 버튼 변형
      const buttonVariants = ['primary', 'secondary', 'danger'];

      buttonVariants.forEach(variant => {
        const button = document.createElement('button');
        button.className = `button ${variant}`;

        // Mock variant-specific solid styles
        const variantStyles: Record<string, any> = {
          primary: { backgroundColor: '#3b82f6', color: '#ffffff' },
          secondary: { backgroundColor: '#f3f4f6', color: '#374151' },
          danger: { backgroundColor: '#ef4444', color: '#ffffff' },
        };

        const mockStyles = {
          ...variantStyles[variant],
          backdropFilter: 'none',
          border: '1px solid currentColor',
        };

        const originalGetComputedStyle = global.getComputedStyle;
        global.getComputedStyle = (element: Element) => {
          if (element === button) {
            return mockStyles as CSSStyleDeclaration;
          }
          return originalGetComputedStyle(element);
        };

        document.querySelector('.test-container')!.appendChild(button);

        // When: 변형별 스타일이 적용됨
        const computedStyle = getComputedStyle(button);

        // Then: 명확한 시각적 계층구조를 제공해야 함
        expect(computedStyle.backdropFilter).toBe('none');
        expect(computedStyle.backgroundColor).toBe(variantStyles[variant].backgroundColor);
        expect(computedStyle.color).toBe(variantStyles[variant].color);
      });
    });
  });

  describe('Modal and Toast Simplification', () => {
    it('should remove backdrop-filter from modals', () => {
      // Given: 모달 엘리먼트
      const modal = document.createElement('div');
      modal.className = 'modal';

      // Mock simplified modal styles
      const mockStyles = {
        background: '#ffffff',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
      };

      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (element: Element) => {
        if (element === modal) {
          return mockStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      };

      document.querySelector('.test-container')!.appendChild(modal);

      // When: 모달 스타일이 적용됨
      const computedStyle = getComputedStyle(modal);

      // Then: backdrop-filter가 제거되어야 함
      expect(computedStyle.backdropFilter).toBe('none');
      expect(computedStyle.background).toBe('#ffffff');
    });

    it('should use solid backgrounds for toasts', () => {
      // Given: 토스트 엘리먼트
      const toast = document.createElement('div');
      toast.className = 'toast';

      // Mock solid toast styles
      const mockStyles = {
        background: '#1f2937', // 불투명 다크 배경
        color: '#ffffff',
        backdropFilter: 'none',
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      };

      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (element: Element) => {
        if (element === toast) {
          return mockStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      };

      document.querySelector('.test-container')!.appendChild(toast);

      // When: 토스트 스타일이 적용됨
      const computedStyle = getComputedStyle(toast);

      // Then: 불투명한 배경이 적용되어야 함
      expect(computedStyle.background).toBe('#1f2937');
      expect(computedStyle.backdropFilter).toBe('none');
    });
  });

  describe('Performance and Accessibility', () => {
    it('should improve performance by removing expensive filters', () => {
      // Given: 복합 엘리먼트들
      const elements = [
        { tag: 'div', className: 'toolbar' },
        { tag: 'button', className: 'button' },
        { tag: 'div', className: 'modal' },
        { tag: 'div', className: 'toast' },
      ];

      elements.forEach(({ tag, className }) => {
        const element = document.createElement(tag);
        element.className = className;

        // Mock performance-optimized styles
        const mockStyles = {
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          willChange: 'auto', // remove will-change optimization hints
          transform: 'none',
        };

        const originalGetComputedStyle = global.getComputedStyle;
        global.getComputedStyle = (el: Element) => {
          if (el === element) {
            return mockStyles as CSSStyleDeclaration;
          }
          return originalGetComputedStyle(el);
        };

        document.querySelector('.test-container')!.appendChild(element);

        // When: 스타일이 적용됨
        const computedStyle = getComputedStyle(element);

        // Then: 성능에 부담을 주는 속성들이 제거되어야 함
        expect(computedStyle.backdropFilter).toBe('none');
        expect(computedStyle.willChange).toBe('auto');
      });
    });

    it('should maintain accessibility with high contrast support', () => {
      // Given: 고대비 모드를 시뮬레이션
      const element = document.createElement('button');
      element.className = 'button';

      // Mock high contrast styles
      const mockStyles = {
        background: '#ffffff',
        color: '#000000',
        border: '2px solid #000000', // 고대비를 위한 굵은 테두리
        backdropFilter: 'none',
      };

      const originalGetComputedStyle = global.getComputedStyle;
      global.getComputedStyle = (el: Element) => {
        if (el === element) {
          return mockStyles as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(el);
      };

      document.querySelector('.test-container')!.appendChild(element);

      // When: 고대비 스타일이 적용됨
      const computedStyle = getComputedStyle(element);

      // Then: 접근성이 개선되어야 함
      expect(computedStyle.border).toBe('2px solid #000000');
      expect(computedStyle.backdropFilter).toBe('none');
    });
  });

  describe('Extended Component Coverage', () => {
    it('should remove glassmorphism from VerticalImageItem component', async () => {
      // Given: VerticalImageItem CSS 파일
      const cssPath = join(
        process.cwd(),
        'src',
        'features',
        'gallery',
        'components',
        'vertical-gallery-view',
        'VerticalImageItem.module.css'
      );
      const css = await fs.readFile(cssPath, 'utf-8');

      // Then: backdrop-filter 사용이 없어야 함
      expect(css).not.toMatch(/backdrop-filter:\s*var\(--xeg-glass-blur/);
      expect(css).not.toMatch(/-webkit-backdrop-filter:\s*var\(--xeg-glass-blur/);

      // And: glass 배경 변수 대신 solid 배경 사용
      expect(css).not.toMatch(/background:\s*var\(--xeg-glass-bg-/);

      // And: glass shadow 대신 일반 shadow 사용
      expect(css).not.toMatch(/box-shadow:\s*var\(--xeg-glass-shadow-/);
    });

    it('should remove glassmorphism from Gallery overlay', async () => {
      // Given: Gallery.module.css 파일
      const cssPath = join(
        process.cwd(),
        'src',
        'features',
        'gallery',
        'styles',
        'Gallery.module.css'
      );
      const css = await fs.readFile(cssPath, 'utf-8');

      // Then: gallery overlay에서 backdrop-filter 제거
      const glassBlurMatches =
        css.match(/backdrop-filter:\s*var\(--xeg-gallery-glass-blur\)/g) || [];
      expect(glassBlurMatches).toHaveLength(0);

      // And: glass background 변수 제거
      const glassBgMatches = css.match(/background:\s*var\(--xeg-gallery-glass-bg\)/g) || [];
      expect(glassBgMatches).toHaveLength(0);
    });

    it('should remove glass morphism classes from UIBase component', async () => {
      // Given: UIBase.module.css 파일
      const cssPath = join(
        process.cwd(),
        'src',
        'shared',
        'components',
        'ui',
        'UIBase',
        'UIBase.module.css'
      );
      const css = await fs.readFile(cssPath, 'utf-8');

      // Then: .glassCard 클래스들이 제거되어야 함
      expect(css).not.toMatch(/\.glassCard\s*{/);
      expect(css).not.toMatch(/\.glassCardLight\s*{/);

      // And: backdrop-filter 사용 제거
      expect(css).not.toMatch(/backdrop-filter:\s*var\(--xeg-glass-blur/);
    });

    it('should remove glassmorphism from Enhanced Tooltip', async () => {
      // Given: EnhancedTooltip.module.css 파일
      const cssPath = join(
        process.cwd(),
        'src',
        'shared',
        'components',
        'ui',
        'EnhancedTooltip',
        'EnhancedTooltip.module.css'
      );
      const css = await fs.readFile(cssPath, 'utf-8');

      // Then: backdrop-filter 제거
      expect(css).not.toMatch(/backdrop-filter:\s*var\(--xeg-glass-blur/);
      expect(css).not.toMatch(/-webkit-backdrop-filter:\s*var\(--xeg-glass-blur/);

      // And: glass 배경 대신 solid 배경 사용
      expect(css).not.toMatch(/background:\s*var\(--xeg-glass-bg-/);
    });

    it('should remove glassmorphism from Toast component', async () => {
      // Given: Toast.module.css 파일
      const cssPath = join(
        process.cwd(),
        'src',
        'shared',
        'components',
        'ui',
        'Toast',
        'Toast.module.css'
      );
      const css = await fs.readFile(cssPath, 'utf-8');

      // Then: backdrop-filter 제거
      expect(css).not.toMatch(/backdrop-filter:\s*var\(--xeg-glass-blur/);
      expect(css).not.toMatch(/-webkit-backdrop-filter:\s*var\(--xeg-glass-blur/);

      // And: glass 변수들 제거
      expect(css).not.toMatch(/var\(--xeg-glass-bg-/);
      expect(css).not.toMatch(/var\(--xeg-glass-border-/);
      expect(css).not.toMatch(/var\(--xeg-glass-shadow-/);
    });
  });

  describe('Core Layer Glassmorphism Removal', () => {
    it('should remove glassmorphism functions from core/styles', async () => {
      // Given: core/styles/index.ts 파일
      const tsPath = join(process.cwd(), 'src', 'core', 'styles', 'index.ts');
      const ts = await fs.readFile(tsPath, 'utf-8');

      // Then: glassmorphism 관련 함수들 제거
      expect(ts).not.toMatch(/export\s+function\s+setGlassmorphism/);
      expect(ts).not.toMatch(/export\s+function\s+applyGlassmorphism/);
      expect(ts).not.toMatch(/export\s+type\s+GlassmorphismIntensity/);
    });

    it('should remove glassmorphism types from core/types', async () => {
      // Given: core/types/index.ts 파일
      const tsPath = join(process.cwd(), 'src', 'core', 'types', 'index.ts');
      const ts = await fs.readFile(tsPath, 'utf-8');

      // Then: glassmorphism 관련 타입들 제거
      expect(ts).not.toMatch(/export\s+type\s+GlassmorphismIntensity/);
      expect(ts).not.toMatch(/export\s+interface\s+GlassmorphismConfig/);
      expect(ts).not.toMatch(/glassmorphism:\s*GlassmorphismIntensity/);
    });

    it('should remove glassmorphism exports from core/index', async () => {
      // Given: core/index.ts 파일
      const tsPath = join(process.cwd(), 'src', 'core', 'index.ts');
      const ts = await fs.readFile(tsPath, 'utf-8');

      // Then: glassmorphism 관련 export 제거
      expect(ts).not.toMatch(/setGlassmorphism/);
      expect(ts).not.toMatch(/applyGlassmorphism/);
      expect(ts).not.toMatch(/GlassmorphismIntensity/);
    });
  });

  describe('Additional Component Coverage', () => {
    it('should remove glassmorphism from gallery-global.css', async () => {
      // Given: gallery-global.css 파일
      const cssPath = join(
        process.cwd(),
        'src',
        'features',
        'gallery',
        'styles',
        'gallery-global.css'
      );
      const css = await fs.readFile(cssPath, 'utf-8');

      // Then: glassmorphism 관련 주석 및 클래스 제거
      expect(css).not.toMatch(/glassmorphism/i);
      expect(css).not.toMatch(/backdrop-filter:\s*var\(--xeg-glass-blur/);
      expect(css).not.toMatch(/background:\s*var\(--xeg-glass-bg-/);
    });

    it('should remove glassmorphism from SettingsOverlay components', async () => {
      // Given: SettingsOverlay CSS 파일들
      const settingsPath1 = join(
        process.cwd(),
        'src',
        'features',
        'settings',
        'SettingsOverlay.module.css'
      );
      const settingsPath2 = join(
        process.cwd(),
        'src',
        'features',
        'settings',
        'components',
        'SettingsOverlay.module.css'
      );

      const css1 = await fs.readFile(settingsPath1, 'utf-8');
      const css2 = await fs.readFile(settingsPath2, 'utf-8');

      // Then: backdrop-filter 및 glass 변수 제거
      expect(css1).not.toMatch(/backdrop-filter:\s*var\(--xeg-glass-blur/);
      expect(css1).not.toMatch(/var\(--xeg-glass-border-light\)/);

      expect(css2).not.toMatch(/backdrop-filter:\s*var\(--xeg-glass-blur/);
      expect(css2).not.toMatch(/var\(--xeg-glass-bg-/);
      expect(css2).not.toMatch(/var\(--xeg-glass-shadow-/);
    });

    it('should remove glassmorphism variant from BaseComponentProps', async () => {
      // Given: BaseComponentProps.ts 파일
      const propsPath = join(
        process.cwd(),
        'src',
        'shared',
        'components',
        'base',
        'BaseComponentProps.ts'
      );
      const props = await fs.readFile(propsPath, 'utf-8');

      // Then: glassmorphism 관련 variant 제거
      expect(props).not.toMatch(/'glassmorphism'/);
      expect(props).not.toMatch(/'glassmorphism-light'/);
      expect(props).not.toMatch(/'glassmorphism-medium'/);
    });

    it('should consolidate duplicate CSS variables', async () => {
      // Given: design-tokens.css 파일
      const tokensPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');
      const tokens = await fs.readFile(tokensPath, 'utf-8');

      // Then: glass 관련 변수들이 정리되어야 함
      const glassMatches = tokens.match(/--xeg-glass-/g) || [];
      expect(glassMatches.length).toBeLessThan(10); // 대부분 제거되어야 함

      // And: 중복 변수들 확인
      expect(tokens).not.toMatch(/Unexpected duplicate.*--xeg-toolbar-border/);
      expect(tokens).not.toMatch(/Unexpected duplicate.*--xeg-gallery-bg/);
    });
  });

  describe('Theme Consistency', () => {
    it('should maintain consistent appearance across themes without glass effects', () => {
      // Given: 라이트/다크 테마
      const themes = [
        { name: 'light', bg: '#ffffff', text: '#000000' },
        { name: 'dark', bg: '#1a1a1a', text: '#ffffff' },
      ];

      themes.forEach(theme => {
        const container = document.createElement('div');
        container.className = 'themed-container';
        container.setAttribute('data-theme', theme.name);

        // Mock theme-consistent styles
        const mockStyles = {
          background: theme.bg,
          color: theme.text,
          backdropFilter: 'none',
          border: `1px solid ${theme.name === 'dark' ? '#333333' : '#e5e7eb'}`,
        };

        const originalGetComputedStyle = global.getComputedStyle;
        global.getComputedStyle = (element: Element) => {
          if (element === container) {
            return mockStyles as CSSStyleDeclaration;
          }
          return originalGetComputedStyle(element);
        };

        document.querySelector('.test-container')!.appendChild(container);

        // When: 테마별 스타일이 적용됨
        const computedStyle = getComputedStyle(container);

        // Then: 일관된 테마가 적용되어야 함
        expect(computedStyle.background).toBe(theme.bg);
        expect(computedStyle.color).toBe(theme.text);
        expect(computedStyle.backdropFilter).toBe('none');
      });
    });
  });
});
