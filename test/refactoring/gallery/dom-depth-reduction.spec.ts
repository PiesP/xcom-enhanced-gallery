// @ts-nocheck
/**
 * Phase 3 baseline 기록: Container 계층 단순화 이전 구조에서 depth > 4
 * CH2 이후(viewRoot+itemsList 통합)에는 depth <=4 가 정상 → 이 경우 본 테스트는 히스토리 목적상 skip
 */
/* eslint-env jsdom */
/* global document, console */
import { describe, it, expect, beforeAll } from 'vitest';
beforeAll(() => {
  (globalThis as any).__XEG_SILENCE_EVENT_MANAGER_WARN = true;
});

function createMedia(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `depth-${i}`,
    url: `https://example.com/depth/${i}.jpg`,
    type: 'image',
    filename: `depth_${i}.jpg`,
  }));
}

function calculateDepth(itemEl) {
  if (!itemEl) return 0;
  let depth = 1; // self 포함
  let current = itemEl;
  while (current && !current.classList.contains('xeg-gallery-renderer')) {
    current = current.parentElement;
    if (current) depth += 1;
    if (depth > 50) break; // 안전장치
  }
  return depth;
}

describe('Phase 3 Baseline (historical) - DOM depth > 4 before CH2', () => {
  beforeAll(async () => {
    const media = createMedia(5);
    const { galleryRenderer } = await import('@features/gallery/GalleryRenderer');
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
    await galleryRenderer.render(media, { startIndex: 0 });
    // 렌더링 완료 대기 (갤러리 등장까지)
    const start = Date.now();
    while (Date.now() - start < 1500) {
      const gallery = (globalThis as any).document.querySelector('[data-xeg-role="gallery"]');
      if (gallery && gallery.firstElementChild) break;
      await new Promise(r => (globalThis as any).setTimeout(r, 16));
    }
  });

  it('역사적 baseline: depth > 4 (CH2 이전). CH2 이후엔 skip', async () => {
    const gallery = document.querySelector('[data-xeg-role="gallery"]');
    expect(gallery).not.toBeNull();
    if (!gallery) return;
    let firstItem = gallery.querySelector('[data-index="0"]');
    if (!firstItem) {
      await new Promise(r => (globalThis as any).setTimeout(r, 50));
      firstItem = gallery.querySelector('[data-index="0"]');
    }
    expect(firstItem).not.toBeNull();
    const depth = calculateDepth(firstItem);
    if (depth <= 4) {
      console.warn('CH2 structure detected (depth <=4). Historical baseline assertion skipped.');
      return;
    }
    expect(depth).toBeGreaterThan(4);
  });
});
