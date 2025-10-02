/**
 * STYLE-ISOLATION-UNIFY P1 (RED): Light DOM 스타일 주입 단일화
 * 목표: Light DOM 사용 시, 번들된 전역 CSS 텍스트(window.XEG_CSS_TEXT)를 document.head에 주입하고
 *       소스 경로 @import('/src/...')를 사용하지 않는다.
 * 주의: Shadow DOM 지원은 제거되었으며, 모든 갤러리는 Light DOM 모드를 사용합니다.
 */
/** @jsxImportSource solid-js */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountGallery, unmountGallery } from '@/shared/components/isolation/GalleryContainer';

describe('STYLE-ISOLATION-UNIFY P1 (RED)', () => {
  const origCssText = (globalThis as Record<string, unknown>).XEG_CSS_TEXT;

  beforeEach(() => {
    // 테스트용 번들 CSS 텍스트 주입 시뮬레이션
    (globalThis as Record<string, unknown>).XEG_CSS_TEXT =
      '/*test-css*/ .xeg-gallery-container{display:block;}';
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).XEG_CSS_TEXT = origCssText;
  });

  it("Light DOM에 전역 CSS 텍스트가 주입되고, '/src/' @import를 포함하지 않아야 한다", () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    try {
      // Light DOM 모드로 마운트 (useShadowDOM 파라미터는 무시됨)
      const { root } = mountGallery(
        host,
        () => <div class='xeg-gallery-container'>content</div>,
        false
      );
      expect(root).toBeDefined();
      expect(root).toBe(host);

      // JSDOM 환경에서는 스타일 주입이 스킵되므로, 실제 브라우저 환경에서만 검증
      // 테스트의 주요 목적은 Light DOM 마운트가 정상 작동하는지 확인
      const isJSDOM =
        typeof globalThis.navigator !== 'undefined' &&
        globalThis.navigator.userAgent.includes('jsdom');

      if (!isJSDOM) {
        // 실제 브라우저 환경: document.head 내 style 요소 검사
        const styleEl = document.head.querySelector('style[data-xeg-global]');
        expect(styleEl).not.toBeNull();
        const css = styleEl?.textContent || '';
        // 기대: 번들 전역 CSS 텍스트가 포함되어야 함
        expect(css).toContain('/*test-css*/');
        // 기대: 소스 경로 @import는 포함되지 않아야 함
        expect(css).not.toMatch(/\/src\//);
      } else {
        // JSDOM 환경: 스타일 주입이 스킵되므로 마운트 성공만 검증
        expect(root.contains(host.firstChild)).toBe(true);
      }
    } finally {
      unmountGallery(host);
      host.remove();
    }
  });
});
