// @vitest-environment jsdom
/* global document, setTimeout */
import { describe, it, expect, beforeEach } from 'vitest';

// CH13: 갤러리 닫힘 후 overlay 비활성화 동작 테스트

async function openViaRenderer() {
  const { galleryRenderer } = await import('@features/gallery/GalleryRenderer');
  let root = document.querySelector('#xeg-gallery-root') as HTMLElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = 'xeg-gallery-root';
    document.body.appendChild(root);
  }
  const media: any[] = [
    { id: 'img1', url: 'https://example.com/1.jpg', type: 'image', filename: '1.jpg' },
  ];
  await galleryRenderer.render(media, { startIndex: 0 } as any);
  // 렌더 대기: gallery role selector 등장까지 최대 500ms 폴링
  const start = Date.now();
  while (Date.now() - start < 500) {
    if (document.querySelector('[data-xeg-role="gallery"]')) break;
    await new Promise(r => setTimeout(r, 16));
  }
  return { galleryRenderer, root };
}

describe('CH13 overlay deactivate', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('close 후 overlay 비활성화 (pointer-events none & 배경 제거)', async () => {
    const { galleryRenderer, root } = await openViaRenderer();
    expect(root.dataset.xegActive).toBe('true');
    expect(root.style.pointerEvents).toBe('auto');
    galleryRenderer.close();
    await new Promise(r => setTimeout(r, 30));
    expect(root.dataset.xegActive).toBe('false');
    expect(['none', ''].includes(root.style.pointerEvents)).toBe(true);
    expect(
      ['', 'transparent', 'transparent none repeat scroll 0% 0%'].includes(root.style.background)
    ).toBe(true);
  });

  it('재오픈 시 overlay 스타일 복원', async () => {
    const { galleryRenderer, root } = await openViaRenderer();
    galleryRenderer.close();
    await new Promise(r => setTimeout(r, 30));
    await galleryRenderer.render(
      [{ id: 'img2', url: 'https://example.com/2.jpg', type: 'image', filename: '2.jpg' }],
      { startIndex: 0 } as any
    );
    await new Promise(r => setTimeout(r, 30));
    expect(root.dataset.xegActive).toBe('true');
    expect(root.style.pointerEvents).toBe('auto');
    expect(root.style.background).toContain('rgba');
  });
});
