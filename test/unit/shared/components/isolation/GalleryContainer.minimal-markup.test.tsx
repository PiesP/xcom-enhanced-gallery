/**
 * @fileoverview GalleryContainer minimal markup contract (guard)
 * 목적: 최소 래퍼(div) 클래스/속성만 유지하고, ESC 동작 및 Shadow/Light DOM 동등성 보장
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/preact';
import { GalleryContainer } from '@/shared/components/isolation/GalleryContainer';

// DOM 전역 타입을 직접 참조하지 않고, 런타임에서 안전하게 검사한다.
function assertMinimalWrapper(root: any) {
  // 단일 div 래퍼
  expect(String(root.tagName).toLowerCase()).toBe('div');

  // 필수 클래스: 신규(xeg-*) + 레거시 호환 1개("gallery-container")
  const classes = new Set(Array.from(root.classList ?? []));
  expect(classes.has('xeg-gallery-overlay')).toBe(true);
  expect(classes.has('xeg-gallery-container')).toBe(true);
  expect(classes.has('gallery-container')).toBe(true);

  // 불필요한 인라인 스타일/role/tabindex 없음 (접근성은 내부 UI에서 처리)
  const styleAttr = root.getAttribute ? root.getAttribute('style') : null;
  expect(styleAttr === null || String(styleAttr).trim() === '').toBe(true);
  expect(root.hasAttribute ? root.hasAttribute('role') : false).toBe(false);
  expect(root.hasAttribute ? root.hasAttribute('tabindex') : false).toBe(false);

  // 데이터 속성은 1개 이하 (data-xeg-gallery-container 허용)
  const attrs = Array.from(root.attributes ? root.attributes : []);
  const dataAttrs = attrs.filter((a: any) => String(a.name).startsWith('data-'));
  expect(dataAttrs.length).toBeLessThanOrEqual(1);
  if (dataAttrs.length === 1) {
    expect(String(dataAttrs[0].name)).toBe('data-xeg-gallery-container');
  }
}

describe('GalleryContainer (minimal markup contract)', () => {
  beforeEach(() => {
    // ensure clean DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('light DOM: 최소 래퍼 클래스/속성만 유지', () => {
    const { container, unmount } = render(
      <GalleryContainer className='' useShadowDOM={false}>
        <div>content</div>
      </GalleryContainer>
    );
    try {
      const root = container.firstElementChild as any;
      expect(root).not.toBeNull();
      if (!root) return;
      assertMinimalWrapper(root);
    } finally {
      unmount();
    }
  });

  it('ESC: onClose가 있으면 document keydown(Escape)으로 호출', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <GalleryContainer className='' useShadowDOM={false} onClose={onClose}>
        <div>content</div>
      </GalleryContainer>
    );
    try {
      // ESC
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      unmount();
    }
  });

  it('shadow DOM: 동등 계약(클래스는 host에 적용, ESC 동작 동일)', () => {
    const onClose = vi.fn();
    const { container, unmount } = render(
      <GalleryContainer className='' useShadowDOM={true} onClose={onClose}>
        <div>content</div>
      </GalleryContainer>
    );
    try {
      const host = container.firstElementChild as any;
      expect(host).not.toBeNull();
      if (!host) return;

      // host에는 동일 클래스/속성
      assertMinimalWrapper(host);

      // ESC 동작 동일
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      unmount();
    }
  });
});
