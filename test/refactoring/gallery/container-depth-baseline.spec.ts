import { describe, it, expect, beforeAll } from 'vitest';
beforeAll(() => {
  (globalThis as any).__XEG_SILENCE_EVENT_MANAGER_WARN = true;
});
import { measureDepth, queryRequired } from '../../utils/dom/measureDepth';

// Baseline: body > .xeg-gallery-renderer > viewRoot > itemsList > item = depth 5 (item 포함)
// Shadow DOM ON 시 depth 6 (shadowRoot 포함)

async function openGalleryMock() {
  // GalleryApp 경로 사용하여 ensureGalleryContainer 실행 보장
  const { GalleryApp } = await import('@features/gallery/GalleryApp');
  const app = new GalleryApp();
  const media: any[] = [
    { id: 'm1', url: 'https://example.com/1.jpg', type: 'image', width: 100, height: 100 },
    { id: 'm2', url: 'https://example.com/2.jpg', type: 'image', width: 100, height: 100 },
  ];
  await app.openGallery(media, 0);
}

describe('CH0 Baseline Container Depth', () => {
  beforeAll(async () => {
    await openGalleryMock();
  });

  it('비 Shadow DOM baseline depth 는 5 (item 포함)', () => {
    const rendererRoot = (globalThis as any).document.querySelector(
      '.xeg-gallery-renderer'
    ) as HTMLDivElement | null;
    if (!rendererRoot) {
      // Post-CH1 구조에서는 renderer 가 제거되므로 이 baseline 테스트는 기록용으로 skip
      return;
    }
    const viewRoot = queryRequired('[data-xeg-role="gallery"]', rendererRoot);
    const itemsList = queryRequired('[data-xeg-role="items-list"]', viewRoot);
    const firstItem = itemsList.firstElementChild as HTMLElement | null;
    expect(firstItem).toBeTruthy();
    const depth = measureDepth((globalThis as any).document.body, firstItem!);
    expect(depth).toBe(5);
  });

  it('Shadow DOM 옵션 사용 시 depth 6 (현재 옵션 off 이므로 skip 조건)', async () => {
    const rendererEl = (globalThis as any).document.querySelector('.xeg-gallery-renderer');
    if (!rendererEl) {
      // CH1 이후 구조에서 renderer 제거됨 → skip (baseline 용)
      return;
    }
    const hasShadow = !!rendererEl.shadowRoot;
    expect(hasShadow).toBe(false);
  });
});
