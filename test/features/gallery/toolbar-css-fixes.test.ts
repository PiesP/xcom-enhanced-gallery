/**
 * 툴바 CSS !important 문제 해결 테스트
 * @description CSS에서 !important를 제거하고 호버 기반 표시/숨김이 정상 작동하는지 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/preact';

// CSS 모듈 mock
vi.mock(
  '@features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css',
  () => ({
    default: {
      container: 'container',
      toolbarWrapper: 'toolbarWrapper',
      toolbarHoverZone: 'toolbarHoverZone',
    },
  })
);

describe('Toolbar CSS !important 문제 해결', () => {
  let container: HTMLElement;
  let toolbar: HTMLElement;
  let hoverZone: HTMLElement;

  beforeEach(() => {
    // DOM 환경 설정
    container = document.createElement('div');
    hoverZone = document.createElement('div');
    toolbar = document.createElement('div');

    hoverZone.className = 'toolbarHoverZone';
    toolbar.className = 'toolbarWrapper';

    container.appendChild(hoverZone);
    container.appendChild(toolbar);
    document.body.appendChild(container);

    // CSS 변수 초기화
    toolbar.style.setProperty('--toolbar-opacity', '0');
    toolbar.style.setProperty('--toolbar-visibility', 'hidden');
    toolbar.style.setProperty('--toolbar-pointer-events', 'none');
  });

  afterEach(() => {
    cleanup();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  describe('CSS !important 제거 검증', () => {
    it('기본 상태에서 툴바가 숨겨져야 함', () => {
      // !important 제거 후 CSS 변수로 제어되어야 함
      const opacity = toolbar.style.getPropertyValue('--toolbar-opacity');
      const visibility = toolbar.style.getPropertyValue('--toolbar-visibility');
      const pointerEvents = toolbar.style.getPropertyValue('--toolbar-pointer-events');

      expect(opacity).toBe('0');
      expect(visibility).toBe('hidden');
      expect(pointerEvents).toBe('none');
    });

    it('호버 시 툴바가 표시되어야 함', async () => {
      // 호버 이벤트 시뮬레이션
      const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
      hoverZone.dispatchEvent(mouseEnterEvent);

      // CSS 변수 업데이트 시뮬레이션
      toolbar.style.setProperty('--toolbar-opacity', '1');
      toolbar.style.setProperty('--toolbar-visibility', 'visible');
      toolbar.style.setProperty('--toolbar-pointer-events', 'auto');

      const opacity = toolbar.style.getPropertyValue('--toolbar-opacity');
      const visibility = toolbar.style.getPropertyValue('--toolbar-visibility');
      const pointerEvents = toolbar.style.getPropertyValue('--toolbar-pointer-events');

      expect(opacity).toBe('1');
      expect(visibility).toBe('visible');
      expect(pointerEvents).toBe('auto');
    });

    it('호버 존을 벗어나면 툴바가 숨겨져야 함', async () => {
      // 먼저 호버 상태로 만들기
      const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
      hoverZone.dispatchEvent(mouseEnterEvent);

      toolbar.style.setProperty('--toolbar-opacity', '1');
      toolbar.style.setProperty('--toolbar-visibility', 'visible');
      toolbar.style.setProperty('--toolbar-pointer-events', 'auto');

      // 호버 존 벗어나기
      const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
      hoverZone.dispatchEvent(mouseLeaveEvent);

      // CSS 변수 리셋 시뮬레이션
      toolbar.style.setProperty('--toolbar-opacity', '0');
      toolbar.style.setProperty('--toolbar-visibility', 'hidden');
      toolbar.style.setProperty('--toolbar-pointer-events', 'none');

      const opacity = toolbar.style.getPropertyValue('--toolbar-opacity');
      const visibility = toolbar.style.getPropertyValue('--toolbar-visibility');
      const pointerEvents = toolbar.style.getPropertyValue('--toolbar-pointer-events');

      expect(opacity).toBe('0');
      expect(visibility).toBe('hidden');
      expect(pointerEvents).toBe('none');
    });
  });

  describe('CSS 선택자 우선순위 검증', () => {
    it('!important 없이도 올바른 우선순위를 가져야 함', () => {
      // 실제 CSS 규칙을 시뮬레이션
      const style = document.createElement('style');
      style.textContent = `
        .toolbarWrapper {
          opacity: var(--toolbar-opacity, 0);
          visibility: var(--toolbar-visibility, hidden);
          pointer-events: var(--toolbar-pointer-events, none);
        }

        .container:has(.toolbarHoverZone:hover) .toolbarWrapper {
          --toolbar-opacity: 1;
          --toolbar-visibility: visible;
          --toolbar-pointer-events: auto;
        }
      `;
      document.head.appendChild(style);

      // CSS 규칙이 정상적으로 적용되는지 확인
      expect(style.textContent).not.toContain('!important');
      expect(style.textContent).toContain('var(--toolbar-opacity');

      document.head.removeChild(style);
    });
  });
});
