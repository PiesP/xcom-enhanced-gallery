/**
 * @fileoverview GalleryContainer inline style policy (RED)
 * 요구사항: 오버레이/컨테이너 레이아웃은 인라인 스타일 대신 CSS 클래스 사용
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@test/utils/testing-library';
import h from 'solid-js/h';
import { GalleryContainer } from '@/shared/components/isolation/GalleryContainer';

describe('GalleryContainer (inline style policy)', () => {
  it('should not use inline overlay styles and should apply CSS classes', () => {
    const { container, unmount } = render(
      h(GalleryContainer, { className: '' }, h('div', {}, 'content'))
    );
    try {
      const root = container.firstElementChild;
      expect(root).not.toBeNull();
      if (!root) return;

      // 인라인 스타일 금지: style attribute가 비어있어야 함
      const styleAttr = root.getAttribute ? root.getAttribute('style') : null;
      expect(styleAttr === null || (styleAttr ?? '').trim() === '').toBe(true);

      // 필수 클래스 적용: 신규(xeg-*) + 레거시 호환 유지
      const classes = root.classList ? Array.from(root.classList) : [];
      expect(classes).toEqual(
        expect.arrayContaining([
          'xeg-gallery-overlay',
          'xeg-gallery-container',
          'gallery-container',
        ])
      );
    } finally {
      unmount();
      cleanup();
    }
  });
});
