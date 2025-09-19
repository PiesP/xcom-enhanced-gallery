/**
 * @file Vertical Gallery DOM structure (RED)
 * 목표: 중복 래퍼/클래스 제거를 TDD로 유도
 * 현재 상태: GalleryRenderer의 외부 컨테이너와 내부 GalleryContainer 모두
 *            'xeg-gallery-renderer' 클래스를 가져 2개가 생성됨 → RED
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { galleryRenderer as rendererSingleton } from '@/features/gallery/GalleryRenderer';
import { closeGallery } from '@/shared/state/signals/gallery.signals';

// DEPRECATED: This legacy RED test has been superseded by the GREEN guard test
// in `vertical-gallery-dom.test.tsx`. Keeping as skipped to avoid duplication
// while preserving history. It will be removed in a follow-up cleanup.
describe.skip('Vertical Gallery DOM – overlay/renderer class deduplication (LEGACY RED: skipped)', () => {
  let renderer: typeof rendererSingleton | null = null;

  beforeEach(() => {
    // 모듈의 싱글톤을 사용하여 중복 인스턴스 생성으로 인한 이중 렌더를 방지
    renderer = rendererSingleton;
  });

  afterEach(() => {
    try {
      // 상태/DOM 정리
      closeGallery();
      renderer?.destroy();
    } finally {
      renderer = null;
      // 잔여 노드 방지: 테스트가 DOM을 깨끗이 유지하도록 보조
      const nodes = Array.from(document.querySelectorAll('.xeg-gallery-renderer'));
      nodes.forEach(n => n.remove());
    }
  });

  it('should render exactly one .xeg-gallery-renderer element (target shape)', async () => {
    // Arrange: 간단한 미디어 1개로 렌더링
    const items = [
      { id: 'm-1', url: 'https://example.com/1.jpg', type: 'image' as const, filename: '1.jpg' },
    ];

    // Act: 갤러리 렌더
    await renderer!.render(items, { viewMode: 'vertical' });

    // Assert (RED): 현재는 2개이지만, 목표는 1개 → RED가 되어야 함
    const overlays = document.querySelectorAll('.xeg-gallery-renderer');
    expect(overlays.length).toBe(1);
  });
});
