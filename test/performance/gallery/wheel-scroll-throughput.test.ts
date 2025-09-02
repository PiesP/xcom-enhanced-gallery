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
 * Phase 9.4: 연속 wheel 이벤트 처리 평균 핸들러 시간 측정 (<1ms 목표, jsdom 환경 상대측정)
 * NOTE: jsdom 은 실제 레이아웃/스크롤 엔진이 단순하므로 측정은 순수 핸들러 오버헤드 중심.
 */

describe('Performance: wheel scroll throughput', () => {
  beforeEach(() => {
    (globalThis.document as Document).body.innerHTML = '<div id="perf"></div>';
  });

  it('average handler time < 1ms (synthetic)', async () => {
    const media = createImageMediaItems(60, 1600, 1800, 'pf');
    await renderGallery(media, 0);
    const root = await waitForGalleryRoot();
    ensureScrollable(root, 420);

    const WheelCtor: any = (globalThis as any).WheelEvent || Event;
    const iterations = 60;
    const startAll = performance.now();
    for (let i = 0; i < iterations; i++) {
      dispatchWheel(root, 160);
    }
    const total = performance.now() - startAll;
    const avg = total / iterations;

    // 보고 목적 로그
    // eslint-disable-next-line no-console
    console.log('[WheelThroughput] totalMs=%d avgMs=%d iterations=%d', total, avg, iterations);

    expect(avg).toBeLessThan(1);
  });
});
