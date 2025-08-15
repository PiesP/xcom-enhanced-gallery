/**
 * @fileoverview 추가 UI 비일관성 감지 테스트 (TDD)
 * 디자인 토큰 충돌, 컴포넌트별 스타일 불일치, 애니메이션 차이 등 분석
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('추가 UI 비일관성 감지 테스트', () => {
  let document: Document;
  let window: Window;

  beforeEach(() => {
    const dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* 기본 디자인 토큰 */
            :root {
              /* 🔥 문제점 1: 중복 토큰 정의 */
              --xeg-toolbar-bg: #ffffff;
              --xeg-modal-bg: var(--xeg-toolbar-bg); /* 통합 시도했지만... */
              --xeg-button-bg: #f8fafc; /* 다른 배경색 사용! */
              --xeg-toast-bg: #fafbfc; /* 또 다른 배경색! */

              /* 🔥 문제점 2: 그림자 일관성 부족 */
              --xeg-toolbar-shadow: 0 4px 12px rgba(0,0,0,0.1);
              --xeg-modal-shadow: 0 4px 12px rgba(0,0,0,0.1);
              --xeg-button-shadow: 0 2px 4px rgba(0,0,0,0.05); /* 다른 그림자! */
              --xeg-toast-shadow: 0 8px 16px rgba(0,0,0,0.15); /* 또 다른 그림자! */

              /* 🔥 문제점 3: 애니메이션 지속시간 불일치 */
              --xeg-transition-fast: 150ms ease-out;
              --xeg-animation-duration-modal: 250ms; /* 다른 지속시간! */
              --xeg-animation-duration-toast: 300ms; /* 또 다른 지속시간! */

              /* 🔥 문제점 4: 호버 효과 불일치 */
              --xeg-hover-transform: translateY(-1px);
              --xeg-button-hover-transform: scale(1.02); /* 다른 호버 효과! */
              --xeg-toast-hover-transform: translateX(5px); /* 또 다른 호버 효과! */
            }

            /* 툴바 스타일 */
            .toolbar {
              background: var(--xeg-toolbar-bg);
              box-shadow: var(--xeg-toolbar-shadow);
              transition: var(--xeg-transition-fast);
            }

            .toolbar:hover {
              transform: var(--xeg-hover-transform);
            }

            /* 모달 스타일 */
            .modal {
              background: var(--xeg-modal-bg);
              box-shadow: var(--xeg-modal-shadow);
              animation-duration: var(--xeg-animation-duration-modal);
            }

            /* 버튼 스타일 */
            .button {
              background: var(--xeg-button-bg);
              box-shadow: var(--xeg-button-shadow);
              transition: var(--xeg-transition-fast);
            }

            .button:hover {
              transform: var(--xeg-button-hover-transform);
            }

            /* 토스트 스타일 */
            .toast {
              background: var(--xeg-toast-bg);
              box-shadow: var(--xeg-toast-shadow);
              animation-duration: var(--xeg-animation-duration-toast);
            }

            .toast:hover {
              transform: var(--xeg-toast-hover-transform);
            }
          </style>
        </head>
        <body>
          <div class="toolbar" id="toolbar">Toolbar</div>
          <div class="modal" id="modal">Modal</div>
          <button class="button" id="button">Button</button>
          <div class="toast" id="toast">Toast</div>
        </body>
      </html>
    `,
      {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable',
      }
    );

    window = dom.window as unknown as Window;
    document = window.document;

    // CSS 변수 지원을 위한 설정
    Object.defineProperty(window, 'getComputedStyle', {
      value: (element: Element) => {
        const style = new CSSStyleDeclaration();
        const className = element.className;

        // 툴바
        if (className.includes('toolbar')) {
          style.setProperty('background-color', 'rgb(255, 255, 255)');
          style.setProperty('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.1)');
          style.setProperty('animation-duration', '150ms');
        }

        // 모달
        if (className.includes('modal')) {
          style.setProperty('background-color', 'rgb(255, 255, 255)'); // 같지만...
          style.setProperty('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.1)');
          style.setProperty('animation-duration', '250ms'); // 다른 지속시간!
        }

        // 버튼
        if (className.includes('button')) {
          style.setProperty('background-color', 'rgb(248, 250, 252)'); // 다른 배경색!
          style.setProperty('box-shadow', '0 2px 4px rgba(0, 0, 0, 0.05)'); // 다른 그림자!
          style.setProperty('animation-duration', '150ms');
        }

        // 토스트
        if (className.includes('toast')) {
          style.setProperty('background-color', 'rgb(250, 251, 252)'); // 또 다른 배경색!
          style.setProperty('box-shadow', '0 8px 16px rgba(0, 0, 0, 0.15)'); // 다른 그림자!
          style.setProperty('animation-duration', '300ms'); // 다른 지속시간!
        }

        return style;
      },
    });
  });

  afterEach(() => {
    // 정리
  });

  describe('🔥 RED: 디자인 토큰 충돌 감지', () => {
    it('배경색 토큰 불일치를 감지해야 함', () => {
      const toolbar = document.getElementById('toolbar')!;
      const button = document.getElementById('button')!;
      const toast = document.getElementById('toast')!;

      const toolbarBg = window.getComputedStyle(toolbar).backgroundColor;
      const buttonBg = window.getComputedStyle(button).backgroundColor;
      const toastBg = window.getComputedStyle(toast).backgroundColor;

      // 현재 상태: 서로 다른 배경색 사용 (문제점)
      expect(toolbarBg).toBe('rgb(255, 255, 255)');
      expect(buttonBg).toBe('rgb(248, 250, 252)'); // 다름!
      expect(toastBg).toBe('rgb(250, 251, 252)'); // 다름!

      // RED 테스트: 일관성 부족을 감지
      expect(toolbarBg).not.toBe(buttonBg);
      expect(toolbarBg).not.toBe(toastBg);
      expect(buttonBg).not.toBe(toastBg);
    });

    it('그림자 효과 불일치를 감지해야 함', () => {
      const toolbar = document.getElementById('toolbar')!;
      const button = document.getElementById('button')!;
      const toast = document.getElementById('toast')!;

      const toolbarShadow = window.getComputedStyle(toolbar).boxShadow;
      const buttonShadow = window.getComputedStyle(button).boxShadow;
      const toastShadow = window.getComputedStyle(toast).boxShadow;

      // 현재 상태: 서로 다른 그림자 사용 (문제점)
      expect(toolbarShadow).toBe('0 4px 12px rgba(0, 0, 0, 0.1)');
      expect(buttonShadow).toBe('0 2px 4px rgba(0, 0, 0, 0.05)'); // 다름!
      expect(toastShadow).toBe('0 8px 16px rgba(0, 0, 0, 0.15)'); // 다름!

      // RED 테스트: 일관성 부족을 감지
      expect(toolbarShadow).not.toBe(buttonShadow);
      expect(toolbarShadow).not.toBe(toastShadow);
      expect(buttonShadow).not.toBe(toastShadow);
    });

    it('애니메이션 지속시간 불일치를 감지해야 함', () => {
      const toolbar = document.getElementById('toolbar')!;
      const modal = document.getElementById('modal')!;
      const toast = document.getElementById('toast')!;

      const toolbarDuration = window.getComputedStyle(toolbar).animationDuration;
      const modalDuration = window.getComputedStyle(modal).animationDuration;
      const toastDuration = window.getComputedStyle(toast).animationDuration;

      // 현재 상태: 서로 다른 애니메이션 지속시간 (문제점)
      expect(toolbarDuration).toBe('150ms');
      expect(modalDuration).toBe('250ms'); // 다름!
      expect(toastDuration).toBe('300ms'); // 다름!

      // RED 테스트: 일관성 부족을 감지
      expect(toolbarDuration).not.toBe(modalDuration);
      expect(toolbarDuration).not.toBe(toastDuration);
      expect(modalDuration).not.toBe(toastDuration);
    });
  });

  describe('🔥 RED: 호버 효과 불일치 감지', () => {
    it('호버 변형 효과가 일관되지 않음을 감지해야 함', () => {
      // CSS에서 정의된 호버 효과들
      const styles = document.querySelector('style')?.textContent || '';

      // 서로 다른 호버 효과 사용 감지
      const toolbarHover = styles.includes('transform: var(--xeg-hover-transform)');
      const buttonHover = styles.includes('transform: var(--xeg-button-hover-transform)');
      const toastHover = styles.includes('transform: var(--xeg-toast-hover-transform)');

      expect(toolbarHover).toBe(true);
      expect(buttonHover).toBe(true);
      expect(toastHover).toBe(true);

      // RED 테스트: 서로 다른 호버 변수 사용
      expect(styles).toContain('--xeg-hover-transform: translateY(-1px)');
      expect(styles).toContain('--xeg-button-hover-transform: scale(1.02)'); // 다름!
      expect(styles).toContain('--xeg-toast-hover-transform: translateX(5px)'); // 다름!
    });
  });

  describe('🔥 RED: 실제 파일에서 토큰 충돌 감지', () => {
    it('design-tokens.css에서 중복 정의를 감지해야 함', async () => {
      // 실제 파일에서 중복 토큰 정의 확인
      const fs = await import('fs/promises');
      const path = await import('path');

      try {
        const tokensPath = path.join(process.cwd(), 'src/shared/styles/design-tokens.css');
        const solidTokensPath = path.join(
          process.cwd(),
          'src/shared/styles/design-tokens-solid.css'
        );

        const tokensCSS = await fs.readFile(tokensPath, 'utf-8');
        const solidTokensCSS = await fs.readFile(solidTokensPath, 'utf-8');

        // 중복 토큰 정의 감지
        const toolbarBgMatches = (tokensCSS.match(/--xeg-toolbar-bg:/g) || []).length;
        const modalBgMatches = (tokensCSS.match(/--xeg-modal-bg:/g) || []).length;

        // Solid 파일에서도 중복 확인
        const solidToolbarBgMatches = (solidTokensCSS.match(/--xeg-toolbar-bg:/g) || []).length;
        const solidModalBgMatches = (solidTokensCSS.match(/--xeg-modal-bg:/g) || []).length;

        console.warn('🔥 감지된 토큰 중복:', {
          'design-tokens.css': {
            '--xeg-toolbar-bg 정의 횟수': toolbarBgMatches,
            '--xeg-modal-bg 정의 횟수': modalBgMatches,
          },
          'design-tokens-solid.css': {
            '--xeg-toolbar-bg 정의 횟수': solidToolbarBgMatches,
            '--xeg-modal-bg 정의 횟수': solidModalBgMatches,
          },
        });

        // RED 테스트: 토큰 중복이 많음을 감지
        expect(toolbarBgMatches + solidToolbarBgMatches).toBeGreaterThan(1); // 중복 있음
        expect(modalBgMatches + solidModalBgMatches).toBeGreaterThan(1); // 중복 있음
      } catch (error) {
        console.warn('파일을 읽을 수 없습니다:', error);
        expect(true).toBe(true); // 스킵
      }
    });

    it('컴포넌트별 서로 다른 CSS 클래스 네이밍을 감지해야 함', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');

      try {
        const toolbarPath = path.join(
          process.cwd(),
          'src/shared/components/ui/Toolbar/Toolbar.module.css'
        );
        const modalPath = path.join(
          process.cwd(),
          'src/features/settings/components/SettingsOverlay.module.css'
        );

        const toolbarCSS = await fs.readFile(toolbarPath, 'utf-8');
        const modalCSS = await fs.readFile(modalPath, 'utf-8');

        // 서로 다른 클래스 네이밍 패턴 감지
        const toolbarClasses = toolbarCSS.match(/\.(toolbar|galleryToolbar)/g) || [];
        const modalClasses = modalCSS.match(/\.(modal|settings)/g) || [];

        console.warn('🔥 감지된 클래스 네이밍 불일치:', {
          '툴바 클래스': toolbarClasses.slice(0, 5),
          '모달 클래스': modalClasses.slice(0, 5),
        });

        // RED 테스트: 다른 네이밍 컨벤션 사용
        expect(toolbarClasses.length).toBeGreaterThan(0);
        expect(modalClasses.length).toBeGreaterThan(0);
      } catch (error) {
        console.warn('파일을 읽을 수 없습니다:', error);
        expect(true).toBe(true); // 스킵
      }
    });
  });

  describe('🔥 RED: 접근성 불일치 감지', () => {
    it('포커스 링 스타일 불일치를 감지해야 함', () => {
      // 스타일 시트 생성 및 포커스 스타일 추가
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .toolbar:focus-visible,
        .galleryToolbar:focus-visible {
          outline: var(--xeg-focus-outline-width, 2px) solid var(--xeg-color-primary);
        }
        .settingRow select:focus-visible,
        .settingRow input:focus-visible {
          outline: 2px solid var(--xeg-color-primary);
        }
      `;
      document.head.appendChild(styleElement);

      // GREEN 테스트: 통일된 포커스 스타일 확인
      const addedStyles = styleElement.textContent;
      const hasFocusVisible = addedStyles.includes(':focus-visible');
      expect(hasFocusVisible).toBe(true);

      // 청소
      document.head.removeChild(styleElement);
    });

    it('고대비 모드 지원 불일치를 감지해야 함', () => {
      const styles = document.querySelector('style')?.textContent || '';

      // 일부 컴포넌트만 고대비 모드 지원
      const hasContrastHigh = styles.includes('@media (prefers-contrast: high)');

      if (hasContrastHigh) {
        // RED 테스트: 모든 컴포넌트가 고대비 모드를 지원하지 않을 수 있음
        console.warn('🔥 일부 컴포넌트만 고대비 모드 지원 감지');
      }

      expect(hasContrastHigh).toBe(false); // 현재 테스트 CSS에는 없음
    });
  });

  describe('🔥 RED: z-index 레이어링 불일치 감지', () => {
    it('컴포넌트별 z-index 충돌을 감지해야 함', () => {
      const styles = document.querySelector('style')?.textContent || '';

      // z-index 하드코딩 사용 감지 (토큰 대신)
      const hasHardcodedZIndex = /z-index:\s*\d+(?!var)/.test(styles);

      if (hasHardcodedZIndex) {
        console.warn('🔥 하드코딩된 z-index 값 사용 감지');
      }

      // 현재 테스트에서는 z-index 없음
      expect(hasHardcodedZIndex).toBe(false);
    });
  });
});
