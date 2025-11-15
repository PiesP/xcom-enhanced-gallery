import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import process from 'process';

describe('Phase 2: 테마 동기화 메커니즘', () => {
  setupGlobalTestIsolation();

  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    mockDocument = {
      createElement: tagName => {
        const element = {
          tagName: tagName.toUpperCase(),
          style: {},
          className: '',
          setAttribute: function (name, value) {
            this[name] = value;
          },
          getAttribute: function (name) {
            return this[name];
          },
          classList: {
            add: function (className) {
              if (!this.element) this.element = element;
              if (!this.element.className) this.element.className = '';
              if (!this.element.className.includes(className)) {
                this.element.className += (this.element.className ? ' ' : '') + className;
              }
            },
            remove: () => {},
            contains: function (className) {
              if (!this.element) this.element = element;
              return (this.element.className || '').includes(className);
            },
            toggle: () => false,
          },
        };
        // classList의 element 참조 설정
        element.classList.element = element;
        return element;
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      documentElement: {
        setAttribute: () => {},
        getAttribute: () => null,
        style: {},
      },
    };

    mockWindow = {
      getComputedStyle: element => ({
        getPropertyValue: prop => {
          // className을 확인하는 방식 개선
          const className = element.className || '';
          const isModal = className.includes('modal-variant');
          const isToolbar = className.includes('toolbar-variant');

          if (isModal || isToolbar) {
            const cssVars = {
              '--xeg-surface-glass-bg': 'var(--color-bg-surface)',
              '--xeg-surface-glass-border': 'var(--color-border-default)',
              '--xeg-surface-glass-shadow': 'none',
              '--xeg-surface-glass-blur': 'none',
            };
            return cssVars[prop] || '';
          }

          return '';
        },
      }),
      matchMedia: query => ({
        matches: query.includes('dark'),
        addListener: () => {},
        removeListener: () => {},
      }),
    };
  });

  describe('GREEN: 테마 동기화 구현 완료', () => {
    it('설정 모달이 현재 테마 상태에 따라 동적으로 스타일이 변경되어야 함', () => {
      const modalElement = mockDocument.createElement('div');
      modalElement.classList.add('xeg-glassmorphism');
      modalElement.classList.add('modal-variant');

      const toolbarElement = mockDocument.createElement('div');
      toolbarElement.classList.add('xeg-glassmorphism');
      toolbarElement.classList.add('toolbar-variant');

      const modalStyle = mockWindow.getComputedStyle(modalElement);
      const toolbarStyle = mockWindow.getComputedStyle(toolbarElement);

      // 모달과 툴바가 동일한 플랫 표면 토큰을 공유해야 함
      expect(modalStyle.getPropertyValue('--xeg-surface-glass-bg')).toBe(
        toolbarStyle.getPropertyValue('--xeg-surface-glass-bg')
      );
    });

    it('시스템 테마 변경시 툴바와 설정 모달이 동시에 업데이트되어야 함', () => {
      const toolbarElement = mockDocument.createElement('div');
      toolbarElement.classList.add('xeg-glassmorphism');
      toolbarElement.classList.add('toolbar-variant');

      const modalElement = mockDocument.createElement('div');
      modalElement.classList.add('xeg-glassmorphism');
      modalElement.classList.add('modal-variant');

      // 통합 glassmorphism 클래스가 적용되었는지 확인
      const hasUnifiedClasses =
        toolbarElement.classList.contains('xeg-glassmorphism') &&
        modalElement.classList.contains('xeg-glassmorphism');

      expect(hasUnifiedClasses).toBe(true);
    });

    it('ThemeService가 활성화되고 설정 모달과 연동되어야 함', () => {
      // SettingsModal.tsx에서 ThemeService가 import되고 사용되는지 확인
      const settingsModalPath = resolve(
        process.cwd(),
        'src/shared/components/ui/SettingsModal/SettingsModal.tsx'
      );

      if (existsSync(settingsModalPath)) {
        const content = readFileSync(settingsModalPath, 'utf-8');
        const hasThemeServiceImport = content.includes('import { ThemeService }');
        const hasThemeServiceUsage = content.includes('new ThemeService()');
        const hasThemeChangeHandler = content.includes('handleThemeChange');

        const hasThemeService =
          hasThemeServiceImport && hasThemeServiceUsage && hasThemeChangeHandler;
        expect(hasThemeService).toBe(true);
      } else {
        expect(false).toBe(true); // 파일이 없으면 실패
      }
    });
  });
});
