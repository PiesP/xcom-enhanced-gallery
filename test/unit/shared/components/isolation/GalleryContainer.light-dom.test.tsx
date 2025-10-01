/**
 * STYLE-ISOLATION-002 Phase 1 (RED): Light DOM + CSS Namespacing
 *     it('기존 스타일이 적용되어야 한다 (.xeg-button 클래스)', () => {
      const TestComponent = (): JSX.Element => {
        return (
          <div class="xeg-root">
            <button class="xeg-button" data-testid="styled-button">
              Test Button
            </button>
          </div>
        );
      };

      mountGallery(container, TestComponent, false);

      const button = container.querySelector('[data-testid="styled-button"]');
      expect(button).toBeTruthy();

      // 스타일시트가 존재하는지 확인
      const styleElement = document.head.querySelector('style[data-xeg-global]');
      expect(styleElement).toBeTruthy();
      if (styleElement?.textContent) {
        expect(styleElement.textContent).toContain('.xeg-button');
      }
    });ght DOM + CSS Namespacing으로 전환
 * - document.head에 XEG_CSS_TEXT 스타일시트 주입
 * - Shadow DOM 생성 없음
 * - 기존 스타일 적용 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { mountGallery, unmountGallery } from '@shared/components/isolation/GalleryContainer';

describe('STYLE-ISOLATION-002: Light DOM 스타일 주입', () => {
  let container: Element;
  const mockCssText = '.xeg-root { color: red; } .xeg-button { padding: 10px; }';

  beforeEach(() => {
    // Mock XEG_CSS_TEXT
    (globalThis as { XEG_CSS_TEXT?: string }).XEG_CSS_TEXT = mockCssText;

    container = document.createElement('div');
    container.id = 'test-gallery-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    unmountGallery(container);
    container.remove();

    delete (globalThis as { XEG_CSS_TEXT?: string }).XEG_CSS_TEXT;
  });

  describe('RED: Light DOM 스타일 주입 검증', () => {
    it('document.head에 xeg-root 스타일시트가 존재해야 한다', () => {
      const { createSignal } = getSolidCore();
      const [count] = createSignal(0);

      const TestComponent = (): JSX.Element => {
        return <div data-testid='test-content'>Count: {count()}</div>;
      };

      // useShadowDOM = false (Light DOM 모드)
      mountGallery(container, TestComponent, false);

      // 검증: document.head에 스타일시트 존재
      const styleElement = document.head.querySelector('style[data-xeg-global]');

      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('.xeg-root');
      expect(styleElement?.textContent).toContain('.xeg-button');
    });

    it('Shadow DOM이 생성되지 않아야 한다', () => {
      const TestComponent = (): JSX.Element => {
        return <div data-testid='no-shadow'>Light DOM Content</div>;
      };

      const result = mountGallery(container, TestComponent, false);

      // 검증: shadowRoot가 없어야 함
      expect(result.shadowRoot).toBeUndefined();
      expect(container.shadowRoot).toBeFalsy();
    });

    it('기존 스타일이 적용되어야 한다 (.xeg-button 클래스)', () => {
      const TestComponent = (): JSX.Element => {
        return (
          <div class='xeg-root'>
            <button class='xeg-button' data-testid='styled-button'>
              Test Button
            </button>
          </div>
        );
      };

      mountGallery(container, TestComponent, false);

      const button = container.querySelector('[data-testid="styled-button"]');
      expect(button).toBeTruthy();

      // 스타일시트가 존재하는지 확인
      const styleElement = document.head.querySelector('style[data-xeg-global]');
      expect(styleElement).toBeTruthy();
      if (styleElement) {
        expect(styleElement.textContent).toContain('.xeg-button');
      }
    });

    it('중복 스타일 주입을 방지해야 한다', () => {
      const TestComponent1 = (): JSX.Element => <div>First</div>;
      const TestComponent2 = (): JSX.Element => <div>Second</div>;

      const container1 = document.createElement('div');
      const container2 = document.createElement('div');
      document.body.appendChild(container1);
      document.body.appendChild(container2);

      try {
        // 현재 스타일 개수 확인
        const initialCount = document.head.querySelectorAll('style[data-xeg-global]').length;

        // 첫 번째 마운트
        mountGallery(container1, TestComponent1, false);
        const stylesAfterFirst = document.head.querySelectorAll('style[data-xeg-global]');

        // 두 번째 마운트
        mountGallery(container2, TestComponent2, false);
        const stylesAfterSecond = document.head.querySelectorAll('style[data-xeg-global]');

        // 두 번째 마운트 후에도 스타일 개수가 증가하지 않아야 함
        expect(stylesAfterSecond.length).toBe(stylesAfterFirst.length);
      } finally {
        // Cleanup
        unmountGallery(container1);
        unmountGallery(container2);
        container1.remove();
        container2.remove();
      }
    });
  });

  describe('기존 기능 유지 검증', () => {
    it('컴포넌트가 정상적으로 렌더링되어야 한다', () => {
      const { createSignal } = getSolidCore();
      const [text] = createSignal('Hello Light DOM');

      const TestComponent = (): JSX.Element => {
        return <div data-testid='rendered-content'>{text()}</div>;
      };

      mountGallery(container, TestComponent, false);

      const content = container.querySelector('[data-testid="rendered-content"]');
      expect(content?.textContent).toBe('Hello Light DOM');
    });

    it('이벤트 핸들러가 정상 동작해야 한다', () => {
      const mockHandler = vi.fn();
      const { createSignal } = getSolidCore();
      const [clicked, setClicked] = createSignal(false);

      const TestComponent = (): JSX.Element => {
        return (
          <button
            data-testid='event-button'
            onClick={() => {
              setClicked(true);
              mockHandler();
            }}
          >
            {clicked() ? 'Clicked' : 'Not Clicked'}
          </button>
        );
      };

      mountGallery(container, TestComponent, false);

      const button = container.querySelector('[data-testid="event-button"]');
      expect(button).toBeTruthy();

      (button as Element & { click: () => void }).click();

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(button.textContent).toBe('Clicked');
    });
  });
});
