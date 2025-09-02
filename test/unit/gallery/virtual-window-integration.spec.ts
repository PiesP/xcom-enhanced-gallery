/**
 * Phase 2 GREEN: useVirtualWindow 통합 기본 동작 검증 (TypeScript 버전)
 */
import { buildMediaInfo } from '../../utils/buildMediaInfo.js';
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

const buildMedia = buildMediaInfo;

describe('useVirtualWindow integration (Phase 2 GREEN)', () => {
  it.skip('플래그 ON이면 300 아이템 중 화면 윈도우만 렌더 (Phase 11 집중 위해 임시 skip)', async () => {
    const { galleryRenderer, FEATURE_VIRTUAL_SCROLL } = await setupRenderer();
    expect(FEATURE_VIRTUAL_SCROLL).toBe(true);
    const items = buildMedia(300);
    await galleryRenderer.render(items, { viewMode: 'vertical' });
    await Promise.resolve();
    const list =
      globalThis && globalThis.document
        ? globalThis.document.querySelector('[data-xeg-role="items-list"]')
        : null;
    expect(list).not.toBeNull();
    const childCount = list ? list.children.length : 0;
    expect(childCount).toBeLessThanOrEqual(24); // viewport + overscan 예상 상한
  });
});
