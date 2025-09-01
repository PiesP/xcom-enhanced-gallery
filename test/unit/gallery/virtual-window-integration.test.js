/**
 * Phase 2 GREEN: useVirtualWindow 통합 기본 동작 검증 (JS)
 */
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  globalThis.__XEG_FORCE_FLAGS__ = { FEATURE_VIRTUAL_SCROLL: true };
});

async function setupRenderer() {
  const galleryMod = await import('@/features/gallery');
  const constMod = await import('@/constants');
  return {
    galleryRenderer: galleryMod.galleryRenderer,
    FEATURE_VIRTUAL_SCROLL: constMod.FEATURE_VIRTUAL_SCROLL,
  };
}

function buildMedia(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `int-${i}`,
    url: `https://example.com/int/${i}.jpg`,
    type: 'image',
    filename: `int_${i}.jpg`,
  }));
}

describe('useVirtualWindow integration (Phase 2 GREEN)', () => {
  it('플래그 ON이면 300 아이템 중 화면 윈도우만 렌더', async () => {
    const { galleryRenderer, FEATURE_VIRTUAL_SCROLL } = await setupRenderer();
    expect(FEATURE_VIRTUAL_SCROLL).toBe(true);
    const items = buildMedia(300);
    await galleryRenderer.render(items, { viewMode: 'vertical' });
    await Promise.resolve();
    let list = null;
    try {
      if (typeof document !== 'undefined')
        list = document.querySelector('[data-xeg-role="items-list"]');
    } catch {}
    expect(list).not.toBeNull();
    const childCount = list ? list.children.length : 0;
    expect(childCount).toBeLessThanOrEqual(24);
  });
});
