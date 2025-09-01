/**
 * Phase 2 RED: FEATURE_VIRTUAL_SCROLL 비활성 시 기존 전체 렌더 동작 유지
 */
import { describe, it, expect } from 'vitest';
import { galleryRenderer } from '@/features/gallery';
import { FEATURE_VIRTUAL_SCROLL } from '@/constants';

// @ts-ignore 테스트 단순화를 위해 MediaInfo 구조 최소 필드만 사용
// MediaInfo 강제 캐스팅 헬퍼
function castMedia(obj) {
  return obj;
}
function buildMedia(n) {
  return Array.from({ length: n }, (_, i) =>
    castMedia({
      id: `plain-${i}`,
      url: `https://example.com/p/${i}.jpg`,
      type: 'image',
      filename: `p_${i}.jpg`,
    })
  );
}

describe('Virtual Scroll Flag OFF (Phase 2)', () => {
  it('비활성 상태에서는 모든 아이템이 DOM에 존재 (Baseline 유지)', async () => {
    const items = buildMedia(150);
    await galleryRenderer.render(items, { viewMode: 'vertical' });
    await Promise.resolve();
    const doc = globalThis && globalThis.document ? globalThis.document : undefined;
    const list = doc ? doc.querySelector('[data-xeg-role="items-list"]') : null;
    expect(list).not.toBeNull();
    const childCount = list ? list.children.length : 0;
    expect(FEATURE_VIRTUAL_SCROLL).toBe(false);
    expect(childCount).toBe(150);
  });
});
