// @ts-nocheck
/**
 * Phase 3 RED: Container 계층 단순화 - DOM depth 감소
 * 목표: 갤러리 렌더러(.xeg-gallery-renderer) ~ 첫 아이템 사이의 DOM 깊이를 4 이하로 축소.
 * 현재 구조는 더 깊으므로 이 테스트는 RED (실패) 상태여야 한다.
 * GREEN 단계에서 구조 단순화 후 기대: depth <= 4 로 통과.
 */
/* eslint-env jsdom */
/* global document */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { galleryRenderer } from '@/features/gallery';
import { closeGallery } from '@shared/state/signals/gallery.signals';

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

describe('Phase 3 RED: 갤러리 아이템 DOM 계층 깊이 감소', () => {
  beforeAll(async () => {
    const media = createMedia(5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await galleryRenderer.render(media, { viewMode: 'vertical' });
    await Promise.resolve();
  });

  afterAll(() => {
    closeGallery();
  });

  it('아이템에서 렌더러까지 DOM 깊이가 4 이하 (현재는 더 깊어 실패 예상)', () => {
    const list = document.querySelector('[data-xeg-role="items-list"]');
    expect(list).not.toBeNull();
    const firstItem = list ? list.querySelector('[data-index="0"]') : null;
    expect(firstItem).not.toBeNull();
    const depth = calculateDepth(firstItem);
    // RED: 현재 depth 가 4보다 커야 테스트가 실패한다.
    expect(depth, `현재 측정된 깊이(depth) = ${depth}, 목표 <= 4`).toBeLessThanOrEqual(4);
  });
});
