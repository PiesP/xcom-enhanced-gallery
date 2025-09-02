/* eslint-env jsdom */
/* global document, setTimeout */
import { describe, it, expect, beforeAll } from 'vitest';
beforeAll(() => {
  (globalThis as any).__XEG_SILENCE_EVENT_MANAGER_WARN = true;
});
import { measureDepth } from '../../utils/dom/measureDepth';

/**
 * CH2 GREEN: viewRoot + itemsList 통합 후 목표 depth <= 4 달성 검증
 * 기대 구조: body > #xeg-gallery-root > gallery(통합 컨테이너) > item = 4
 */

async function openGalleryForCH2() {
  const { galleryRenderer } = await import('@features/gallery/GalleryRenderer');
  // 테스트 전용 root 보장 (CH1 이후 ensureGalleryContainer 역할 간소화)
  let root = document.querySelector('#xeg-gallery-root') as HTMLElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = 'xeg-gallery-root';
    Object.assign(root.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      minHeight: '100vh',
      boxSizing: 'border-box',
      padding: '2rem',
      background: 'rgba(0,0,0,0.9)',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'scroll',
      pointerEvents: 'auto',
    });
    document.body.appendChild(root);
  }
  const media: any[] = [
    { id: 'c2-1', url: 'https://example.com/c2/1.jpg', type: 'image', width: 100, height: 100 },
    { id: 'c2-2', url: 'https://example.com/c2/2.jpg', type: 'image', width: 100, height: 100 },
  ];
  await galleryRenderer.render(media, { startIndex: 0 });
  // gallery & itemsList 등장 대기
  const start = Date.now();
  while (Date.now() - start < 1500) {
    const gallery = document.querySelector('[data-xeg-role="gallery"]');
    if (gallery && gallery.children.length > 0) break;
    await new Promise(r => setTimeout(r, 16));
  }
}

describe('CH2 GREEN: viewRoot + itemsList 통합 depth <= 4', () => {
  let depthMeasured: number | null = null;

  beforeAll(async () => {
    await openGalleryForCH2();
    const gallery = document.querySelector('[data-xeg-role="gallery"]') as HTMLElement | null;
    const firstItem = gallery?.firstElementChild as HTMLElement | null;
    if (firstItem) {
      depthMeasured = measureDepth(document.body, firstItem);
    }
  });

  it('통합 후 depth <= 4 조건을 만족한다', () => {
    expect(depthMeasured).not.toBeNull();
    expect(depthMeasured).toBeLessThanOrEqual(4);
  });
});
