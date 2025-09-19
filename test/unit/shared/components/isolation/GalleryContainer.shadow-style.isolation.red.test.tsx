/**
 * STYLE-ISOLATION-UNIFY P1 (RED): ShadowRoot 스타일 주입 단일화
 * 목표: Shadow DOM 사용 시, 번들된 전역 CSS 텍스트(window.XEG_CSS_TEXT)를 ShadowRoot에 주입하고
 *       소스 경로 @import('/src/...')를 사용하지 않는다.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPreact } from '@shared/external/vendors';
import { mountGallery, unmountGallery } from '@/shared/components/isolation/GalleryContainer';

describe('STYLE-ISOLATION-UNIFY P1 (RED)', () => {
  const h = getPreact().h;
  const origCssText = (globalThis as Record<string, unknown>).XEG_CSS_TEXT;

  beforeEach(() => {
    // 테스트용 번들 CSS 텍스트 주입 시뮬레이션
    (globalThis as Record<string, unknown>).XEG_CSS_TEXT =
      '/*test-css*/ .xeg-gallery-container{display:block;}';
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).XEG_CSS_TEXT = origCssText;
  });

  it("ShadowRoot에 전역 CSS 텍스트가 주입되고, '/src/' @import를 포함하지 않아야 한다", () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    try {
      const { shadowRoot } = mountGallery(
        host,
        h('div', { class: 'xeg-gallery-container' }, 'content'),
        true
      );
      expect(shadowRoot).toBeDefined();
      if (!shadowRoot) return;

      // ShadowRoot 내 style 요소 검사
      const styleEl = shadowRoot.querySelector('style');
      expect(styleEl).not.toBeNull();
      const css = styleEl?.textContent || '';
      // 기대: 번들 전역 CSS 텍스트가 포함되어야 함
      expect(css).toContain('/*test-css*/');
      // 기대: 소스 경로 @import는 포함되지 않아야 함
      expect(css).not.toMatch(/\/src\//);
    } finally {
      unmountGallery(host);
      host.remove();
    }
  });
});
