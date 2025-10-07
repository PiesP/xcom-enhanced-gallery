/**
 * @fileoverview GalleryContainer inline style policy (RED)
 * 요구사항: 오버레이/컨테이너 레이아웃은 인라인 스타일 대신 CSS 클래스 사용
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { GalleryContainer } from '@/shared/components/isolation/GalleryContainer';

describe('GalleryContainer (inline style policy)', () => {
  it('should not use inline overlay styles and should apply CSS classes', () => {
    const { container, unmount } = render(() => (
      <GalleryContainer className=''>
        <div>content</div>
      </GalleryContainer>
    ));
    try {
      const root = container.firstElementChild;
      expect(root).not.toBeNull();
      if (!root) return;

      // 인라인 스타일 금지: style attribute가 비어있어야 함
      const styleAttr =
        root && (root as Element).getAttribute ? (root as Element).getAttribute('style') : null;
      expect(styleAttr === null || (styleAttr ?? '').trim() === '').toBe(true);

      // 필수 클래스 적용: 신규(xeg-*) + 레거시 호환 유지
      const classes =
        root && (root as Element).classList ? Array.from((root as Element).classList) : [];
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
