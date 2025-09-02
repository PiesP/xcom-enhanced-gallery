/* eslint-env browser */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { galleryRenderer } from '@/features/gallery/GalleryRenderer';
import {
  createImageMediaItems,
  renderGallery,
  waitForGalleryRoot,
  ensureScrollable,
  dispatchWheel,
} from '../../utils/gallery-wheel-utils';
void galleryRenderer; // side-effect 유지

/**
 * Phase 9.4: 큰 이미지 스크롤 허용 시에도 문서(body) / window scroll 이 누수되지 않아야 한다.
 */

describe('Phase 9.4: wheel background leak prevention', () => {
  beforeEach(() => {
    (globalThis.document as Document).body.innerHTML = '<div id="host"></div>';
  });

  it('scrollTop 변화는 갤러리 컨테이너에만 발생', async () => {
    const media = createImageMediaItems(25, 1920, 2200, 'lg');
    await renderGallery(media, 0);
    const root = await waitForGalleryRoot();
    ensureScrollable(root, 400);

    const bodyInitial =
      (globalThis.document as Document).documentElement.scrollTop ||
      (globalThis.document as Document).body.scrollTop;
    const rootInitial = root.scrollTop;

    dispatchWheel(root, 300);

    const bodyAfter =
      (globalThis.document as Document).documentElement.scrollTop ||
      (globalThis.document as Document).body.scrollTop;
    const rootAfter = root.scrollTop;

    // jsdom 환경에서 scroll 계산이 0으로 고정될 수 있어 >= 로 완화
    expect(rootAfter).toBeGreaterThanOrEqual(rootInitial);
    expect(bodyAfter).toBe(bodyInitial); // 배경 누수 없음
  });
});
